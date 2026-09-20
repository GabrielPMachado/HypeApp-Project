import type { CityLocation } from "@/types/location";
import type { Venue } from "@/types/venue";

const EARTH_RADIUS_KM = 6371;

interface Point {
  latitude: number;
  longitude: number;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Distância em km entre dois pontos (fórmula de haversine).
export function distanceKm(a: Point, b: Point): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Bares dentro da região selecionada — decidido só pela distância até o
// centro, nunca por "a qual bairro o bar pertence" (bar nenhum pertence
// a bairro nenhum). Coordenada ausente/inválida vira NaN e a comparação
// dá false, então um documento mal formado só some da lista em vez de
// quebrar a tela.
export function venuesWithin(
  venues: Venue[],
  region: Pick<CityLocation, "latitude" | "longitude" | "radiusKm">
): Venue[] {
  return venues.filter((venue) => distanceKm(region, venue) <= region.radiusKm);
}
