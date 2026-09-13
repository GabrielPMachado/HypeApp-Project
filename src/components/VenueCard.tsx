import { Pressable, StyleSheet, Text, View } from "react-native";

import { HypeBadge } from "@/components/HypeBadge";
import { colors } from "@/theme/colors";
import type { HypeLevel, Venue } from "@/types/venue";

const STATUS_OPTIONS: { level: HypeLevel; emoji: string }[] = [
  { level: "low", emoji: "🟢" },
  { level: "medium", emoji: "🟡" },
  { level: "high", emoji: "🔴" },
];

interface VenueCardProps {
  venue: Venue;
  onUpdateHype: (level: HypeLevel) => void;
}

export function VenueCard({ venue, onUpdateHype }: VenueCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{venue.name}</Text>
        <Text style={styles.score}>⭐ {venue.hypeScore.toFixed(1)}</Text>
      </View>

      <HypeBadge level={venue.hypeLevel} />

      <View style={styles.tagsRow}>
        {venue.vibeTags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Atualização colaborativa em "dois toques" descrita no README */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option.level}
            onPress={() => onUpdateHype(option.level)}
            style={({ pressed }) => [
              styles.statusButton,
              venue.hypeLevel === option.level && styles.statusButtonActive,
              pressed && styles.statusButtonPressed,
            ]}
          >
            <Text style={styles.statusEmoji}>{option.emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  score: {
    fontSize: 14,
    color: colors.text,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  statusButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusButtonActive: {
    borderColor: colors.accent,
  },
  statusButtonPressed: {
    opacity: 0.6,
  },
  statusEmoji: {
    fontSize: 18,
  },
});
