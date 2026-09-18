import { createContext, useContext, useState, type ReactNode } from "react";

import { DEFAULT_LOCATION_ID, locations } from "@/data/locations";
import type { CityLocation } from "@/types/location";

interface LocationContextValue {
  location: CityLocation;
  locations: CityLocation[];
  setLocationId: (id: string) => void;
  // Pra busca livre (ver LocationPickerModal): quando a pessoa digita um
  // lugar que não está na lista fixa (ex: "Ipanema"), não tem "id" pra
  // procurar — precisa poder virar a região atual direto, mesmo sem
  // nenhum bar cadastrado ali (cai no estado "ainda não estamos por
  // aqui", já existente nas telas).
  setCustomLocation: (location: CityLocation) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

// Guarda a região selecionada pelo usuário (bairro/cidade) para filtrar
// o ranking de bares. Hoje só a Cidade Baixa tem dados reais; as demais
// existem pra já validar a busca/seleção pensando na expansão futura.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<CityLocation>(
    () => locations.find((loc) => loc.id === DEFAULT_LOCATION_ID)!
  );

  const setLocationId = (id: string) => {
    const found = locations.find((loc) => loc.id === id);
    if (found) setLocation(found);
  };

  return (
    <LocationContext.Provider
      value={{ location, locations, setLocationId, setCustomLocation: setLocation }}
    >
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
