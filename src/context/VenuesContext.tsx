import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { mockVenues } from "@/data/mockVenues";
import type { HypeLevel, HypeReport, Review, Venue } from "@/types/venue";

interface VenuesContextValue {
  venues: Venue[];
  addHypeReport: (id: string, level: HypeLevel) => void;
  addReview: (id: string, review: Omit<Review, "id" | "createdAt">) => void;
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

  const addHypeReport = (id: string, level: HypeLevel) => {
    const newReport: HypeReport = {
      id: `${id}-hr-${Date.now()}`,
      authorName: "Você",
      level,
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

  const value = useMemo(() => ({ venues, addHypeReport, addReview }), [venues]);

  return <VenuesContext.Provider value={value}>{children}</VenuesContext.Provider>;
}

export function useVenues() {
  const context = useContext(VenuesContext);
  if (!context) {
    throw new Error("useVenues deve ser usado dentro de um VenuesProvider");
  }
  return context;
}
