import type { CityLocation } from "@/types/location";

// Lançamento exclusivo em Porto Alegre — só bairros dessa cidade entram
// aqui (ver mockVenues.ts pros bares reais cadastrados em cada um).
// Expansão pra outras cidades fica pra depois da validação local.
export const locations: CityLocation[] = [
  {
    id: "cidade-baixa-poa",
    neighborhood: "Cidade Baixa",
    city: "Porto Alegre",
    state: "RS",
    available: true,
  },
  {
    id: "bom-fim-poa",
    neighborhood: "Bom Fim",
    city: "Porto Alegre",
    state: "RS",
    available: true,
  },
  {
    id: "moinhos-poa",
    neighborhood: "Moinhos de Vento",
    city: "Porto Alegre",
    state: "RS",
    available: true,
  },
];

export const DEFAULT_LOCATION_ID = "cidade-baixa-poa";
