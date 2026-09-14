import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HypeBadge } from "@/components/HypeBadge";
import { NeonBorder } from "@/components/NeonBorder";
import { VenueAvatar } from "@/components/VenueAvatar";
import { VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Venue } from "@/types/venue";
import { getCurrentHypeStatus } from "@/utils/hype";
import { getAggregateVibeTags } from "@/utils/vibeTags";

interface VenueCardProps {
  venue: Venue;
  rank: number;
  onPress: () => void;
}

export function VenueCard({ venue, rank, onPress }: VenueCardProps) {
  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const vibeTags = getAggregateVibeTags(venue);
  const isLeader = rank === 1;

  return (
    <NeonBorder active={isLeader} borderRadius={18} borderWidth={2}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          isLeader && styles.cardLeaderInner,
          pressed && styles.cardPressed,
        ]}
      >
      {isLeader && (
        <View style={styles.leaderBadge}>
          <Feather name="trending-up" size={11} color={colors.background} />
          <Text style={styles.leaderBadgeText}>Mais hypado agora</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <VenueAvatar
          name={venue.name}
          logoUrl={venue.logoUrl}
          vibeTag={venue.vibeTags[0]}
          size={52}
        />

        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {venue.address}
          </Text>
        </View>

        {/* Coluna com a nota de hype e, embaixo dela, quantas pessoas já
            avaliaram até agora — a posição no ranking já fica clara pela
            ordem da lista, sem precisar repetir um número no card. */}
        <View style={styles.rankColumn}>
          <View style={styles.scorePill}>
            <Feather name="zap" size={12} color={colors.accent} />
            <Text style={styles.scoreText}>{(hypeStatus?.score ?? venue.hypeScore).toFixed(1)}</Text>
          </View>

          <View style={styles.reportCountBadge}>
            <View style={styles.reportCountDot} />
            <Text style={styles.reportCountText}>{venue.hypeReports.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {venue.openingHours}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="dollar-sign" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{venue.priceRange}</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {hypeStatus ? (
          <HypeBadge level={hypeStatus.level} />
        ) : (
          <Text style={styles.noStatus}>Sem status</Text>
        )}
        {vibeTags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
          </View>
        ))}
      </View>
      </Pressable>
    </NeonBorder>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  // Quando é o líder, o card fica dentro de um NeonBorder — a própria
  // borda estática vira supérflua (o anel giratório já demarca o card).
  cardLeaderInner: {
    borderWidth: 0,
  },
  cardPressed: {
    opacity: 0.85,
  },
  leaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: -2,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rankColumn: {
    alignItems: "center",
    gap: 5,
  },
  reportCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 20,
    height: 16,
    borderRadius: 999,
    paddingHorizontal: 5,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportCountDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.hypeLow,
  },
  reportCountText: {
    fontSize: 9,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.hypeLow,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  address: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  metaRow: {
    flexDirection: "row",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  noStatus: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
