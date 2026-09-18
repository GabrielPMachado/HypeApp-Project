import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase (Firestore), conforme a stack sugerida no
// README. As credenciais reais vêm do .env (nunca commitadas) — sem
// elas o app inteiro continua funcionando sobre dados mockados (ver
// VenuesContext.tsx), então clonar o projeto sem configurar o Firebase
// não quebra nada.
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "";

// initializeApp com um projectId vazio já lançaria erro — só inicializa
// de fato quando as credenciais estão presentes. Nos outros lugares
// (VenuesContext.tsx) sempre checar isFirebaseConfigured antes de usar
// "db".
export const db = isFirebaseConfigured ? getFirestore(initializeApp(firebaseConfig)) : null;
