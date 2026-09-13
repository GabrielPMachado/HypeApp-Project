import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import type { HypeLevel } from "@/types/venue";

const LABELS: Record<HypeLevel, string> = {
  low: "Vazio / De boas",
  medium: "Movimentado",
  high: "Lotado",
};

const DOT_COLORS: Record<HypeLevel, string> = {
  low: colors.hypeLow,
  medium: colors.hypeMedium,
  high: colors.hypeHigh,
};

export function HypeBadge({ level }: { level: HypeLevel }) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: DOT_COLORS[level] }]} />
      <Text style={styles.label}>{LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
