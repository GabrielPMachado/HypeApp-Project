import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPickerModal } from "@/components/LocationPickerModal";
import { VenueCard } from "@/components/VenueCard";
import { useLocation } from "@/context/LocationContext";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

export default function ListaScreen() {
  const { venues } = useVenues();
  const { location, locations, setLocationId } = useLocation();
  const [isPickerOpen, setPickerOpen] = useState(false);

  // Ranking: só os locais da região selecionada, mais "hype" primeiro.
  const ranked = venues
    .filter((venue) => venue.locationId === location.id)
    .sort((a, b) => b.hypeScore - a.hypeScore);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>HYPEAPP</Text>
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
          renderItem={({ item }) => <VenueCard venue={item} />}
        />
      )}

      <LocationPickerModal
        visible={isPickerOpen}
        locations={locations}
        selectedId={location.id}
        onSelect={setLocationId}
        onClose={() => setPickerOpen(false)}
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
