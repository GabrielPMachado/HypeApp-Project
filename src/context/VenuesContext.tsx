import { Feather } from "@expo/vector-icons";
import {
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
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

// Quanto esperar a primeira resposta do servidor antes de desistir e
// mostrar o erro com "Tentar de novo" (em vez de um skeleton eterno).
const LOAD_TIMEOUT_MS = 12000;

interface VenuesContextValue {
  venues: Venue[];
  // Só com Firebase: true até a primeira resposta do servidor; loadError
  // quando ela não vem (sem rede, erro de leitura). No modo mock, sempre
  // false — a lista já está pronta.
  isLoading: boolean;
  loadError: boolean;
  retryLoad: () => void;
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
// por critério + características + comentário). Com Firestore, as duas
// gravam de verdade num batch atômico (post + limite de frequência +
// contador de pontos); sem Firestore, só alteram o estado local.
// setVenueLogo segue local ao aparelho (URI da galeria).
export function VenuesProvider({ children }: { children: ReactNode }) {
  const { user, displayName } = useAuth();
  // Com Firebase, começa VAZIO e "carregando": mostrar o mock até o
  // Firestore responder faria a lista exibir números falsos e depois
  // "pular" pros reais. Sem Firebase (.env vazio) o mock já é o dado
  // final e o app roda 100% sobre ele, como sempre.
  const [venues, setVenues] = useState<Venue[]>(isFirebaseConfigured ? [] : mockVenues);
  const [isLoading, setLoading] = useState(isFirebaseConfigured);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Leitura em tempo real: cada bar é um documento solto em
  // "venues/{id}", sem subcoleções.
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    setLoading(true);
    setLoadError(false);

    const timeout = setTimeout(() => {
      setLoading(false);
      setLoadError(true);
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = onSnapshot(
      collection(db, "venues"),
      (snapshot) => {
        // Sem rede, o Firestore entrega antes um snapshot vazio "do cache"
        // — ignorar, senão a lista mostraria "Ainda não estamos por aqui".
        if (snapshot.metadata.fromCache && snapshot.empty) return;

        clearTimeout(timeout);
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
        setLoading(false);
        setLoadError(false);
      },
      (error) => {
        console.error("Bares: leitura falhou:", error);
        clearTimeout(timeout);
        setLoading(false);
        setLoadError(true);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [reloadKey]);

  const retryLoad = () => setReloadKey((key) => key + 1);

  const addHypeReport = (id: string, score: number) => {
    const newReport: HypeReport = {
      id: `${id}-hr-${Date.now()}`,
      authorName: displayName || "Você",
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
      // Pontos (ver utils/gamification.ts): guarda só o contador, e a
      // regra do Firestore só deixa ele subir +1 se o bar acima ganhou
      // mesmo um report NESTE batch — daí o lastAwardVenueId, que diz à
      // regra qual bar conferir.
      batch.update(doc(db, "users", user.uid), {
        hypeReportCount: increment(1),
        lastAwardVenueId: id,
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
      authorName: displayName || "Você",
      authorId: user?.uid,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      if (!user) return; // trava defensiva, ver addHypeReport

      // Mesmo desenho do hype report: bar + marca de limite (1 avaliação
      // por bar a cada 24h, ver regra do Firestore) + contador de pontos,
      // tudo num batch atômico.
      const batch = writeBatch(db);
      batch.update(doc(db, "venues", id), {
        reviews: arrayUnion(newReview),
        updatedAt: newReview.createdAt,
      });
      batch.set(doc(db, "venues", id, "reviewLimits", user.uid), {
        lastReviewAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", user.uid), {
        reviewCount: increment(1),
        lastAwardVenueId: id,
      });
      batch.commit().catch((error: { code?: string }) => {
        console.error("addReview falhou:", error);
        setFeedback(
          error.code === "permission-denied"
            ? {
                icon: "clock",
                title: "Não deu pra enviar",
                message: "Você já avaliou esse bar hoje — volta amanhã pra avaliar de novo.",
              }
            : {
                icon: "alert-circle",
                title: "Não deu pra enviar",
                message: "Tenta de novo em instantes.",
              }
        );
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

  // user/displayName nas deps: addHypeReport/addReview leem os dois por
  // closure — sem isso, logo depois do login elas ficariam presas ao
  // "user = null" do render anterior (e o envio seria ignorado em
  // silêncio) até algum bar mudar no Firestore.
  const value = useMemo(
    () => ({
      venues,
      isLoading,
      loadError,
      retryLoad,
      addHypeReport,
      addReview,
      setVenueLogo,
      reloadMockData,
      seedFirestoreFromMock,
    }),
    [venues, isLoading, loadError, user, displayName]
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
