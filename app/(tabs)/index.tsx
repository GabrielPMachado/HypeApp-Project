import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader, subtitleStyles } from "@/components/AppHeader";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { VenueCard } from "@/components/VenueCard";
import { VenueDetailSheet } from "@/components/VenueDetailSheet";
import { useLocation } from "@/context/LocationContext";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { venuesWithin } from "@/utils/geo";
import { rankingScore } from "@/utils/hype";

export default function ListaScreen() {
  const { venues } = useVenues();
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

  // Ranking: só os bares dentro da região selecionada (pela distância,
  // não por "bairro do bar" — ver src/utils/geo.ts), mais "hype"
  // primeiro — reordena a cada novo report, porque a nota usada é a
  // mesma que aparece no card (rankingScore), não a semente fixa.
  const ranked = venuesWithin(venues, location).sort(
    (a, b) => rankingScore(b) - rankingScore(a)
  );

  // Busca sempre a versão mais recente do venue (não uma cópia
  // congelada no momento do toque), pra a folha refletir avaliações
  // novas na hora, sem precisar fechar e reabrir.
  const sheetVenue = venues.find((venue) => venue.id === selectedVenueId) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        location={location}
        onOpenLocationPicker={() => setPickerOpen(true)}
        subtitle={
          ranked.length > 0 && (
            <Text style={subtitleStyles.text}>
              Ranking de agora · {ranked.length} {ranked.length === 1 ? "local" : "locais"}
            </Text>
          )
        }
      />

      {ranked.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={28} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Ainda não estamos por aqui</Text>
          <Text style={styles.emptySubtitle}>
            {location.name} entra em breve. Que tal dar uma olhada na Cidade Baixa?
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
