import { Feather } from "@expo/vector-icons";
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { FeedbackModal } from "@/components/FeedbackModal";
import { useAuth } from "@/context/AuthContext";
import { mockVenues } from "@/data/mockVenues";
import { db, isFirebaseConfigured } from "@/services/firebase";
import type { HypeReport, Review, Venue } from "@/types/venue";

interface Feedback {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
}

interface VenuesContextValue {
  venues: Venue[];
  addHypeReport: (id: string, score: number) => void;
  addReview: (id: string, review: Omit<Review, "id" | "createdAt" | "authorName" | "authorId">) => void;
  setVenueLogo: (id: string, logoUrl: string) => void;
  reloadMockData: () => void;
  // Só pra dev: popula "venues/{id}" no Firestore com o mockVenues.ts
  // atual (um doc por bar, setDoc — idempotente, rodar de novo só
  // sobrescreve). Precisa da regra de escrita liberada em "venues"
  // (temporariamente) pra funcionar, ver README/plano do backend.
  seedFirestoreFromMock: () => Promise<void>;
}

const VenuesContext = createContext<VenuesContextValue | undefined>(undefined);

// Provider único da lista de locais. Lê do Firestore quando configurado
// (ver src/services/firebase.ts), senão cai pro mock — os componentes
// que consomem useVenues() não sabem a diferença, a interface é a mesma.
//
// Duas mutações bem separadas, espelhando os dois tipos de avaliação:
// addHypeReport (rápida, só o status de agora) e addReview (fixa, nota
// por critério + características + comentário). Por enquanto as duas
// (e setVenueLogo) só alteram o estado local, mesmo com Firestore
// configurado — sincronizar escrita é o próximo passo, depois deste
// aqui (leitura) validado.
export function VenuesProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  // Começa com o mock mesmo quando o Firestore está configurado — evita
  // a tela ficar vazia (e disparar o estado "ainda não estamos por
  // aqui") no instante entre montar e o primeiro snapshot chegar. Assim
  // que o Firestore responder, o efeito abaixo substitui pelos dados
  // reais.
  const [venues, setVenues] = useState<Venue[]>(mockVenues);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Leitura em tempo real: enquanto o Firebase não estiver configurado
  // (.env vazio), o app inteiro continua 100% sobre o mock, igual a
  // antes — nenhum outro comportamento muda. Passo 1 é só leitura: cada
  // bar é um documento solto em "venues/{id}", sem subcoleções; escrita
  // (addHypeReport/addReview/setVenueLogo) continua só local por
  // enquanto (ver comentários abaixo).
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const unsubscribe = onSnapshot(collection(db, "venues"), (snapshot) => {
      setVenues(
        snapshot.docs.map((doc) => {
          const venue = { ...(doc.data() as Venue), id: doc.id };
          // arrayUnion (ver addHypeReport/addReview abaixo) sempre
          // acrescenta no FIM do array — reordena por data aqui pra
          // manter "mais recente primeiro", que é o que a UI espera
          // (ver VenueDetailSheet.tsx, lista de comentários).
          return {
            ...venue,
            hypeReports: [...venue.hypeReports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
            reviews: [...venue.reviews].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
          };
        })
      );
    });

    return unsubscribe;
  }, []);

  const addHypeReport = (id: string, score: number) => {
    const newReport: HypeReport = {
      id: `${id}-hr-${Date.now()}`,
      authorName: profile?.displayName ?? "Você",
      authorId: user?.uid,
      score,
      createdAt: new Date().toISOString(),
    };

    // Com Firestore, não mexe no estado local — deixa o onSnapshot
    // acima refletir a escrita (ele já dispara na hora com o dado
    // pendente, antes mesmo do servidor confirmar). Mexer nos dois
    // lados duplicaria o report por um instante.
    if (isFirebaseConfigured && db) {
      // O gate em app/_layout.tsx (AuthScreen) garante que só se chega
      // aqui já autenticado — isso é só uma trava defensiva, não deveria
      // disparar na prática.
      if (!user) return;

      // Anti-abuso: 1 hype report por bar a cada 30min por usuário —
      // mesma janela usada pra calcular a nota (ver WINDOW_STEP_MIN em
      // hype.ts), pra ninguém "empilhar" vários votos dentro da mesma
      // janela e pesar mais que qualquer outra pessoa. A regra do
      // Firestore (não só o app) que garante isso de verdade, lendo
      // "venues/{id}/rateLimits/{uid}.lastReportAt" — ver firestore
      // rules. O batch grava o report E a marca do rate-limit juntos,
      // atômico: ou os dois entram, ou nenhum.
      const batch = writeBatch(db);
      batch.update(doc(db, "venues", id), {
        hypeReports: arrayUnion(newReport),
        updatedAt: newReport.createdAt,
      });
      batch.set(doc(db, "venues", id, "rateLimits", user.uid), {
        lastReportAt: serverTimestamp(),
      });
      batch.commit().catch((error: Error) => {
        console.error("addHypeReport falhou:", error);
        // permission-denied aqui normalmente é o rate-limit barrando
        // (ver regra), não precisa ser exatamente isso pro usuário —
        // "espera um pouco" já cobre os dois casos (bloqueado ou sem
        // permissão mesmo).
        setFeedback({
          icon: "clock",
          title: "Não deu pra enviar",
          message: "Espera um pouco antes de reportar esse bar de novo.",
        });
      });
      return;
    }

    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === id ? { ...venue, hypeReports: [newReport, ...venue.hypeReports] } : venue
      )
    );
  };

  const addReview = (id: string, review: Omit<Review, "id" | "createdAt" | "authorName" | "authorId">) => {
    const newReview: Review = {
      ...review,
      id: `${id}-rv-${Date.now()}`,
      authorName: profile?.displayName ?? "Você",
      authorId: user?.uid,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, "venues", id), {
        reviews: arrayUnion(newReview),
        updatedAt: newReview.createdAt,
      }).catch((error: Error) => {
        console.error("addReview falhou:", error);
        setFeedback({
          icon: "alert-circle",
          title: "Não deu pra enviar",
          message: "Tenta de novo em instantes.",
        });
      });
      return;
    }

    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === id ? { ...venue, reviews: [newReview, ...venue.reviews] } : venue
      )
    );
  };

  // Logo é local ao dispositivo por enquanto (URI do próprio celular,
  // vindo da galeria) — sem backend ainda pra guardar/servir a imagem
  // pra outros usuários.
  const setVenueLogo = (id: string, logoUrl: string) => {
    setVenues((prev) => prev.map((venue) => (venue.id === id ? { ...venue, logoUrl } : venue)));
  };

  // Só pra desenvolvimento: o Fast Refresh recarrega o módulo
  // mockVenues.ts sozinho quando o arquivo é salvo, mas o useState acima
  // só lê o valor inicial dele UMA vez (na primeira montagem) — é assim
  // que o Fast Refresh preserva estado entre edições. Resultado: editar
  // mockVenues.ts não aparece na tela até isso ser chamado (ou até um
  // reload completo do app). Chamar de novo simplesmente relê o "mockVenues"
  // importado, que a essa altura já é a versão nova do arquivo.
  // Com o Firestore configurado isso vira no-op: o onSnapshot acima já
  // mantém tudo atualizado sozinho, não tem "mock" pra recarregar.
  const reloadMockData = () => {
    if (isFirebaseConfigured) return;
    setVenues(mockVenues);
  };

  // Roda uma vez (botão de dev, ver AppHeader.tsx) pra carregar os bares
  // do mock pro Firestore de verdade — writeBatch em vez de um addDoc
  // por bar, uma escrita atômica só. Usa venue.id como id do doc (não
  // deixa o Firestore gerar um aleatório) pra ser idempotente: rodar de
  // novo depois de editar o mock só atualiza os mesmos documentos.
  const seedFirestoreFromMock = async () => {
    if (!isFirebaseConfigured || !db) return;
    const batch = writeBatch(db);
    for (const venue of mockVenues) {
      batch.set(doc(db, "venues", venue.id), venue);
    }
    await batch.commit();
  };

  const value = useMemo(
    () => ({ venues, addHypeReport, addReview, setVenueLogo, reloadMockData, seedFirestoreFromMock }),
    [venues]
  );

  return (
    <VenuesContext.Provider value={value}>
      {children}
      <FeedbackModal
        visible={feedback !== null}
        icon={feedback?.icon ?? "info"}
        title={feedback?.title ?? ""}
        message={feedback?.message ?? ""}
        onClose={() => setFeedback(null)}
      />
    </VenuesContext.Provider>
  );
}

export function useVenues() {
  const context = useContext(VenuesContext);
  if (!context) {
    throw new Error("useVenues deve ser usado dentro de um VenuesProvider");
  }
  return context;
}
