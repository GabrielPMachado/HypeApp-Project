import * as Location from "expo-location";

import { distanceKm } from "@/utils/geo";

// 300m dá folga suficiente pro erro normal de GPS dentro de um prédio ou
// numa rua estreita, sem deixar avaliar o bar estando em outro bairro.
export const CHECK_IN_RADIUS_KM = 0.3;

export type CheckInFailureReason = "permission-denied" | "too-far" | "unavailable";

export type CheckInResult = { ok: true } | { ok: false; reason: CheckInFailureReason };

// Sem isso, um aparelho que demora pra achar a posição (dentro de um bar
// fechado, GPS frio) deixava o botão girando pra sempre: aproveita a última
// posição conhecida do sistema quando ela é recente e precisa, e senão
// desiste do GPS depois de alguns segundos em vez de esperar indefinidamente.
const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;
const LAST_KNOWN_REQUIRED_ACCURACY_M = 150;
export const POSITION_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function currentPosition(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
    requiredAccuracy: LAST_KNOWN_REQUIRED_ACCURACY_M,
  }).catch(() => null);
  if (lastKnown) return lastKnown;

  return withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    POSITION_TIMEOUT_MS
  );
}

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
    const position = await currentPosition();
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
