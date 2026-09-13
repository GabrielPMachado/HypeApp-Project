import { StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/RatingStars";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Review } from "@/types/venue";
import { formatRelativeTime } from "@/utils/time";
import { getOverallRating } from "@/utils/rating";

export function ReviewItem({ review }: { review: Review }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.author}>{review.authorName}</Text>
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
