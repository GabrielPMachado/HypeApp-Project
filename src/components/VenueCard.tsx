import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HypeBadge } from "@/components/HypeBadge";
import { RatingStars } from "@/components/RatingStars";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Venue } from "@/types/venue";
import { getAggregateRating, getOverallRating } from "@/utils/rating";

export function VenueCard({ venue }: { venue: Venue }) {
  const aggregateRating = getAggregateRating(venue.reviews);

  return (
    <Link href={{ pathname: "/venue/[id]", params: { id: venue.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.scorePill}>
            <Feather name="zap" size={12} color={colors.accent} />
            <Text style={styles.scoreText}>{venue.hypeScore.toFixed(1)}</Text>
          </View>
        </View>

        <HypeBadge level={venue.hypeLevel} />

        <View style={styles.tagsRow}>
          {venue.vibeTags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag.replace(/-/g, " ")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          {aggregateRating ? (
            <>
              <RatingStars value={getOverallRating(aggregateRating)} size={13} />
              <Text style={styles.footerText}>{venue.reviews.length} avaliações</Text>
            </>
          ) : (
            <Text style={styles.footerText}>Sem avaliações ainda</Text>
          )}
          <View style={{ flex: 1 }} />
          <Feather name="chevron-right" size={16} color={colors.textFaint} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },
  cardPressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 17,
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
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
});
