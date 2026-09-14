import { Feather } from "@expo/vector-icons";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader, subtitleStyles } from "@/components/AppHeader";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { VenueDetailSheet } from "@/components/VenueDetailSheet";
import { useLocation } from "@/context/LocationContext";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { HypeLevel, Venue } from "@/types/venue";
import { rankingScore, scoreToLevel } from "@/utils/hype";

// Estilo escuro do Google Maps, feito com os próprios tokens de cor do
// app (ver src/theme/colors.ts) pra não destoar do resto da UI. Só tem
// efeito no Android — o iOS usa Apple Maps por padrão (sem chave
// nenhuma), que não aceita JSON de estilo customizado.
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1c1c22" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9497a0" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3a3a42" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1f2a20" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#232330" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#151519" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2b2b38" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1620" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5c5f68" }] },
];

const LEVEL_COLORS: Record<HypeLevel, string> = {
  low: colors.hypeLow,
  medium: colors.hypeMedium,
  high: colors.hypeHigh,
};

const LEVEL_LABELS: Record<HypeLevel, string> = {
  low: "De boas",
  medium: "Movimentado",
  high: "Lotado",
};

// Raio da "mancha de calor" de cada bar, em metros — cresce com a nota
// pra ficar mais evidente. Numa região compacta como a Cidade Baixa,
// bares próximos com nota alta acabam com manchas se sobrepondo, que é
// exatamente o efeito de "mapa de calor" que se busca aqui.
function heatRadiusMeters(score: number): number {
  return 60 + (score / 10) * 140;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Enquadra todos os bares da região selecionada numa única "region" de
// mapa, com uma folga de 80% ao redor do bounding box (e um mínimo de
// zoom pra não ficar colado demais quando os bares são poucos/próximos).
function regionForVenues(venuesInRegion: Venue[]): Region | null {
  if (venuesInRegion.length === 0) return null;

  const lats = venuesInRegion.map((v) => v.latitude);
  const lngs = venuesInRegion.map((v) => v.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.012),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.012),
  };
}

// Mapa de calor de verdade, via react-native-maps — a biblioteca não
// tem NENHUMA implementação web (nem só a tela: o simples import dela
// já quebra o bundle do navegador, porque o módulo chama uma função de
// codegen que só existe em React Native puro). Por isso o fallback pra
// web mora num arquivo à parte (mapa.web.tsx) que nunca importa esse
// pacote — o Metro escolhe automaticamente esse arquivo pra plataforma
// web e ESTE aqui pra iOS/Android. Testado de verdade só dá pra fazer
// no celular.
export default function MapaScreen() {
  const { venues } = useVenues();
  const { location, locations, setLocationId } = useLocation();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  // Mesma lógica do ranking da lista: sem isso, os círculos e cores só
  // se atualizariam quando algo mais disparasse um re-render.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const venuesInRegion = useMemo(
    () => venues.filter((venue) => venue.locationId === location.id),
    [venues, location.id]
  );

  // Recalcula só quando muda de bairro (não a cada tick) — senão a
  // pessoa não conseguiria dar zoom/pan livremente, porque a região
  // "resetaria" pro enquadramento padrão a cada segundo.
  const initialRegion = useMemo(() => regionForVenues(venuesInRegion), [location.id]);

  const sheetVenue = venues.find((venue) => venue.id === selectedVenueId) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        location={location}
        onOpenLocationPicker={() => setPickerOpen(true)}
        subtitle={
          venuesInRegion.length > 0 && (
            <Text style={subtitleStyles.text}>
              Mapa de calor · {venuesInRegion.length}{" "}
              {venuesInRegion.length === 1 ? "local" : "locais"}
            </Text>
          )
        }
      />

      {!initialRegion ? (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={28} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Ainda não estamos por aqui</Text>
          <Text style={styles.emptySubtitle}>
            {location.neighborhood} entra em breve. Que tal dar uma olhada na Cidade Baixa?
          </Text>
          <Pressable onPress={() => setLocationId("cidade-baixa-poa")} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Ver Cidade Baixa</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.mapWrap}>
          {/* key força remontar o mapa (e reaplicar initialRegion) ao
              trocar de bairro — initialRegion só é lido na primeira
              montagem, então sem isso o mapa não re-enquadraria sozinho. */}
          <MapView
            key={location.id}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            customMapStyle={DARK_MAP_STYLE}
          >
            {venuesInRegion.map((venue) => {
              const score = rankingScore(venue);
              const level = scoreToLevel(score);
              const tone = LEVEL_COLORS[level];
              const coordinate = { latitude: venue.latitude, longitude: venue.longitude };

              return (
                // Fragment, não View: o MapView nativo espera achar Circle/
                // Marker como filhos DIRETOS dele pra reconhecer como
                // overlays — uma View de verdade no meio quebraria isso.
                <Fragment key={venue.id}>
                  <Circle
                    center={coordinate}
                    radius={heatRadiusMeters(score)}
                    fillColor={`${tone}59`}
                    strokeColor={`${tone}99`}
                    strokeWidth={1}
                  />
                  <Marker
                    coordinate={coordinate}
                    title={venue.name}
                    description={`${score.toFixed(1)} · ${LEVEL_LABELS[level]}`}
                    tracksViewChanges={false}
                    onPress={() => {
                      setSelectedVenueId(venue.id);
                      setSheetOpen(true);
                    }}
                  >
                    <View style={[styles.markerDot, { backgroundColor: tone }]} />
                  </Marker>
                </Fragment>
              );
            })}
          </MapView>

          <View style={styles.legend}>
            {(["low", "medium", "high"] as HypeLevel[]).map((level) => (
              <View key={level} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: LEVEL_COLORS[level] }]} />
                <Text style={styles.legendText}>{LEVEL_LABELS[level]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <LocationPickerModal
        visible={isPickerOpen}
        locations={locations}
        selectedId={location.id}
        onSelect={setLocationId}
        onClose={() => setPickerOpen(false)}
      />

      <VenueDetailSheet
        visible={isSheetOpen}
        venue={sheetVenue}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrap: {
    flex: 1,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.background,
  },
  legend: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "rgba(10, 10, 13, 0.88)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 10,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
});
