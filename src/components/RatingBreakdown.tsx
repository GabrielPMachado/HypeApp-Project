import { StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/RatingStars";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Rating } from "@/types/venue";

const CRITERIA: { key: keyof Rating; label: string }[] = [
  { key: "music", label: "Música" },
  { key: "price", label: "Custo-benefício" },
  { key: "service", label: "Atendimento" },
  { key: "ambiance", label: "Ambiente" },
];

export function RatingBreakdown({ rating }: { rating: Rating }) {
  return (
    <View style={styles.container}>
      {CRITERIA.map(({ key, label }) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.starsWithValue}>
            <RatingStars value={rating[key]} size={13} />
            <Text style={styles.value}>{rating[key].toFixed(1)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  starsWithValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    width: 24,
    textAlign: "right",
  },
});
