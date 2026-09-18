import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useLocation } from "@/context/LocationContext";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { CityLocation } from "@/types/location";
import { rankingScore } from "@/utils/hype";

interface LocationPickerModalProps {
  visible: boolean;
  locations: CityLocation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const TRENDING_COUNT = 3;

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos pra busca ficar mais tolerante
    .toLowerCase();
}

// Geocodifica o texto digitado (mesma chave do mapa estático em
// VenueLocationMap.tsx) pra achar coordenadas reais de QUALQUER lugar —
// mesmo um que a gente não tenha bar nenhum cadastrado (ex: "Ipanema").
// Sem isso a busca livre só selecionaria um nome sem localização real,
// e o mapa não teria pra onde apontar. Falha em silêncio (sem chave, ou
// lugar não encontrado): quem chama trata `null` como "sem coordenadas".
async function geocodePlace(text: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!GEOAPIFY_API_KEY) return null;
  try {
    // filter=countrycode:br: o app é focado no Brasil (lançamento em
    // Porto Alegre) — sem isso, um nome comum (ex: "Ipanema", que
    // também é uma cidade pequena em MG) pode resolver pro lugar
    // errado mundo afora.
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&filter=countrycode:br&limit=1&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const [longitude, latitude] = data?.features?.[0]?.geometry?.coordinates ?? [];
    if (typeof latitude !== "number" || typeof longitude !== "number") return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
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
  const { venues } = useVenues();
  const { setCustomLocation } = useLocation();

  // "Em alta agora" = bairros ordenados pela média do hype atual dos
  // seus bares (mesma nota mostrada nos cards/mapa, ver rankingScore) —
  // não é uma ordem fixa no código, muda sozinha conforme os reports
  // chegam. Bairro sem nenhum bar avaliado ainda fica por último (média 0).
  const trendingOrder = useMemo(() => {
    const scoreByLocation = new Map<string, number>();
    for (const location of locations) {
      const venuesHere = venues.filter((venue) => venue.locationId === location.id);
      const avg =
        venuesHere.length === 0
          ? 0
          : venuesHere.reduce((sum, venue) => sum + rankingScore(venue), 0) / venuesHere.length;
      scoreByLocation.set(location.id, avg);
    }
    return [...locations].sort(
      (a, b) => (scoreByLocation.get(b.id) ?? 0) - (scoreByLocation.get(a.id) ?? 0)
    );
  }, [locations, venues]);

  const trending = trendingOrder.slice(0, TRENDING_COUNT);

  // Índice de busca por bairro: além do próprio nome/cidade/estado,
  // inclui o endereço de cada bar cadastrado ali — assim digitar uma
  // rua (ex: "Padre Chagas") também encontra o bairro certo, não só
  // digitar o nome do bairro ou da cidade em si.
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const location of locations) {
      const streets = venues
        .filter((venue) => venue.locationId === location.id)
        .map((venue) => venue.address)
        .join(" ");
      index.set(
        location.id,
        normalize(`${location.neighborhood} ${location.city} ${location.state} ${streets}`)
      );
    }
    return index;
  }, [locations, venues]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return trendingOrder;
    return trendingOrder.filter((loc) => searchIndex.get(loc.id)?.includes(q));
  }, [trendingOrder, searchIndex, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    handleClose();
  };

  // Busca de verdade livre: mesmo pra um lugar que não temos cadastrado
  // (ex: "Ipanema" — nem é Porto Alegre), a pessoa ainda pode selecionar
  // exatamente o que digitou. Geocodifica pra achar coordenadas reais
  // (assim o mapa consegue mostrar o bairro mesmo sem bar nenhum ali) e
  // vira a região atual na hora — sem "id" na lista fixa pra procurar,
  // o que naturalmente cai no estado "ainda não estamos por aqui" já
  // existente nas telas, já que não há bar nenhum cadastrado com esse
  // locationId. Sem coordenadas (geocodificação falhou ou sem chave),
  // ainda funciona — só o mapa não tem pra onde apontar.
  const handleSelectFreeText = async () => {
    const trimmed = query.trim();
    if (!trimmed || isGeocoding) return;
    setGeocoding(true);
    const coords = await geocodePlace(trimmed);
    setGeocoding(false);
    setCustomLocation({
      id: `custom:${normalize(trimmed)}`,
      neighborhood: trimmed,
      city: "",
      state: "",
      available: false,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
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
              placeholder="Busque por rua, bairro ou cidade"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          {/* Atalhos fixos pros bairros mais hypados agora — somem assim
              que a pessoa começa a digitar, pra não competir com o
              resultado da busca livre. */}
          {query.length === 0 && (
            <View style={styles.trendingRow}>
              {trending.map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => handleSelect(loc.id)}
                  style={({ pressed }) => [
                    styles.trendingChip,
                    loc.id === selectedId && styles.trendingChipActive,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Feather name="trending-up" size={11} color={colors.accent} />
                  <Text style={styles.trendingChipText}>{loc.neighborhood}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View>
                <Text style={styles.emptyText}>
                  Ainda não temos nenhum bairro cadastrado pra "{query}".
                </Text>
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
                    {isGeocoding ? "Buscando..." : `Buscar "${query}" mesmo assim`}
                  </Text>
                </Pressable>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.neighborhood}>{item.neighborhood}</Text>
                    <Text style={styles.city}>
                      {item.city} — {item.state}
                    </Text>
                  </View>

                  {!item.available && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Em breve</Text>
                    </View>
                  )}

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
  neighborhood: {
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  city: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonText: {
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
});
