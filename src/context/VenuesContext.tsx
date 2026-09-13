import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { mockVenues } from "@/data/mockVenues";
import type { Review, Venue } from "@/types/venue";

interface VenuesContextValue {
  venues: Venue[];
  addReview: (id: string, review: Omit<Review, "id" | "createdAt">) => void;
}

const VenuesContext = createContext<VenuesContextValue | undefined>(undefined);

// Provider único da lista de locais. Hoje serve dados mockados; quando o
// Firebase entrar, só o "miolo" (o useState/fetch) precisa mudar — os
// componentes que consomem useVenues() continuam iguais.
//
// Cada avaliação (addReview) já carrega o status de hype escolhido pelo
// usuário, a nota por critério e as características marcadas — tudo em
// um só registro. O hype exibido é derivado disso (ver src/utils/hype.ts).
export function VenuesProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>(mockVenues);

  const addReview = (id: string, review: Omit<Review, "id" | "createdAt">) => {
    const newReview: Review = {
      ...review,
      id: `${id}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === id ? { ...venue, reviews: [newReview, ...venue.reviews] } : venue
      )
    );
  };

  const value = useMemo(() => ({ venues, addReview }), [venues]);

  return <VenuesContext.Provider value={value}>{children}</VenuesContext.Provider>;
}

export function useVenues() {
  const context = useContext(VenuesContext);
  if (!context) {
    throw new Error("useVenues deve ser usado dentro de um VenuesProvider");
  }
  return context;
}
