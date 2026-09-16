import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, Polygon } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LocationPickerModal } from "@/components/LocationPickerModal";
import { NEON_COLORS } from "@/components/NeonBorder";
import { VenueAvatar } from "@/components/VenueAvatar";
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
  // administrative.land_parcel (contorno de lotes/propriedades) só
  // aparece em zoom bem alto (nível de rua/propriedade) — não precisamos
  // disso nesse mapa, então desligamos.
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  // Prédios (landscape.man_made) marcados só pelo CONTORNO, com o
  // preenchimento igual ao chão vazio — em zoom de rua/quarteirão isso
  // desenha a silhueta de cada prédio; a diferença de tom só no fill
  // (testada antes) piora em zoom bem alto, porque ali o Google
  // classifica o chão visível inteiro como "man_made" (não só os
  // prédios), e um fill mais claro pinta a tela toda em vez de só os
  // quarteirões.
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#1c1c22" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#3a3a46" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1f2a20" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#232330" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#151519" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2b2b38" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1620" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5c5f68" }] },
];

// Map ID de um estilo vetorial escuro (configurado no Google Cloud
// Console > Map Management) — só com mapa vetorial os prédios aparecem
// em 3D de verdade. Sem essa variável (ex: quem clonar o projeto sem
// configurar o próprio Map ID), cai pro DARK_MAP_STYLE clássico acima
// (2D, sem prédio 3D, mas ainda no tema escuro).
const GOOGLE_MAPS_MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID;

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
  return 25 + (score / 10) * 65;
}

const METERS_PER_DEGREE_LAT = 111_320;

// O SDK do Google Maps não expõe a geometria dos prédios de verdade pro
// app (é dado interno do próprio mapa) — então isso é só uma aproximação:
// um quadradinho colorido centralizado no ponto do bar, não o contorno
// real do prédio. Serve pra "marcar esse aqui" visualmente.
function squareAround(latitude: number, longitude: number, halfSizeMeters: number) {
  const dLat = halfSizeMeters / METERS_PER_DEGREE_LAT;
  const dLng = halfSizeMeters / (METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180));
  return [
    { latitude: latitude + dLat, longitude: longitude - dLng },
    { latitude: latitude + dLat, longitude: longitude + dLng },
    { latitude: latitude - dLat, longitude: longitude + dLng },
    { latitude: latitude - dLat, longitude: longitude - dLng },
  ];
}

