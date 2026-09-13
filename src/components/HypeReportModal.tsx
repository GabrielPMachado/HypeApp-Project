import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { StatusSegmentedControl } from "@/components/StatusSegmentedControl";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { HypeLevel } from "@/types/venue";

interface HypeReportModalProps {
  visible: boolean;
  venueName: string;
  currentHypeLevel: HypeLevel;
  onClose: () => void;
  onSubmit: (level: HypeLevel) => void;
}

// Avaliação "de hype": rápida, só o status de agora — o oposto da
// avaliação fixa (EvaluationModal). Existe pra permitir o toque rápido
// de "como tá aqui agora" sem precisar passar por nota de música, preço
// etc. toda vez.
export function HypeReportModal({
  visible,
  venueName,
  currentHypeLevel,
  onClose,
  onSubmit,
}: HypeReportModalProps) {
  const [level, setLevel] = useState<HypeLevel>(currentHypeLevel);

  const handleClose = () => {
    setLevel(currentHypeLevel);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(level);
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

          <StatusSegmentedControl value={level} onChange={setLevel} />

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
    gap: 16,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
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
