import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { FeedbackModal } from "@/components/FeedbackModal";
import type { StoreItem } from "@/data/storeCatalog";
import { auth, db, googleWebClientId, isFirebaseConfigured, storage } from "@/services/firebase";
import type { Venue, VibeTag } from "@/types/venue";
import { calcCoins, calcPoints, getLevelInfo } from "@/utils/gamification";
import { haptics } from "@/utils/haptics";
import { parseProfile, type Profile } from "@/utils/profile";

export const isGoogleSignInConfigured = googleWebClientId !== "";

// Janela em que o Firebase ainda aceita apagar a conta sem novo login (a
// regra dele é ~5 min; 4 dá folga pro relógio do aparelho).
const RECENT_LOGIN_WINDOW_MS = 4 * 60 * 1000;

// Campos que a própria pessoa edita no perfil (titleId null = voltar pro
// título do nível). As regras do Firestore validam tamanhos e se o item
// equipado é gratuito ou está no inventário.
export interface ProfilePatch {
  displayName?: string;
  bio?: string;
  favoriteVibes?: VibeTag[];
  avatarId?: string;
  frameId?: string;
  titleId?: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  // Moedas disponíveis: pontos ganhos − gastos na loja (0 sem perfil).
  coins: number;
  saveProfile: (patch: ProfilePatch) => Promise<void>;
  // Compra um item da loja: gasta as moedas e põe o item no inventário
  // numa escrita só (as regras do Firestore conferem preço e saldo).
  buyItem: (item: StoreItem) => Promise<void>;
  // Nome pra exibir/gravar nos posts: perfil do Firestore, senão o que o
  // Firebase Auth já tem da conta (cobre o instante antes do perfil
  // chegar e contas sem documento em users/).
  displayName: string;
  // Enquanto true, ainda não sabemos se tem sessão — o gate em
  // app/_layout.tsx espera isso virar false antes de decidir entre
  // AuthScreen e o app de verdade, pra não "piscar" a tela de login
  // pra quem já tá logado.
  isAuthLoading: boolean;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // Exclusão de conta (exigida pra publicar na Play Store: toda conta
  // criada no app precisa de um jeito de apagá-la de dentro do app). O
  // Firebase exige login "recente" pra isso — se a sessão for antiga,
  // lança auth/requires-recent-login e quem chama pede pra entrar de
  // novo antes de tentar outra vez.
  deleteAccount: () => Promise<void>;
  // Grafo social (ver comentário em followUser, mais abaixo no provider).
  followUser: (targetUid: string) => Promise<void>;
  unfollowUser: (targetUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levelUpTitle, setLevelUpTitle] = useState<string | null>(null);
  // Sem Firebase configurado não tem sessão nenhuma pra esperar — já
  // destrava (ver bypass do gate em app/_layout.tsx).
  const [isAuthLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const lastLevelRef = useRef<number | null>(null);
  const emailCleanedRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  // Sessões anônimas de antes do login obrigatório não têm perfil (ver o
  // gate em app/_layout.tsx) — só conta real assina o documento.
  const uid = user && !user.isAnonymous ? user.uid : null;

  // Perfil em tempo real: os contadores de pontos mudam a cada hype/
  // avaliação enviados, e o menu do usuário precisa refletir isso na hora.
  useEffect(() => {
    lastLevelRef.current = null;
    emailCleanedRef.current = false;
    if (!uid || !db) {
      setProfile(null);
      return;
    }

    const profileRef = doc(db, "users", uid);

    // includeMetadataChanges: sem isso o Firestore NÃO dispara de novo
    // quando a escrita otimista só passa de "pendente" pra "confirmada"
    // (os dados são iguais) — e é justamente nesse snapshot confirmado
    // que a subida de nível é detectada abaixo.
    return onSnapshot(
      profileRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.exists()) {
          setProfile(null);
          return;
        }

        const data = snap.data();

        // O perfil agora é público (qualquer usuário logado lê) e não
        // pode guardar dado pessoal: contas criadas antes disso têm o
        // e-mail no documento — apaga na primeira vez que a pessoa entra.
        if ("email" in data && !emailCleanedRef.current) {
          emailCleanedRef.current = true;
          updateDoc(profileRef, { email: deleteField() }).catch((error) =>
            console.error("Perfil: não consegui remover o e-mail antigo:", error)
          );
        }

        const next = parseProfile(data);
        setProfile(next);

        // Só compara com escrita CONFIRMADA: o snapshot otimista de uma
        // escrita ainda pendente pode ser derrubado pelas regras (ex:
        // cooldown) e não deve disparar "Subiu de nível!" à toa.
        if (snap.metadata.hasPendingWrites) return;
        const info = getLevelInfo(calcPoints(next));
        if (lastLevelRef.current !== null && info.level > lastLevelRef.current) {
          haptics.success();
          setLevelUpTitle(info.title);
        }
        lastLevelRef.current = info.level;
      },
      (error) => console.error("Perfil: leitura falhou:", error)
    );
  }, [uid]);

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    if (!auth || !db) return;
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, "users", credential.user.uid), {
      displayName: name,
      hypeReportCount: 0,
      reviewCount: 0,
      spentCoins: 0,
      inventory: [],
      createdAt: serverTimestamp(),
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth || !db || !isGoogleSignInConfigured) return;
    // Import dinâmico: é um módulo nativo, importar ele estático no topo
    // do arquivo quebra o app inteiro (erro "NativeModule is null") em
    // qualquer build que ainda não linkou esse módulo — mesmo problema
    // que já vimos com o AsyncStorage. Só carrega de verdade quando
    // alguém aperta "Continuar com Google" (e só chega aqui se
    // isGoogleSignInConfigured, ou seja, depois do rebuild nativo).
    const { GoogleSignin, isSuccessResponse } = await import(
      "@react-native-google-signin/google-signin"
    );
    GoogleSignin.configure({ webClientId: googleWebClientId });
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return; // usuário cancelou

    const { idToken, user: googleUser } = response.data;
    if (!idToken) throw new Error("Google não retornou um token de login.");

    const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));

    // Só cria users/{uid} se ainda não existir — em logins seguintes
    // (conta já tem perfil) não sobrescreve o que a pessoa já editou.
    const existing = await getDoc(doc(db, "users", result.user.uid));
    if (!existing.exists()) {
      // Sem nome na conta Google, usa a parte antes do @ — o documento é
      // público, então nunca o e-mail inteiro.
      const displayName = (googleUser.name || googleUser.email.split("@")[0]).slice(0, 30);
      await setDoc(doc(db, "users", result.user.uid), {
        displayName,
        hypeReportCount: 0,
        reviewCount: 0,
        spentCoins: 0,
        inventory: [],
        createdAt: serverTimestamp(),
      });
    }
  };

  const signOut = async () => {
    if (!auth) return;
    if (isGoogleSignInConfigured) {
      const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
      await GoogleSignin.signOut().catch(() => {});
    }
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth) return;
    await sendPasswordResetEmail(auth, email);
  };

  // Limpeza de dados pessoais antes de encerrar a conta (LGPD, ver Política
  // de Privacidade seção 05). Roda com a sessão ainda válida, porque as
  // regras do Firestore exigem request.auth em cada escrita:
  //  - fotos enviadas saem do bar e do Storage;
  //  - a relação de seguir some nos dois sentidos;
  //  - hypes e avaliações NÃO dá pra anonimizar daqui: são itens de um array
  //    dentro do bar e as regras não conseguem conferir de quem é cada item,
  //    então liberar essa edição deixaria qualquer conta alterar avaliações
  //    de outras. Em vez disso registra um pedido em deletionRequests/{uid}
  //    e a anonimização ("Conta excluída") é feita em até 15 dias por
  //    scripts/process-deletion-requests.cjs, que só age se a conta sumiu;
  //  - por fim apaga o próprio perfil.
  // Erros propagam de propósito: a exclusão só vale se a limpeza vale, e
  // cada passo é idempotente, então tentar de novo é seguro. Só a remoção
  // dos arquivos no Storage é tolerante a falha (o arquivo já pode ter
  // sumido, e o documento do bar é o que o app enxerga).
  //
  // ATENÇÃO: espelhar nas regras do Firestore —
  //   match /deletionRequests/{uid} {
  //     allow read, delete: if false;
  //     allow create, update: if request.auth != null && request.auth.uid == uid
  //       && request.resource.data.keys().hasOnly(['requestedAt'])
  //       && request.resource.data.requestedAt == request.time;
  //   }
  // A remoção de fotos usa a regra de venues "a lista de photos só encolhe";
  // following/followers, a regra que libera apagar pros dois lados (ver
  // comentário em followUser).
  const cleanupUserData = async (uidToRemove: string) => {
    if (!db) return;
    const database = db;

    const venuesSnap = await getDocs(collection(database, "venues"));
    const photosBatch = writeBatch(database);
    const storageDeletes: Promise<void>[] = [];
    let hasPhotoWrites = false;
    let hasContentToAnonymize = false;

    for (const venueDoc of venuesSnap.docs) {
      const venue = venueDoc.data() as Venue;
      if (
        (venue.hypeReports ?? []).some((r) => r.authorId === uidToRemove) ||
        (venue.reviews ?? []).some((r) => r.authorId === uidToRemove)
      ) {
        hasContentToAnonymize = true;
      }

      const photos = venue.photos ?? [];
      const ownPhotos = photos.filter((p) => p.authorId === uidToRemove);
      if (ownPhotos.length === 0) continue;

      hasPhotoWrites = true;
      photosBatch.update(venueDoc.ref, {
        photos: photos.filter((p) => p.authorId !== uidToRemove),
      });
      if (storage) {
        const bucket = storage;
        ownPhotos.forEach((photo) => {
          storageDeletes.push(deleteObject(ref(bucket, photo.url)).catch(() => {}));
        });
      }
    }

    if (hasPhotoWrites) await photosBatch.commit();
    await Promise.all(storageDeletes);

    const [followingSnap, followersSnap] = await Promise.all([
      getDocs(collection(database, "users", uidToRemove, "following")),
      getDocs(collection(database, "users", uidToRemove, "followers")),
    ]);
    const socialBatch = writeBatch(database);
    followingSnap.docs.forEach((followDoc) => {
      socialBatch.delete(followDoc.ref);
      socialBatch.delete(doc(database, "users", followDoc.id, "followers", uidToRemove));
    });
    followersSnap.docs.forEach((followerDoc) => {
      socialBatch.delete(followerDoc.ref);
      socialBatch.delete(doc(database, "users", followerDoc.id, "following", uidToRemove));
    });
    await socialBatch.commit();

    if (hasContentToAnonymize) {
      await setDoc(doc(database, "deletionRequests", uidToRemove), {
        requestedAt: serverTimestamp(),
      });
    }
    await deleteDoc(doc(database, "users", uidToRemove));
  };

  // O Firebase recusa apagar a conta com login antigo (em torno de 5 min).
  // Confere ANTES de mexer em qualquer dado — senão a limpeza rodaria e a
  // conta sobreviveria, já sem perfil. O perfil também precisa sair antes
  // do deleteUser: depois dele a sessão some e as regras negam o delete.
  const deleteAccount = async () => {
    const currentUser = auth?.currentUser;
    if (!auth || !currentUser) return;

    const lastSignIn = Date.parse(currentUser.metadata.lastSignInTime ?? "");
    if (Number.isFinite(lastSignIn) && Date.now() - lastSignIn > RECENT_LOGIN_WINDOW_MS) {
      throw Object.assign(new Error("Login antigo demais pra excluir a conta."), {
        code: "auth/requires-recent-login",
      });
    }

    await cleanupUserData(currentUser.uid);
    if (isGoogleSignInConfigured) {
      const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
      await GoogleSignin.signOut().catch(() => {});
    }
    await deleteUser(currentUser);
  };

  const saveProfile = async (patch: ProfilePatch) => {
    if (!db || !uid) return;
    const { titleId, ...rest } = patch;
    await updateDoc(doc(db, "users", uid), {
      ...rest,
      // titleId null = voltar pro título do nível (o campo some do doc).
      ...(titleId === undefined ? {} : { titleId: titleId === null ? deleteField() : titleId }),
    });
    // Mantém o nome do Firebase Auth em dia (é o fallback do displayName
    // enquanto o perfil não carrega).
    if (patch.displayName && auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: patch.displayName });
    }
  };

  const buyItem = async (item: StoreItem) => {
    if (!db || !uid || item.price <= 0) return;
    await updateDoc(doc(db, "users", uid), {
      spentCoins: increment(item.price),
      inventory: arrayUnion(item.id),
      lastPurchaseItemId: item.id,
    });
  };

  // Grafo social em duas subcoleções espelhadas (fan-out na escrita, não
  // na leitura): users/{eu}/following/{alvo} E users/{alvo}/followers/{eu}
  // juntos num batch — sem isso, ver "quem me segue" exigiria varrer o
  // "following" de todo mundo. As duas entram/saem sempre juntas.
  //
  // ATENÇÃO: espelhar nas regras do Firestore —
  //   match /users/{uid}/following/{targetUid} {
  //     allow read: if request.auth != null;
  //     allow create, update: if request.auth != null && request.auth.uid == uid
  //       && targetUid != uid && keys hasOnly(['createdAt']) && createdAt == request.time;
  //     allow delete: if request.auth != null
  //       && (request.auth.uid == uid || request.auth.uid == targetUid);
  //   }
  //   match /users/{uid}/followers/{followerUid} — simétrico: quem cria é o
  //   followerUid; apagar pode o followerUid ou o dono (uid), pra a limpeza
  //   da exclusão de conta conseguir desfazer as duas pontas.
  const followUser = async (targetUid: string) => {
    if (!db || !uid || uid === targetUid) return;
    const batch = writeBatch(db);
    batch.set(doc(db, "users", uid, "following", targetUid), { createdAt: serverTimestamp() });
    batch.set(doc(db, "users", targetUid, "followers", uid), { createdAt: serverTimestamp() });
    await batch.commit();
  };

  const unfollowUser = async (targetUid: string) => {
    if (!db || !uid) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "users", uid, "following", targetUid));
    batch.delete(doc(db, "users", targetUid, "followers", uid));
    await batch.commit();
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      coins: profile ? calcCoins(profile, profile.spentCoins) : 0,
      saveProfile,
      buyItem,
      displayName: profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "",
      isAuthLoading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      resetPassword,
      deleteAccount,
      followUser,
      unfollowUser,
    }),
    [user, profile, isAuthLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <FeedbackModal
        visible={levelUpTitle !== null}
        icon="award"
        title="Subiu de nível!"
        message={levelUpTitle ? `Agora você é ${levelUpTitle}.` : ""}
        onClose={() => setLevelUpTitle(null)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
