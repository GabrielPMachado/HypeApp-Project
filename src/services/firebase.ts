import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth, signInAnonymously } from "firebase/auth";
// getReactNativePersistence existe de verdade no build de React Native
// do SDK (o Metro resolve certinho em runtime, via a condição
// "react-native" do package.json) — só o TypeScript não enxerga esse
// build ao checar tipos, então só resta suprimir aqui.
// @ts-expect-error -- ver comentário acima
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase (Firestore + Auth), conforme a stack
// sugerida no README. As credenciais reais vêm do .env (nunca
// commitadas) — sem elas o app inteiro continua funcionando sobre
// dados mockados (ver VenuesContext.tsx), então clonar o projeto sem
// configurar o Firebase não quebra nada.
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
// "db"/"auth".
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const db = app ? getFirestore(app) : null;

// getReactNativePersistence guarda a sessão no AsyncStorage — sem isso
// o SDK usa persistência só em memória no React Native, e toda
// reabertura do app criaria um usuário anônimo NOVO (perdendo a
// identidade estável entre sessões, que é o ponto todo de autenticar).
export const auth = app
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : null;

// Login anônimo automático: sem tela, sem fricção — só dá ao
// dispositivo uma identidade estável (request.auth.uid) pras regras do
// Firestore exigirem em vez de aceitar escrita de qualquer um. Não
// bloqueia nada: se a chamada ainda não terminou quando o usuário tenta
// enviar um hype report, a regra simplesmente rejeita e o alerta de
// erro (ver VenuesContext.tsx) avisa — não trava a tela esperando.
if (auth) {
  signInAnonymously(auth).catch((error) => {
    console.error("Login anônimo falhou:", error);
  });
}
