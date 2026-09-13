import type { CityLocation } from "@/types/location";

// Cidade Baixa é a única região com parceiros reais no MVP (README).
// As demais entram como "em breve" — já dá pra buscar/selecionar, só
// não tem bares cadastrados ainda. Ajuda a validar a expansão futura.
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
    available: false,
  },
  {
    id: "moinhos-poa",
    neighborhood: "Moinhos de Vento",
    city: "Porto Alegre",
    state: "RS",
    available: false,
  },
  {
    id: "centro-floripa",
    neighborhood: "Centro",
    city: "Florianópolis",
    state: "SC",
    available: false,
  },
  {
    id: "vila-madalena-sp",
    neighborhood: "Vila Madalena",
    city: "São Paulo",
    state: "SP",
    available: false,
  },
  {
    id: "lapa-rj",
    neighborhood: "Lapa",
    city: "Rio de Janeiro",
    state: "RJ",
    available: false,
  },
];

export const DEFAULT_LOCATION_ID = "cidade-baixa-poa";
