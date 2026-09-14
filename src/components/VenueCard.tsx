import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HypeBadge } from "@/components/HypeBadge";
import { RatingStars } from "@/components/RatingStars";
import { VenueAvatar } from "@/components/VenueAvatar";
import { VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Venue } from "@/types/venue";
import { getCurrentHypeStatus } from "@/utils/hype";
import { getAggregateRating, getOverallRating } from "@/utils/rating";
import { getAggregateVibeTags } from "@/utils/vibeTags";

interface VenueCardProps {
  venue: Venue;
  rank: number;
  onPress: () => void;
}

export function VenueCard({ venue, rank, onPress }: VenueCardProps) {
  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const aggregateRating = getAggregateRating(venue.reviews);
  const vibeTags = getAggregateVibeTags(venue);
  const isLeader = rank === 1;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isLeader && styles.cardLeader,
        pressed && styles.cardPressed,
      ]}
    >
      {isLeader && (
        <View style={styles.leaderBadge}>
          <Feather name="trending-up" size={11} color={colors.background} />
          <Text style={styles.leaderBadgeText}>Mais quente agora</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <VenueAvatar
            name={venue.name}
            logoUrl={venue.logoUrl}
            vibeTag={venue.vibeTags[0]}
            size={52}
          />
          <View style={[styles.rankBadge, isLeader && styles.rankBadgeLeader]}>
            <Text style={[styles.rankText, isLeader && styles.rankTextLeader]}>{rank}</Text>
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>

        <View style={styles.scorePill}>
          <Feather name="zap" size={12} color={colors.accent} />
          <Text style={styles.scoreText}>{venue.hypeScore.toFixed(1)}</Text>
        </View>
      </View>

      {hypeStatus ? (
        <HypeBadge level={hypeStatus.level} />
      ) : (
        <Text style={styles.noStatus}>Ainda sem status de hype</Text>
      )}

      <View style={styles.tagsRow}>
        {vibeTags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        {aggregateRating ? (
          <>
            <RatingStars value={getOverallRating(aggregateRating)} size={13} />
            <Text style={styles.footerText}>
              {venue.reviews.length} {venue.reviews.length === 1 ? "avaliação" : "avaliações"}
            </Text>
          </>
        ) : (
          <Text style={styles.footerText}>Sem avaliações ainda</Text>
        )}
        <View style={{ flex: 1 }} />
        <Feather name="chevron-right" size={16} color={colors.textFaint} />
      </View>
    </Pressable>
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
  cardLeader: {
    borderColor: colors.accent,
    borderWidth: 1.5,
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
  avatarWrap: {
    position: "relative",
  },
  rankBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeLeader: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  rankText: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textMuted,
  },
  rankTextLeader: {
    color: colors.background,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
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
  divider: {
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
});
