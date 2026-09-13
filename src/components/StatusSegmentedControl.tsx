import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { HypeLevel } from "@/types/venue";

const STATUS_OPTIONS: { level: HypeLevel; label: string }[] = [
  { level: "low", label: "De boas" },
  { level: "medium", label: "Movimentado" },
  { level: "high", label: "Lotado" },
];

const TONES: Record<HypeLevel, { fg: string; bg: string }> = {
  low: { fg: colors.hypeLow, bg: colors.hypeLowMuted },
  medium: { fg: colors.hypeMedium, bg: colors.hypeMediumMuted },
  high: { fg: colors.hypeHigh, bg: colors.hypeHighMuted },
};

interface StatusSegmentedControlProps {
  value: HypeLevel;
  onChange: (level: HypeLevel) => void;
}

// Atualização colaborativa em "dois toques" descrita no README.
// Usado tanto no card da lista quanto na tela de detalhes do bar.
export function StatusSegmentedControl({ value, onChange }: StatusSegmentedControlProps) {
  return (
    <View style={styles.row}>
      {STATUS_OPTIONS.map((option) => {
        const isActive = value === option.level;
        const tone = TONES[option.level];
        return (
          <Pressable
            key={option.level}
            onPress={() => onChange(option.level)}
            style={({ pressed }) => [
              styles.button,
              isActive && { backgroundColor: tone.bg, borderColor: tone.fg },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, isActive && { color: tone.fg }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
  },
});
