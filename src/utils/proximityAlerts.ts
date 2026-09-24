import type { Venue } from "@/types/venue";
import { distanceKm } from "@/utils/geo";
import { rankingScore, scoreToLevel } from "@/utils/hype";

// 500m: perto o suficiente pra "você tá quase lá", sem avisar de um
// bairro inteiro de distância.
export const PROXIMITY_ALERT_RADIUS_KM = 0.5;

export interface ProximityCandidate {
  venue: Venue;
  distanceKm: number;
}

// Função pura (fácil de testar sem localização/notificação de verdade —
// ver useProximityAlerts em ProximityAlertsContext.tsx pro lado
// "de verdade"): quais bares perto o suficiente estão "lotados" agora e
// ainda não foram avisados (cooldown decidido por quem chama).
export function findProximityAlerts(
  venues: Venue[],
  location: { latitude: number; longitude: number },
  alreadyNotifiedIds: ReadonlySet<string>
): ProximityCandidate[] {
  return venues
    .filter((venue) => !alreadyNotifiedIds.has(venue.id))
    .map((venue) => ({ venue, distanceKm: distanceKm(location, venue) }))
    .filter(
      ({ venue, distanceKm: km }) =>
        km <= PROXIMITY_ALERT_RADIUS_KM && scoreToLevel(rankingScore(venue)) === "high"
    );
}
