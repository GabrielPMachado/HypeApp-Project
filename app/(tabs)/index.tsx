import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPickerModal } from "@/components/LocationPickerModal";
import { VenueCard } from "@/components/VenueCard";
import { VenueDetailSheet } from "@/components/VenueDetailSheet";
import { useLocation } from "@/context/LocationContext";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { getCurrentHypeStatus } from "@/utils/hype";

// Nota usada pro ranking: a média real dos reports quando existir,
// senão a nota semente. É a mesma regra exibida no card (ver
// VenueCard/VenueDetailSheet) — assim a posição no ranking sempre
// bate com o número que a pessoa está vendo.
function rankingScore(venue: { hypeScore: number; hypeReports: Parameters<typeof getCurrentHypeStatus>[0] }) {
  return getCurrentHypeStatus(venue.hypeReports)?.score ?? venue.hypeScore;
}

export default function ListaScreen() {
  const { venues, reloadMockData } = useVenues();
  const { location, locations, setLocationId } = useLocation();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  // getCurrentHypeStatus depende do relógio (a janela de 30min/1h/1h30
  // progressiva e o "há quanto tempo" do último report) — sem re-render,
  // o app só recalcula isso quando algo mais dispara um (um toque, um
  // novo report). Esse "tick" força um re-render por segundo pra quem
  // só está olhando a lista ver a nota, o selo e o ranking se ajustarem
  // sozinhos conforme os reports envelhecem, sem precisar tocar em nada.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Ranking: só os locais da região selecionada, mais "hype" primeiro —
  // reordena a cada novo report, porque a nota usada é a mesma que
  // aparece no card (rankingScore), não a semente fixa.
  const ranked = venues
    .filter((venue) => venue.locationId === location.id)
    .sort((a, b) => rankingScore(b) - rankingScore(a));

  // Busca sempre a versão mais recente do venue (não uma cópia
  // congelada no momento do toque), pra a folha refletir avaliações
  // novas na hora, sem precisar fechar e reabrir.
  const sheetVenue = venues.find((venue) => venue.id === selectedVenueId) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>HYPEAPP</Text>

          {/* Só em dev: o Fast Refresh atualiza o código na hora, mas o
              useState que guarda os venues só lê mockVenues.ts uma vez —
              editar o arquivo não aparece sozinho na tela (ver
              reloadMockData em VenuesContext.tsx). Esse botão relê os
              dados sem precisar dar reload completo do app. */}
          {__DEV__ && (
            <Pressable
              onPress={reloadMockData}
              hitSlop={8}
              style={({ pressed }) => [styles.devReloadButton, pressed && styles.devReloadButtonPressed]}
            >
              <Feather name="refresh-cw" size={13} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

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

        {ranked.length > 0 && (
          <Text style={styles.subtitle}>
            Ranking de agora · {ranked.length} {ranked.length === 1 ? "local" : "locais"}
          </Text>
        )}
      </View>

      {ranked.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={28} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Ainda não estamos por aqui</Text>
          <Text style={styles.emptySubtitle}>
            {location.neighborhood} entra em breve. Que tal dar uma olhada na Cidade Baixa?
          </Text>
          <Pressable
            onPress={() => setLocationId("cidade-baixa-poa")}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Ver Cidade Baixa</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(venue) => venue.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => (
            <VenueCard
              venue={item}
              rank={index + 1}
              onPress={() => {
                setSelectedVenueId(item.id);
                setSheetOpen(true);
              }}
            />
          )}
        />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  wordmark: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.text,
    letterSpacing: 0.5,
  },
  devReloadButton: {
    marginLeft: "auto",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devReloadButtonPressed: {
    opacity: 0.7,
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
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  list: {
    padding: 20,
  },
  separator: {
    height: 24,
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
