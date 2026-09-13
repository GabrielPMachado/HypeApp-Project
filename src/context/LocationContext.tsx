import { createContext, useContext, useState, type ReactNode } from "react";

import { DEFAULT_LOCATION_ID, locations } from "@/data/locations";
import type { CityLocation } from "@/types/location";

interface LocationContextValue {
  location: CityLocation;
  locations: CityLocation[];
  setLocationId: (id: string) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

// Guarda a região selecionada pelo usuário (bairro/cidade) para filtrar
// o ranking de bares. Hoje só a Cidade Baixa tem dados reais; as demais
// existem pra já validar a busca/seleção pensando na expansão futura.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationId] = useState(DEFAULT_LOCATION_ID);

  const location =
    locations.find((loc) => loc.id === locationId) ??
    locations.find((loc) => loc.id === DEFAULT_LOCATION_ID)!;

  return (
    <LocationContext.Provider value={{ location, locations, setLocationId }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation deve ser usado dentro de um LocationProvider");
  }
  return context;
}
