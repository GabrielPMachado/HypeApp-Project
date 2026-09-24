import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { DEFAULT_LOCATION_ID, locations } from "@/data/locations";
import { db, isFirebaseConfigured } from "@/services/firebase";
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
  // Sinal de demanda pra expandir: registra "alguém quer o HypeApp aqui"
  // sem nenhum painel novo — a validação de qual região expandir pra
  // próxima é manual, olhando essa coleção no Console (mesmo espírito
  // de reports/, ver ReportModal.tsx).
  requestExpansion: (location: CityLocation) => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

// Guarda a região selecionada pelo usuário (bairro/cidade) para filtrar
// o ranking de bares. Hoje só a Cidade Baixa tem dados reais; as demais
// existem pra já validar a busca/seleção pensando na expansão futura.
export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useState<CityLocation>(
    () => locations.find((loc) => loc.id === DEFAULT_LOCATION_ID)!
  );

  const setLocationId = (id: string) => {
    const found = locations.find((loc) => loc.id === id);
    if (found) setLocation(found);
  };

  // Id determinístico (uid + coordenada arredondada): pedir de novo a
  // mesma região só atualiza a data em vez de duplicar o registro.
  const requestExpansion = async (target: CityLocation) => {
    if (!isFirebaseConfigured || !db || !user) return;
    const requestId = `${user.uid}_${target.latitude.toFixed(3)}_${target.longitude.toFixed(3)}`;
    await setDoc(doc(db, "locationRequests", requestId), {
      name: target.name,
      city: target.city,
      state: target.state,
      latitude: target.latitude,
      longitude: target.longitude,
      requestedBy: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <LocationContext.Provider
      value={{ location, locations, setLocationId, setCustomLocation: setLocation, requestExpansion }}
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
