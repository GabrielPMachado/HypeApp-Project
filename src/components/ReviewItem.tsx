import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PublicProfileModal } from "@/components/PublicProfileModal";
import { RatingStars } from "@/components/RatingStars";
import { ReportModal } from "@/components/ReportModal";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Review } from "@/types/venue";
import { formatRelativeTime } from "@/utils/time";
import { getOverallRating } from "@/utils/rating";

export function ReviewItem({ review, venueId }: { review: Review; venueId: string }) {
  const { user } = useAuth();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);

  // O authorName gravado é o nome real de quem postou (ver
  // VenuesContext.tsx) — pro próprio autor, mostra "Você" em vez do
  // nome, igual qualquer rede social faz com o próprio post.
  const isMine = !!review.authorId && review.authorId === user?.uid;
  const authorLabel = isMine ? "Você" : review.authorName;

  // Tocar no nome de OUTRA pessoa abre o perfil dela. Avaliações antigas
  // (dados de exemplo) não têm authorId — nome sem link.
  const canOpenProfile = !!review.authorId && !isMine;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {canOpenProfile ? (
          <Pressable
            onPress={() => setProfileOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${review.authorName}`}
          >
            <Text style={[styles.author, styles.authorLink]}>{authorLabel}</Text>
          </Pressable>
        ) : (
          <Text style={styles.author}>{authorLabel}</Text>
        )}
        <View style={styles.headerRight}>
          <Text style={styles.time}>{formatRelativeTime(review.createdAt)}</Text>
          {/* Denunciar a própria avaliação não faz sentido, e sem Firebase
              não existe onde gravar a denúncia. */}
          {!isMine && isFirebaseConfigured && (
            <Pressable
              onPress={() => setReportOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Denunciar esta avaliação"
            >
              <Feather name="flag" size={13} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      </View>
      <RatingStars value={getOverallRating(review.rating)} size={12} />
      {review.comment.length > 0 && <Text style={styles.comment}>{review.comment}</Text>}

      {canOpenProfile && (
        <PublicProfileModal
          uid={review.authorId ?? null}
          visible={isProfileOpen}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {!isMine && isFirebaseConfigured && (
        <ReportModal
          visible={isReportOpen}
          targetType="review"
          targetId={review.id}
          venueId={venueId}
          onClose={() => setReportOpen(false)}
        />
      )}
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
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  author: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  authorLink: {
    textDecorationLine: "underline",
    textDecorationColor: colors.borderStrong,
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
