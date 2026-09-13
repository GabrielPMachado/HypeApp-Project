import { Feather } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EvaluationModal } from "@/components/EvaluationModal";
import { HypeBadge } from "@/components/HypeBadge";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { RatingStars } from "@/components/RatingStars";
import { ReviewItem } from "@/components/ReviewItem";
import { VenueAvatar } from "@/components/VenueAvatar";
import { VenueLocationMap } from "@/components/VenueLocationMap";
import { VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { getCurrentHypeStatus } from "@/utils/hype";
import { getAggregateRating, getOverallRating } from "@/utils/rating";
import { formatRelativeTime } from "@/utils/time";
import { getAggregateVibeTags } from "@/utils/vibeTags";

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { venues, addReview } = useVenues();
  const [isEvaluationOpen, setEvaluationOpen] = useState(false);

  const venue = venues.find((v) => v.id === id);

  if (!venue) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.notFound}>Local não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const hypeStatus = getCurrentHypeStatus(venue.reviews);
  const aggregateRating = getAggregateRating(venue.reviews);
  const vibeTags = getAggregateVibeTags(venue);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityRow}>
          <VenueAvatar name={venue.name} logoUrl={venue.logoUrl} size={56} />
          <View style={styles.identityText}>
            <Text style={styles.name}>{venue.name}</Text>
            <Text style={styles.address}>{venue.address}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{venue.openingHours}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="dollar-sign" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{venue.priceRange}</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {vibeTags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.hypeRow}>
          {hypeStatus ? (
            <HypeBadge level={hypeStatus.level} />
          ) : (
            <Text style={styles.noStatus}>Sem avaliações ainda</Text>
          )}
          <View style={styles.hypeScorePill}>
            <Feather name="zap" size={12} color={colors.accent} />
            <Text style={styles.hypeScoreText}>{venue.hypeScore.toFixed(1)} hype agora</Text>
          </View>
        </View>

        {hypeStatus && (
          <Text style={styles.hypeMeta}>
            {hypeStatus.isRecent
              ? `Média de ${hypeStatus.sampleSize} ${
                  hypeStatus.sampleSize === 1 ? "avaliação" : "avaliações"
                } nos últimos 30 min`
              : `Baseado na última atualização, ${formatRelativeTime(hypeStatus.lastReportAt)}`}
          </Text>
        )}

        <VenueLocationMap
          latitude={venue.latitude}
          longitude={venue.longitude}
          address={venue.address}
        />

        <Pressable
          onPress={() => setEvaluationOpen(true)}
          style={({ pressed }) => [styles.evaluateButton, pressed && styles.evaluateButtonPressed]}
        >
          <Feather name="edit-3" size={15} color={colors.background} />
          <Text style={styles.evaluateButtonText}>Fazer avaliação</Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.overallRow}>
            <Text style={styles.sectionTitle}>Avaliação</Text>
            {aggregateRating && (
              <View style={styles.overallValue}>
                <RatingStars value={getOverallRating(aggregateRating)} size={15} />
                <Text style={styles.overallText}>{getOverallRating(aggregateRating).toFixed(1)}</Text>
              </View>
            )}
          </View>

          {aggregateRating ? (
            <RatingBreakdown rating={aggregateRating} />
          ) : (
            <Text style={styles.emptyReviews}>
              Ainda sem avaliações — toque em "Fazer avaliação" pra ser o primeiro.
            </Text>
          )}
        </View>

        <PremiumTeaser
          title="Histórico do hype"
          description="Veja como a energia do local variou ao longo da noite. Disponível no plano Premium."
        />

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Comentários {venue.reviews.length > 0 ? `(${venue.reviews.length})` : ""}
          </Text>

          {venue.reviews.length === 0 ? (
            <Text style={styles.emptyReviews}>Nenhum comentário ainda.</Text>
          ) : (
            <View style={styles.reviewsList}>
              {venue.reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <EvaluationModal
        visible={isEvaluationOpen}
        venueName={venue.name}
        currentHypeLevel={hypeStatus?.level ?? "medium"}
        onClose={() => setEvaluationOpen(false)}
        onSubmit={({ hypeLevel, rating, vibeTags: selectedTags, comment }) => {
          addReview(venue.id, {
            authorName: "Você",
            hypeLevel,
            rating,
            vibeTags: selectedTags,
            comment,
          });
          setEvaluationOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 14,
  },
  notFound: {
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  address: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
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
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  noStatus: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  hypeScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hypeScoreText: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  hypeMeta: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    marginTop: -8,
  },
  evaluateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  evaluateButtonPressed: {
    opacity: 0.85,
  },
  evaluateButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overallText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyReviews: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  reviewsList: {
    marginTop: 4,
  },
});
