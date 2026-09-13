import type { CityLocation } from "@/types/location";

// Todas as regiões abaixo já têm bares reais cadastrados (ver
// mockVenues.ts) — a estratégia de lançamento do README foca a
// Cidade Baixa primeiro, mas o app já suporta múltiplas regiões.
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
  {
    id: "centro-floripa",
    neighborhood: "Centro",
    city: "Florianópolis",
    state: "SC",
    available: true,
  },
  {
    id: "vila-madalena-sp",
    neighborhood: "Vila Madalena",
    city: "São Paulo",
    state: "SP",
    available: true,
  },
  {
    id: "lapa-rj",
    neighborhood: "Lapa",
    city: "Rio de Janeiro",
    state: "RJ",
    available: true,
  },
];

export const DEFAULT_LOCATION_ID = "cidade-baixa-poa";
