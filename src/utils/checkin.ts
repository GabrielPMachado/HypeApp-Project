import * as Location from "expo-location";

import { distanceKm } from "@/utils/geo";

// 300m dá folga suficiente pro erro normal de GPS dentro de um prédio ou
// numa rua estreita, sem deixar avaliar o bar estando em outro bairro.
export const CHECK_IN_RADIUS_KM = 0.3;

export type CheckInFailureReason = "permission-denied" | "too-far" | "unavailable";

export type CheckInResult = { ok: true } | { ok: false; reason: CheckInFailureReason };

// Confere se a pessoa está fisicamente perto do bar antes de liberar
// avaliação (hype ou completa) — mais confiável que só o rate-limit por
// tempo, que não impede alguém de avaliar um lugar que nunca visitou.
export async function verifyCheckIn(venue: {
  latitude: number;
  longitude: number;
}): Promise<CheckInResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return { ok: false, reason: "permission-denied" };

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const km = distanceKm(
      { latitude: position.coords.latitude, longitude: position.coords.longitude },
      venue
    );
    return km <= CHECK_IN_RADIUS_KM ? { ok: true } : { ok: false, reason: "too-far" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export function checkInFailureMessage(reason: CheckInFailureReason): string {
  switch (reason) {
    case "permission-denied":
      return "Preciso da sua localização pra confirmar que você está no local antes de avaliar.";
    case "too-far":
      return "Você precisa estar no local pra avaliar — parece que você está longe daqui agora.";
    case "unavailable":
      return "Não deu pra confirmar sua localização agora. Verifica o GPS e tenta de novo.";
  }
}
