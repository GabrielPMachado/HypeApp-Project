import {
  createUserWithEmailAndPassword,
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
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { FeedbackModal } from "@/components/FeedbackModal";
import { auth, db, googleWebClientId, isFirebaseConfigured } from "@/services/firebase";
import type { VibeTag } from "@/types/venue";
import { calcCoins, calcPoints, getLevelInfo } from "@/utils/gamification";
import { parseProfile, type Profile } from "@/utils/profile";

export const isGoogleSignInConfigured = googleWebClientId !== "";

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

  const value = useMemo(
    () => ({
      user,
      profile,
      coins: profile ? calcCoins(profile, profile.spentCoins) : 0,
      saveProfile,
      displayName: profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "",
      isAuthLoading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      resetPassword,
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
