import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { HypeLevel } from "@/types/venue";

const LABELS: Record<HypeLevel, string> = {
  low: "De boas",
  medium: "Movimentado",
  high: "Lotado",
};

const TONES: Record<HypeLevel, { fg: string; bg: string }> = {
  low: { fg: colors.hypeLow, bg: colors.hypeLowMuted },
  medium: { fg: colors.hypeMedium, bg: colors.hypeMediumMuted },
  high: { fg: colors.hypeHigh, bg: colors.hypeHighMuted },
};

export function HypeBadge({ level }: { level: HypeLevel }) {
  const tone = TONES[level];

  return (
    <View style={[styles.container, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.label, { color: tone.fg }]}>{LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
  },
});
