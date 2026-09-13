import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { RatingStars } from "@/components/RatingStars";
import { StatusSegmentedControl } from "@/components/StatusSegmentedControl";
import { ALL_VIBE_TAGS, VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { HypeLevel, Rating, VibeTag } from "@/types/venue";

const CRITERIA: { key: keyof Rating; label: string }[] = [
  { key: "music", label: "Música" },
  { key: "price", label: "Custo-benefício" },
  { key: "service", label: "Atendimento" },
  { key: "ambiance", label: "Ambiente" },
];

const EMPTY_RATING: Rating = { music: 0, price: 0, service: 0, ambiance: 0 };

interface EvaluationModalProps {
  visible: boolean;
  venueName: string;
  currentHypeLevel: HypeLevel;
  onClose: () => void;
  onSubmit: (data: {
    hypeLevel: HypeLevel;
    rating: Rating;
    vibeTags: VibeTag[];
    comment: string;
  }) => void;
}

// Fluxo único de avaliação: como está o local agora (hype) + nota por
// critério de qualidade + características percebidas + comentário.
// Tudo vira um só registro (ver VenuesContext.addReview).
export function EvaluationModal({
  visible,
  venueName,
  currentHypeLevel,
  onClose,
  onSubmit,
}: EvaluationModalProps) {
  const [hypeLevel, setHypeLevel] = useState<HypeLevel>(currentHypeLevel);
  const [rating, setRating] = useState<Rating>(EMPTY_RATING);
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [comment, setComment] = useState("");

  const canSubmit = CRITERIA.every(({ key }) => rating[key] > 0);

  const reset = () => {
    setHypeLevel(currentHypeLevel);
    setRating(EMPTY_RATING);
    setVibeTags([]);
    setComment("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleVibeTag = (tag: VibeTag) => {
    setVibeTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ hypeLevel, rating, vibeTags, comment: comment.trim() });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              Avaliar {venueName}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Como está o local agora?</Text>
            <StatusSegmentedControl value={hypeLevel} onChange={setHypeLevel} />

            <Text style={[styles.sectionLabel, styles.spaced]}>Sua nota por critério</Text>
            <View style={styles.criteriaList}>
              {CRITERIA.map(({ key, label }) => (
                <View key={key} style={styles.criteriaRow}>
                  <Text style={styles.criteriaLabel}>{label}</Text>
                  <RatingStars
                    value={rating[key]}
                    size={22}
                    interactive
                    onChange={(value) => setRating((prev) => ({ ...prev, [key]: value }))}
                  />
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, styles.spaced]}>Como é o rolê?</Text>
            <View style={styles.tagsGrid}>
              {ALL_VIBE_TAGS.map((tag) => {
                const isSelected = vibeTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleVibeTag(tag)}
                    style={({ pressed }) => [
                      styles.tagChip,
                      isSelected && styles.tagChipSelected,
                      pressed && styles.tagChipPressed,
                    ]}
                  >
                    <Text style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}>
                      {VIBE_TAG_LABELS[tag]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, styles.spaced]}>Comentário (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Conta como foi..."
              placeholderTextColor={colors.textFaint}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
                pressed && canSubmit && styles.submitButtonPressed,
              ]}
            >
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                Enviar avaliação
              </Text>
            </Pressable>

            {!canSubmit && (
              <Text style={styles.hint}>Dê uma nota para todos os critérios pra enviar.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  spaced: {
    marginTop: 20,
  },
  criteriaList: {
    gap: 14,
  },
  criteriaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  criteriaLabel: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagChipSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  tagChipPressed: {
    opacity: 0.7,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
  },
  tagChipTextSelected: {
    color: colors.accent,
  },
  input: {
    minHeight: 64,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 18,
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  submitTextDisabled: {
    color: colors.textFaint,
  },
  hint: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
  },
});
