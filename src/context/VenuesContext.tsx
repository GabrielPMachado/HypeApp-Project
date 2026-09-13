import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { mockVenues } from "@/data/mockVenues";
import type { HypeLevel, Venue } from "@/types/venue";

interface VenuesContextValue {
  venues: Venue[];
  updateHypeLevel: (id: string, hypeLevel: HypeLevel) => void;
}

const VenuesContext = createContext<VenuesContextValue | undefined>(undefined);

// Provider único da lista de locais. Hoje serve dados mockados; quando o
// Firebase entrar, só o "miolo" (o useState/fetch) precisa mudar — os
// componentes que consomem useVenues() continuam iguais.
export function VenuesProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>(mockVenues);

  const updateHypeLevel = (id: string, hypeLevel: HypeLevel) => {
    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === id
          ? { ...venue, hypeLevel, updatedAt: new Date().toISOString() }
          : venue
      )
    );
  };

  const value = useMemo(() => ({ venues, updateHypeLevel }), [venues]);

  return <VenuesContext.Provider value={value}>{children}</VenuesContext.Provider>;
}

export function useVenues() {
  const context = useContext(VenuesContext);
  if (!context) {
    throw new Error("useVenues deve ser usado dentro de um VenuesProvider");
  }
  return context;
}
