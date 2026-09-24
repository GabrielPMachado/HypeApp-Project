import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { useVenues } from "@/context/VenuesContext";
import { findProximityAlerts } from "@/utils/proximityAlerts";

const STORAGE_KEY = "hypeapp:proximityAlertsEnabled";
// Não repete aviso do mesmo bar antes de 2h — sem isso a pessoa levaria
// uma notificação a cada ~150m andando perto do mesmo lugar lotado.
const COOLDOWN_MS = 2 * 60 * 60 * 1000;
const WATCH_DISTANCE_INTERVAL_M = 150;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface ProximityAlertsContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

const ProximityAlertsContext = createContext<ProximityAlertsContextValue | undefined>(undefined);

// Aviso de "tem um bar lotado pertinho" — SÓ funciona com o app aberto
// (em primeiro ou segundo plano no celular), nunca com o app fechado de
// vez. Localização "sempre" (background de verdade, monitorado mesmo
// com o app encerrado) pede uma permissão muito mais pesada — escrutínio
// forte da Play Store/App Store — e um jeito de checar hype com o app
// fechado exigiria um servidor (Cloud Function) rodando à parte, o que
// foge do escopo só-cliente deste projeto por enquanto. Essa é a versão
// honesta: funciona enquanto a pessoa anda pela cidade com o HypeApp
// aberto (mesmo minimizado).
//
// É uma preferência do APARELHO, não da conta — guardada local (não no
// Firestore), já que não faz sentido sincronizar entre dispositivos.
export function ProximityAlertsProvider({ children }: { children: ReactNode }) {
  const { venues } = useVenues();
  const [enabled, setEnabledState] = useState(false);
  const venuesRef = useRef(venues);
  venuesRef.current = venues;
  const lastNotifiedRef = useRef(new Map<string, number>());
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === "true") setEnabledState(true);
    });
  }, []);

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? "true" : "false").catch(() => {});
  };

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      // Falhou em pedir uma das duas permissões: desliga a preferência
      // de novo, em vez de deixar o toggle "ligado" sem fazer nada.
      if (cancelled) return;
      if (notifStatus !== "granted" || locStatus !== "granted") {
        setEnabled(false);
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: WATCH_DISTANCE_INTERVAL_M },
        (position) => {
          const now = Date.now();
          const alreadyNotified = new Set(
            [...lastNotifiedRef.current.entries()]
              .filter(([, at]) => now - at < COOLDOWN_MS)
              .map(([id]) => id)
          );

          const candidates = findProximityAlerts(
            venuesRef.current,
            { latitude: position.coords.latitude, longitude: position.coords.longitude },
            alreadyNotified
          );

          for (const { venue } of candidates) {
            lastNotifiedRef.current.set(venue.id, now);
            Notifications.scheduleNotificationAsync({
              content: {
                title: `🔥 ${venue.name} tá lotado agora`,
                body: `Você está pertinho — ${venue.address}`,
              },
              trigger: null,
            });
          }
        }
      );
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled]);

  return (
    <ProximityAlertsContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </ProximityAlertsContext.Provider>
  );
}

export function useProximityAlerts() {
  const context = useContext(ProximityAlertsContext);
  if (!context) {
    throw new Error("useProximityAlerts deve ser usado dentro de um ProximityAlertsProvider");
  }
  return context;
}
