import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedbackModal } from "@/components/FeedbackModal";
import { HypeBadge } from "@/components/HypeBadge";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { PriceRange, Venue } from "@/types/venue";
import { getCurrentHypeStatus, hypeTrendByDay } from "@/utils/hype";
import { getAggregateRating, getOverallRating } from "@/utils/rating";

const PRICE_OPTIONS: PriceRange[] = ["$", "$$", "$$$"];
const TREND_DAYS = 7;
const TREND_BAR_HEIGHT = 60;

interface PartnerPanelModalProps {
  visible: boolean;
  venue: Venue;
  onClose: () => void;
}

// Painel de quem é dono do local (venue.ownerId, setado manualmente no
// Console por enquanto — ver comentário em types/venue.ts). Edita só
// horário e faixa de preço (endereço/coordenadas ficam de fora aqui —
// errar isso quebraria a busca por distância, ver utils/geo.ts) e mostra
// estatísticas derivadas dos mesmos hypeReports/reviews que a lista e o
// mapa já usam, sem nenhuma leitura nova.
export function PartnerPanelModal({ visible, venue, onClose }: PartnerPanelModalProps) {
  const { updateVenueInfo } = useVenues();
  const [openingHours, setOpeningHours] = useState(venue.openingHours);
  const [priceRange, setPriceRange] = useState<PriceRange>(venue.priceRange);
  const [isSaving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const aggregateRating = getAggregateRating(venue.reviews);
  const trend = hypeTrendByDay(venue.hypeReports, TREND_DAYS);
  const maxAverage = Math.max(1, ...trend.map((b) => b.average ?? 0));

  const hasChanges = openingHours !== venue.openingHours || priceRange !== venue.priceRange;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVenueInfo(venue.id, { openingHours, priceRange });
      setSavedMessage("Informações atualizadas!");
    } catch {
      setSavedMessage("Não deu pra salvar agora. Tenta de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={styles.topButton}
          accessibilityRole="button"
          accessibilityLabel="Fechar painel do parceiro"
        >
          <Feather name="chevron-down" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle} accessibilityRole="header">
          Painel do parceiro
        </Text>
        <View style={styles.topButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.venueName}>{venue.name}</Text>

        <View style={styles.statusRow}>
          {hypeStatus ? (
            <HypeBadge level={hypeStatus.level} />
          ) : (
            <Text style={styles.noStatus}>Ainda sem status de hype</Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{venue.hypeReports.length}</Text>
            <Text style={styles.statLabel}>hypes recebidos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{venue.reviews.length}</Text>
            <Text style={styles.statLabel}>avaliações</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {aggregateRating ? getOverallRating(aggregateRating).toFixed(1) : "–"}
            </Text>
            <Text style={styles.statLabel}>nota geral</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hype nos últimos {TREND_DAYS} dias</Text>
          <View style={styles.trendRow}>
            {trend.map((bucket) => (
              <View key={bucket.dateLabel} style={styles.trendColumn}>
                <View style={styles.trendBarTrack}>
                  {bucket.average !== null && (
                    <View
                      style={[
                        styles.trendBarFill,
                        { height: (bucket.average / maxAverage) * TREND_BAR_HEIGHT },
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.trendLabel}>{bucket.dateLabel}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editar informações</Text>

          <Text style={styles.fieldLabel}>Horário de funcionamento</Text>
          <TextInput
            value={openingHours}
            onChangeText={setOpeningHours}
            placeholder="Ex: Qui a Sáb, 19h às 02h"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Faixa de preço</Text>
          <View style={styles.priceRow}>
            {PRICE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setPriceRange(option)}
                style={[styles.priceChip, priceRange === option && styles.priceChipActive]}
              >
                <Text
                  style={[styles.priceChipText, priceRange === option && styles.priceChipTextActive]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar alterações</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={savedMessage !== ""}
        icon="check-circle"
        title="Painel do parceiro"
        message={savedMessage}
        onClose={() => setSavedMessage("")}
      />
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
    gap: 16,
  },
  venueName: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  statusRow: {
    flexDirection: "row",
  },
  noStatus: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: TREND_BAR_HEIGHT + 24,
  },
  trendColumn: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  trendBarTrack: {
    height: TREND_BAR_HEIGHT,
    width: 18,
    justifyContent: "flex-end",
  },
  trendBarFill: {
    width: "100%",
    borderRadius: 4,
    backgroundColor: colors.accent,
    minHeight: 3,
  },
  trendLabel: {
    fontSize: 9,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
  },
  priceChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  priceChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  priceChipText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textMuted,
  },
  priceChipTextActive: {
    color: colors.accent,
  },
  saveButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    minHeight: 46,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
});
