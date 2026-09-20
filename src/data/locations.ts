import type { CityLocation } from "@/types/location";

// Lançamento exclusivo em Porto Alegre. Estes são só ATALHOS de busca
// (bairros com bares de sobra pra mostrar de cara) — os bares não
// dependem deles: qualquer bar com coordenadas aparece no mapa e na lista
// de quem pesquisar por perto, esteja ou não dentro de um destes bairros
// (ver src/utils/geo.ts). Expansão pra outras cidades também não passa
// por cadastrar nada aqui: a busca livre geocodifica qualquer lugar.
const NEIGHBORHOOD_RADIUS_KM = 0.8;

export const locations: CityLocation[] = [
  {
    id: "cidade-baixa-poa",
    name: "Cidade Baixa",
    city: "Porto Alegre",
    state: "RS",
    latitude: -30.0407,
    longitude: -51.2247,
    radiusKm: NEIGHBORHOOD_RADIUS_KM,
  },
  {
    id: "bom-fim-poa",
    name: "Bom Fim",
    city: "Porto Alegre",
    state: "RS",
    latitude: -30.033,
    longitude: -51.214,
    radiusKm: NEIGHBORHOOD_RADIUS_KM,
  },
  {
    id: "moinhos-poa",
    name: "Moinhos de Vento",
    city: "Porto Alegre",
    state: "RS",
    latitude: -30.0247,
    longitude: -51.2064,
    radiusKm: NEIGHBORHOOD_RADIUS_KM,
  },
];

export const DEFAULT_LOCATION_ID = "cidade-baixa-poa";
