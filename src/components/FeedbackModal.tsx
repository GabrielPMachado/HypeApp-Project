import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface FeedbackModalProps {
  visible: boolean;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  onClose: () => void;
}

// Substitui o Alert.alert nativo (cinza, fora do tema) pros avisos
// pontuais do app — cartão centralizado com a mesma linguagem visual
// dos outros modais (HypeReportModal, EvaluationModal).
export function FeedbackModal({ visible, icon, title, message, onClose }: FeedbackModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name={icon} size={22} color={colors.accent} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Entendi</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
});
