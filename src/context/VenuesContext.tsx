import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { mockVenues } from "@/data/mockVenues";
import type { HypeReport, Review, Venue } from "@/types/venue";

interface VenuesContextValue {
  venues: Venue[];
  addHypeReport: (id: string, score: number) => void;
  addReview: (id: string, review: Omit<Review, "id" | "createdAt">) => void;
  setVenueLogo: (id: string, logoUrl: string) => void;
  reloadMockData: () => void;
}

const VenuesContext = createContext<VenuesContextValue | undefined>(undefined);

// Provider único da lista de locais. Hoje serve dados mockados; quando o
// Firebase entrar, só o "miolo" (o useState/fetch) precisa mudar — os
// componentes que consomem useVenues() continuam iguais.
//
// Duas mutações bem separadas, espelhando os dois tipos de avaliação:
// addHypeReport (rápida, só o status de agora) e addReview (fixa, nota
// por critério + características + comentário).
export function VenuesProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>(mockVenues);

  const addHypeReport = (id: string, score: number) => {
    const newReport: HypeReport = {
      id: `${id}-hr-${Date.now()}`,
      authorName: "Você",
      score,
      createdAt: new Date().toISOString(),
    };
    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === id ? { ...venue, hypeReports: [newReport, ...venue.hypeReports] } : venue
      )
    );
  };

  const addReview = (id: string, review: Omit<Review, "id" | "createdAt">) => {
    const newReview: Review = {
      ...review,
      id: `${id}-rv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
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
  const reloadMockData = () => setVenues(mockVenues);

  const value = useMemo(
    () => ({ venues, addHypeReport, addReview, setVenueLogo, reloadMockData }),
    [venues]
  );

  return <VenuesContext.Provider value={value}>{children}</VenuesContext.Provider>;
}

export function useVenues() {
  const context = useContext(VenuesContext);
  if (!context) {
    throw new Error("useVenues deve ser usado dentro de um VenuesProvider");
  }
  return context;
}