// Conversão aproximada de "delta" de region pra "zoom" de camera —
// precisamos de camera (não region) pra poder inclinar a vista
// (pitch) e revelar os prédios em 3D.
function deltaToZoom(longitudeDelta: number): number {
  return Math.log2(360 / longitudeDelta);
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Enquadra todos os bares da região selecionada numa única "region" de
// mapa, com uma folga de 40% ao redor do bounding box (e um mínimo de
// zoom que já aproxima o suficiente pra mostrar prédios/quarteirões,
// não só a malha de ruas).
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
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.004),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.004),
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
  const insets = useSafeAreaInsets();
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

  // Mesmo local "mais hypado agora" da Lista (ver VenueCard) — o
  // destaque especial no mapa (contorno dourado, moldura neon no
  // marcador) segue esse mesmo bar. Calculado direto no corpo do
  // render (sem useMemo): rankingScore depende do relógio, então
  // precisa recalcular a cada tick de 1s, não só quando venuesInRegion
  // muda de referência.
  const leaderVenueId =
    venuesInRegion.length === 0
      ? null
      : venuesInRegion.reduce((best, venue) =>
          rankingScore(venue) > rankingScore(best) ? venue : best
        ).id;

  // Recalcula só quando muda de bairro (não a cada tick) — senão a
  // pessoa não conseguiria dar zoom/pan livremente, porque a região
  // "resetaria" pro enquadramento padrão a cada segundo.
  const initialRegion = useMemo(() => regionForVenues(venuesInRegion), [location.id]);

  const sheetVenue = venues.find((venue) => venue.id === selectedVenueId) ?? null;

  // Header próprio pra essa tela: só o seletor de região, sem wordmark
  // nem legenda embaixo dele — fica com fundo transparente flutuando
  // sobre o mapa (em vez de uma barra sólida empurrando o mapa pra
  // baixo), pra sobrar mais mapa visível na tela.
  const floatingHeader = (
    <View style={[styles.floatingHeader, { top: insets.top + 10 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => [styles.locationButton, pressed && styles.locationButtonPressed]}
      >
        <Feather name="map-pin" size={13} color={colors.accent} />
        <Text style={styles.locationText} numberOfLines={1}>
          {location.neighborhood}, {location.city}
        </Text>
        <Feather name="chevron-down" size={14} color={colors.textFaint} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {!initialRegion ? (
        <View style={styles.container}>
          {floatingHeader}
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
        </View>
      ) : (
        <View style={styles.mapWrap}>
          {/* key força remontar o mapa (e reaplicar initialRegion) ao
              trocar de bairro — initialRegion só é lido na primeira
              montagem, então sem isso o mapa não re-enquadraria sozinho. */}
          <MapView
            key={location.id}
            style={StyleSheet.absoluteFill}
            // camera (não region) porque region não tem "pitch" — sem
            // inclinar a câmera, o Google Maps só mostra os prédios
            // achatados (2D), mesmo com showsBuildings ligado. Só inclina
            // de verdade quando o Map ID (mapa vetorial) está ativo — sem
            // ele não existe prédio 3D pra revelar, e a inclinação só
            // deixaria o mapa 2D comum mais difícil de ler.
            initialCamera={{
              center: { latitude: initialRegion.latitude, longitude: initialRegion.longitude },
              zoom: deltaToZoom(initialRegion.longitudeDelta),
              pitch: GOOGLE_MAPS_MAP_ID ? 55 : 0,
              heading: 0,
            }}
            // googleMapId (mapa vetorial, com prédios 3D de verdade) e
            // customMapStyle (JSON clássico) são mutuamente exclusivos —
            // com Map ID configurado, o estilo vem da nuvem; senão, cai
            // pro JSON embutido.
            {...(GOOGLE_MAPS_MAP_ID
              ? { googleMapId: GOOGLE_MAPS_MAP_ID }
              : { customMapStyle: DARK_MAP_STYLE })}
            showsBuildings
          >
            {venuesInRegion.map((venue) => {
              const score = rankingScore(venue);
              const level = scoreToLevel(score);
              const tone = LEVEL_COLORS[level];
              const coordinate = { latitude: venue.latitude, longitude: venue.longitude };
              const isLeader = venue.id === leaderVenueId;

              return (
                // Fragment, não View: o MapView nativo espera achar Circle/
                // Marker como filhos DIRETOS dele pra reconhecer como
                // overlays — uma View de verdade no meio quebraria isso.
                <Fragment key={venue.id}>
                  {/* Circle é uma forma nativa do mapa — só aceita cor
                      sólida (sem gradiente, sem giro). O líder ganha um
                      contorno dourado mais grosso em vez da cor de hype
                      padrão, pra se destacar como nos cards da Lista. */}
                  <Circle
                    center={coordinate}
                    radius={heatRadiusMeters(score)}
                    fillColor={`${tone}59`}
                    strokeColor={isLeader ? colors.accent : `${tone}99`}
                    strokeWidth={isLeader ? 3 : 1}
                  />
                  {/* Aproximação do prédio do bar (ver squareAround) — o
                      SDK não dá acesso ao contorno real do prédio, então
                      isso é só um quadrado colorido no ponto exato. */}
                  <Polygon
                    coordinates={squareAround(venue.latitude, venue.longitude, 9)}
                    fillColor={`${tone}40`}
                    strokeColor={isLeader ? colors.accent : tone}
                    strokeWidth={isLeader ? 3 : 2}
                  />
                  {/* Sem title/description: isso ativaria o callout nativo do
                      Google Maps, que rouba o toque antes do onPress abrir a
                      nossa folha de detalhe (mais completa que o callout).
                      tracksViewChanges precisa ficar true — com false o
                      Android tira uma "foto" da view ANTES dela terminar de
                      desenhar (fonte/iniciais), e o marcador fica em branco. */}
                  <Marker
                    coordinate={coordinate}
                    tracksViewChanges
                    onPress={() => {
                      setSelectedVenueId(venue.id);
                      setSheetOpen(true);
                    }}
                  >
                    {/* Logo/avatar do bar (ver VenueAvatar) no lugar de um
                        ponto genérico. O líder ganha a mesma paleta neon
                        do card (ver NeonBorder) como moldura — estática
                        aqui, já que animar um marcador de mapa exige
                        re-tirar um "print" da view a cada frame, algo
                        instável demais pra valer a pena. */}
                    {isLeader ? (
                      <LinearGradient
                        colors={NEON_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.markerRingNeon}
                      >
                        <View style={styles.markerRingInner}>
                          <VenueAvatar
                            name={venue.name}
                            logoUrl={venue.logoUrl}
                            vibeTag={venue.vibeTags[0]}
                            size={26}
                          />
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.markerRing, { borderColor: tone }]}>
                        <VenueAvatar
                          name={venue.name}
                          logoUrl={venue.logoUrl}
                          vibeTag={venue.vibeTags[0]}
                          size={26}
                        />
                      </View>
                    )}
                  </Marker>
                </Fragment>
              );
            })}
          </MapView>

          {floatingHeader}

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
    </View>
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
  markerRing: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 2,
    backgroundColor: colors.background,
  },
  markerRingNeon: {
    borderRadius: 10,
    padding: 3,
  },
  markerRingInner: {
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  floatingHeader: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  locationButtonPressed: {
    opacity: 0.7,
  },
  locationText: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
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
