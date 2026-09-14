import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { HypeLevel } from "@/types/venue";
import { scoreToLevel } from "@/utils/hype";

const LEVEL_LABELS: Record<HypeLevel, string> = {
  low: "De boas",
  medium: "Movimentado",
  high: "Lotado",
};

const LEVEL_TONES: Record<HypeLevel, string> = {
  low: colors.hypeLow,
  medium: colors.hypeMedium,
  high: colors.hypeHigh,
};

interface HypeReportModalProps {
  visible: boolean;
  venueName: string;
  currentHypeScore: number;
  onClose: () => void;
  onSubmit: (score: number) => void;
}

// Avaliação "de hype": rápida, só o status de agora — o oposto da
// avaliação fixa (EvaluationModal). O usuário dá uma nota de 0 a 10 no
// deslizador pro quão cheio/animado o local está, em vez de escolher
// entre categorias fixas — mais expressivo e é a própria nota que
// alimenta a média exibida como "hype agora" (ver getCurrentHypeStatus).
export function HypeReportModal({
  visible,
  venueName,
  currentHypeScore,
  onClose,
  onSubmit,
}: HypeReportModalProps) {
  const [score, setScore] = useState(Math.round(currentHypeScore));
  const level = scoreToLevel(score);
  const tone = LEVEL_TONES[level];

  const handleClose = () => {
    setScore(Math.round(currentHypeScore));
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(score);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              Como está {venueName} agora?
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreNumber, { color: tone }]}>{score}</Text>
            <Text style={[styles.scoreLevel, { color: tone }]}>{LEVEL_LABELS[level]}</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={score}
            onValueChange={setScore}
            minimumTrackTintColor={tone}
            maximumTrackTintColor={colors.borderStrong}
            thumbTintColor={tone}
          />

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Vazio</Text>
            <Text style={styles.sliderLabelText}>Lotado</Text>
          </View>

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          >
            <Text style={styles.submitText}>Enviar</Text>
          </Pressable>
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
    gap: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  scoreDisplay: {
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 40,
    fontFamily: fontFamily.display,
  },
  scoreLevel: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  slider: {
    width: "100%",
    height: 36,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sliderLabelText: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
});
