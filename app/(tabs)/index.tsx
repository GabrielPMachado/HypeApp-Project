import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VenueCard } from "@/components/VenueCard";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";

export default function ListaScreen() {
  const { venues, updateHypeLevel } = useVenues();

  // Ranking: mais "hype" primeiro.
  const ranked = [...venues].sort((a, b) => b.hypeScore - a.hypeScore);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>🍻 HypeApp</Text>
        <Text style={styles.subtitle}>Ranking da Cidade Baixa agora</Text>
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(venue) => venue.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <VenueCard
            venue={item}
            onUpdateHype={(level) => updateHypeLevel(item.id, level)}
          />
        )}
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
    paddingTop: 12,
    paddingBottom: 4,
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  list: {
    padding: 20,
    gap: 12,
  },
});
