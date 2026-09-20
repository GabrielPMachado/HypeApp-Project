import { Feather } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useLocation } from "@/context/LocationContext";
import { useVenues } from "@/context/VenuesContext";
import { geocodePlace } from "@/services/geocoding";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { CityLocation } from "@/types/location";
import type { Venue } from "@/types/venue";
import { venuesWithin } from "@/utils/geo";
import { rankingScore } from "@/utils/hype";

interface LocationPickerModalProps {
  visible: boolean;
  locations: CityLocation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

// Cada linha da lista é uma região (bairro cadastrado) ou um bar achado
// pelo nome/endereço — o bar é um resultado por si só, não precisa de
// bairro nenhum pra ser encontrado.
type ResultItem = { kind: "place"; place: CityLocation } | { kind: "venue"; venue: Venue };

const TRENDING_COUNT = 3;
const MAX_VENUE_RESULTS = 6;
const VENUE_RADIUS_KM = 0.8; // "bares ao redor" de um bar escolhido

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos pra busca ficar mais tolerante
    .toLowerCase();
}

export function LocationPickerModal({
  visible,
  locations,
  selectedId,
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  const [query, setQuery] = useState("");
  const [isGeocoding, setGeocoding] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const searchRequest = useRef(0);
  const { venues } = useVenues();
  const { location, setCustomLocation } = useLocation();

  // "Em alta agora" = regiões ordenadas pela média do hype atual dos bares
  // dentro delas (mesma nota mostrada nos cards/mapa, ver rankingScore) —
  // não é uma ordem fixa no código, muda sozinha conforme os reports
  // chegam. Sem bar nenhum por perto a média é 0 (fica por último). Não
  // memoizado de propósito: rankingScore depende do relógio, e são poucos
  // bares e regiões.
  const scoreByPlace = new Map<string, number>();
  for (const place of locations) {
    const nearby = venuesWithin(venues, place);
    scoreByPlace.set(
      place.id,
      nearby.length === 0
        ? 0
        : nearby.reduce((sum, venue) => sum + rankingScore(venue), 0) / nearby.length
    );
  }
  const trendingOrder = [...locations].sort(
    (a, b) => (scoreByPlace.get(b.id) ?? 0) - (scoreByPlace.get(a.id) ?? 0)
  );
  const trending = trendingOrder.slice(0, TRENDING_COUNT);

  // Índice de busca por região: além do próprio nome/cidade/estado, inclui
  // o endereço dos bares que estão dentro dela — assim digitar uma rua
  // (ex: "Padre Chagas") também encontra a região certa.
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const place of locations) {
      const streets = venuesWithin(venues, place)
        .map((venue) => venue.address)
        .join(" ");
      index.set(place.id, normalize(`${place.name} ${place.city} ${place.state} ${streets}`));
    }
    return index;
  }, [locations, venues]);

  const q = normalize(query.trim());
  const placeResults = q
    ? trendingOrder.filter((place) => searchIndex.get(place.id)?.includes(q))
    : trendingOrder;
  const venueResults = q
    ? venues
        .filter((venue) => normalize(`${venue.name} ${venue.address}`).includes(q))
        .slice(0, MAX_VENUE_RESULTS)
    : [];
  const results: ResultItem[] = [
    ...placeResults.map((place): ResultItem => ({ kind: "place", place })),
    ...venueResults.map((venue): ResultItem => ({ kind: "venue", venue })),
  ];

  const handleClose = () => {
    searchRequest.current += 1; // invalida uma geocodificação ainda em andamento
    setQuery("");
    setNotFound(false);
    setGeocoding(false);
    onClose();
  };

  const handleSelectPlace = (id: string) => {
    onSelect(id);
    handleClose();
  };

  // Escolher um bar centraliza a região nele: a lista e o mapa mostram
  // os bares ao redor (incluindo ele), esteja ou não num bairro cadastrado.
  const handleSelectVenue = (venue: Venue) => {
    setCustomLocation({
      id: `venue:${venue.id}`,
      name: venue.name,
      city: "",
      state: "",
      latitude: venue.latitude,
      longitude: venue.longitude,
      radiusKm: VENUE_RADIUS_KM,
    });
    handleClose();
  };

  // Busca de verdade livre: qualquer rua, bairro ou cidade do Brasil, mesmo
  // sem bar nenhum cadastrado ali (ex: "Ipanema"). Geocodifica — com viés
  // pra perto de onde a pessoa já está olhando — e vira a região atual;
  // sem bares por perto, a lista e o mapa avisam "ainda não temos bares
  // aqui". Se nem o geocodificador achar (sem rede, sem chave, nome
  // inexistente), avisa em vez de selecionar um lugar sem coordenadas.
  const handleSelectFreeText = async () => {
    const text = query.trim();
    if (!text || isGeocoding) return;

    const request = ++searchRequest.current;
    setNotFound(false);
    setGeocoding(true);
    const place = await geocodePlace(text, location);
    if (request !== searchRequest.current) return; // fechou o modal enquanto buscava

    setGeocoding(false);
    if (!place) {
      setNotFound(true);
      return;
    }
    setCustomLocation({
      ...place,
      id: `place:${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Escolher região</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={15} color={colors.textFaint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Busque por bar, rua, bairro ou cidade"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setNotFound(false);
              }}
              autoFocus
            />
          </View>

          {/* Atalhos fixos pras regiões mais hypadas agora — somem assim
              que a pessoa começa a digitar, pra não competir com o
              resultado da busca livre. */}
          {query.length === 0 && (
            <View style={styles.trendingRow}>
              {trending.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => handleSelectPlace(place.id)}
                  style={({ pressed }) => [
                    styles.trendingChip,
                    place.id === selectedId && styles.trendingChipActive,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Feather name="trending-up" size={11} color={colors.accent} />
                  <Text style={styles.trendingChipText}>{place.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) =>
              item.kind === "place" ? `place:${item.place.id}` : `venue:${item.venue.id}`
            }
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Não temos nenhum bar ou bairro cadastrado pra "{query}".
              </Text>
            }
            // A busca livre fica sempre disponível abaixo dos resultados,
            // não só quando não há nenhum: "Porto Alegre" já casa com os
            // bairros cadastrados (a cidade está no índice), mas a pessoa
            // pode querer a cidade inteira — ou uma rua sem bar nenhum.
            ListFooterComponent={
              query.trim().length > 0 ? (
                <View>
                  <Pressable
                    onPress={handleSelectFreeText}
                    disabled={isGeocoding}
                    style={({ pressed }) => [
                      styles.freeTextRow,
                      (pressed || isGeocoding) && styles.rowPressed,
                    ]}
                  >
                    <Feather name="search" size={15} color={colors.accent} />
                    <Text style={styles.freeTextRowText}>
                      {isGeocoding
                        ? "Buscando..."
                        : results.length > 0
                          ? `Buscar "${query.trim()}" no mapa`
                          : `Buscar "${query.trim()}" mesmo assim`}
                    </Text>
                  </Pressable>
                  {notFound && (
                    <Text style={styles.notFoundText}>
                      Não encontramos esse lugar. Confira o nome ou inclua a cidade.
                    </Text>
                  )}
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              if (item.kind === "venue") {
                return (
                  <Pressable
                    onPress={() => handleSelectVenue(item.venue)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowName}>{item.venue.name}</Text>
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {item.venue.address}
                      </Text>
                    </View>

                    <View style={styles.kindBadge}>
                      <Text style={styles.kindBadgeText}>Bar</Text>
                    </View>
                  </Pressable>
                );
              }

              const isSelected = item.place.id === selectedId;
              return (
                <Pressable
                  onPress={() => handleSelectPlace(item.place.id)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{item.place.name}</Text>
                    <Text style={styles.rowSubtitle}>
                      {item.place.city} — {item.place.state}
                    </Text>
                  </View>

                  {isSelected && <Feather name="check" size={16} color={colors.accent} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  trendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  trendingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  trendingChipActive: {
    borderColor: colors.accent,
  },
  trendingChipText: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  list: {
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  kindBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kindBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  freeTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  freeTextRowText: {
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
  },
  notFoundText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
