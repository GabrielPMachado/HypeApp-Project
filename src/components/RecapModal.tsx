import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NEON_COLORS } from "@/components/NeonBorder";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { calcPoints, getUserActivity, HYPE_REPORT_POINTS, REVIEW_POINTS } from "@/utils/gamification";

type Period = "week" | "month";

const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30 };
const PERIOD_LABELS: Record<Period, string> = { week: "Semana", month: "Mês" };

interface RecapModalProps {
  visible: boolean;
  onClose: () => void;
}

// "Resumo" no estilo Spotify Wrapped: reaproveita getUserActivity (a
// mesma base da lista "ATIVIDADE RECENTE" do perfil), só filtrando pro
// período escolhido — nenhum dado novo no Firestore, tudo derivado do
// que já é lido.
export function RecapModal({ visible, onClose }: RecapModalProps) {
  const { user } = useAuth();
  const { venues } = useVenues();
  const [period, setPeriod] = useState<Period>("week");

  const since = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - PERIOD_DAYS[period]);
    return date;
  }, [period]);

  const activity = useMemo(
    () => (user ? getUserActivity(venues, user.uid, since) : { items: [], visitedVenueCount: 0, favorite: null }),
    [venues, user, since]
  );

  const hypeCount = activity.items.filter((item) => item.kind === "hype").length;
  const reviewCount = activity.items.filter((item) => item.kind === "review").length;
  const points = calcPoints({ hypeReportCount: hypeCount, reviewCount });
  const hasActivity = activity.items.length > 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.topButton} />
          <Text style={styles.topTitle} accessibilityRole="header">
            Seu resumo
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel="Fechar resumo"
          >
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.periodRow}>
            {(["week", "month"] as Period[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.periodChip, period === p && styles.periodChipActive]}
              >
                <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>
                  {PERIOD_LABELS[p]}
                </Text>
              </Pressable>
            ))}
          </View>

          {!hasActivity ? (
            <View style={styles.emptyState}>
              <Feather name="moon" size={28} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>
                {period === "week" ? "Semana tranquila" : "Mês tranquilo"}
              </Text>
              <Text style={styles.emptySubtitle}>
                Nenhum hype ou avaliação {period === "week" ? "essa semana" : "esse mês"} ainda —
                bora mudar isso hoje?
              </Text>
            </View>
          ) : (
            <>
              <LinearGradient
                colors={NEON_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroRing}
              >
                <View style={styles.heroInner}>
                  <Text style={styles.heroNumber}>{points}</Text>
                  <Text style={styles.heroLabel}>
                    pontos {period === "week" ? "essa semana" : "esse mês"}
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Feather name="zap" size={18} color={colors.accent} />
                  <Text style={styles.statNumber}>{hypeCount}</Text>
                  <Text style={styles.statLabel}>{hypeCount === 1 ? "hype enviado" : "hypes enviados"}</Text>
                </View>
                <View style={styles.statCard}>
                  <Feather name="edit-3" size={18} color={colors.accent} />
                  <Text style={styles.statNumber}>{reviewCount}</Text>
                  <Text style={styles.statLabel}>
                    {reviewCount === 1 ? "avaliação completa" : "avaliações completas"}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Feather name="map-pin" size={18} color={colors.accent} />
                  <Text style={styles.statNumber}>{activity.visitedVenueCount}</Text>
                  <Text style={styles.statLabel}>
                    {activity.visitedVenueCount === 1 ? "bar diferente" : "bares diferentes"}
                  </Text>
                </View>
              </View>

              {activity.favorite && (
                <View style={styles.favoriteCard}>
                  <Text style={styles.favoriteLabel}>SEU BAR FAVORITO</Text>
                  <Text style={styles.favoriteName}>{activity.favorite.venueName}</Text>
                  <Text style={styles.favoriteMeta}>
                    {activity.favorite.count}{" "}
                    {activity.favorite.count === 1 ? "post por lá" : "posts por lá"}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 15,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 22,
    alignItems: "center",
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
  },
  periodChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  periodChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  periodChipText: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
  },
  periodChipTextActive: {
    color: colors.accent,
  },
  heroRing: {
    borderRadius: 100,
    padding: 4,
    marginTop: 12,
  },
  heroInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  heroNumber: {
    fontSize: 44,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  favoriteCard: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: 16,
    paddingVertical: 18,
  },
  favoriteLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
    letterSpacing: 0.6,
  },
  favoriteName: {
    fontSize: 18,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  favoriteMeta: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
