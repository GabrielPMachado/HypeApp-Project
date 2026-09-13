import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VenueCard } from "@/components/VenueCard";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

export default function ListaScreen() {
  const { venues } = useVenues();

  // Ranking: mais "hype" primeiro.
  const ranked = [...venues].sort((a, b) => b.hypeScore - a.hypeScore);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>HYPEAPP</Text>
        </View>
        <Text style={styles.subtitle}>Ranking da Cidade Baixa agora</Text>
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(venue) => venue.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <VenueCard venue={item} />}
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
    paddingBottom: 12,
    gap: 4,
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
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  list: {
    padding: 20,
    gap: 12,
  },
});
