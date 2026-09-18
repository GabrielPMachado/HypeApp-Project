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
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { auth, db, googleWebClientId, isFirebaseConfigured } from "@/services/firebase";

export const isGoogleSignInConfigured = googleWebClientId !== "";

interface Profile {
  displayName: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
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

async function loadProfile(uid: string): Promise<Profile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Profile;
  return { displayName: data.displayName, email: data.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Sem Firebase configurado não tem sessão nenhuma pra esperar — já
  // destrava (ver bypass do gate em app/_layout.tsx).
  const [isAuthLoading, setAuthLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setProfile(nextUser ? await loadProfile(nextUser.uid) : null);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    if (!auth || !db) return;
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, "users", credential.user.uid), {
      displayName: name,
      email,
      createdAt: serverTimestamp(),
    });
    // Não espera o próximo onAuthStateChanged pra ter o profile — ele
    // vai disparar de qualquer forma, mas setar aqui evita a UI mostrar
    // "Você" (perfil null) por um instante logo depois do cadastro.
    setProfile({ displayName: name, email });
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
      const displayName = googleUser.name ?? googleUser.email;
      await setDoc(doc(db, "users", result.user.uid), {
        displayName,
        email: googleUser.email,
        createdAt: serverTimestamp(),
      });
      setProfile({ displayName, email: googleUser.email });
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

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthLoading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      resetPassword,
    }),
    [user, profile, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
