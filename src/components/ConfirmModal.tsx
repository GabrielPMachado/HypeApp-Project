import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface ConfirmModalProps {
  visible: boolean;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  confirmLabel: string;
  // Destrutiva (ex: excluir conta) pinta o botão de confirmar em
  // vermelho — o mesmo tom de "Lotado" (colors.hypeHigh), não uma cor
  // de erro nova só pra isso.
  destructive?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmação genérica ("tem certeza?") pra qualquer ação que não dá pra
// desfazer — substitui o Alert.alert nativo (cinza, fora do tema, sem
// como estilizar o botão destrutivo). Ver ConfirmPurchaseModal pro
// equivalente específico de compra na loja (mostra preço/saldo).
export function ConfirmModal({
  visible,
  icon,
  title,
  message,
  confirmLabel,
  destructive = false,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isBusy ? undefined : onCancel}
          accessibilityLabel="Fechar confirmação"
        />

        <View style={styles.card} accessibilityViewIsModal>
          <View style={[styles.iconCircle, destructive && styles.iconCircleDestructive]}>
            <Feather name={icon} size={22} color={destructive ? colors.hypeHigh : colors.accent} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <PressableScale
              onPress={onConfirm}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[styles.confirmButton, destructive && styles.confirmButtonDestructive]}
            >
              <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>
                {isBusy ? "..." : confirmLabel}
              </Text>
            </PressableScale>
          </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
    marginBottom: 4,
  },
  iconCircleDestructive: {
    backgroundColor: "rgba(193, 88, 75, 0.16)",
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  confirmButtonDestructive: {
    backgroundColor: colors.hypeHigh,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  confirmTextDestructive: {
    color: colors.background,
  },
  pressed: {
    opacity: 0.75,
  },
});
