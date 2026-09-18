import { StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/RatingStars";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Review } from "@/types/venue";
import { formatRelativeTime } from "@/utils/time";
import { getOverallRating } from "@/utils/rating";

export function ReviewItem({ review }: { review: Review }) {
  const { user } = useAuth();
  // O authorName gravado é o nome real de quem postou (ver
  // VenuesContext.tsx) — pro próprio autor, mostra "Você" em vez do
  // nome, igual qualquer rede social faz com o próprio post.
  const authorLabel = review.authorId && review.authorId === user?.uid ? "Você" : review.authorName;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.author}>{authorLabel}</Text>
        <Text style={styles.time}>{formatRelativeTime(review.createdAt)}</Text>
      </View>
      <RatingStars value={getOverallRating(review.rating)} size={12} />
      {review.comment.length > 0 && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  author: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  time: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  comment: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
