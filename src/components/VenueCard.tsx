import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
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

export function VenueCard({ venue }: { venue: Venue }) {
  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const aggregateRating = getAggregateRating(venue.reviews);
  const vibeTags = getAggregateVibeTags(venue);

  return (
    <Link href={{ pathname: "/venue/[id]", params: { id: venue.id } }} asChild>
      {/* IMPORTANTE: o Link (asChild) clona este Pressable pra virar um
          <a> na web / handler de toque no nativo — nesse processo ele
          DESCARTA a prop `style` do Pressable (confirmado inspecionando
          o DOM: a tag <a> resultante não carregava nenhuma classe de
          styles.card, mesmo com o código "correto"). Por isso o visual
          do card mora numa View filha, nunca na prop `style` do próprio
          elemento que o Link clona. O estado "pressed" vem via
          children-como-função do Pressable, que É preservado. */}
      <Pressable>
        {({ pressed }) => (
          <View style={[styles.card, pressed && styles.cardPressed]}>
            <View style={styles.headerRow}>
              <VenueAvatar
                name={venue.name}
                logoUrl={venue.logoUrl}
                vibeTag={venue.vibeTags[0]}
                size={52}
              />

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
                  <Text style={styles.footerText}>{venue.reviews.length} avaliações</Text>
                </>
              ) : (
                <Text style={styles.footerText}>Sem avaliações ainda</Text>
              )}
              <View style={{ flex: 1 }} />
              <Feather name="chevron-right" size={16} color={colors.textFaint} />
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  cardPressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
    backgroundColor: colors.border,
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
