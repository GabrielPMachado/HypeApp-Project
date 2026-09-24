import { Feather } from "@expo/vector-icons";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { FeedbackModal } from "@/components/FeedbackModal";
import { PressableScale } from "@/components/PressableScale";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

export type ReportTargetType = "review" | "user";
type ReportReason = "offensive" | "spam" | "harassment" | "other";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "offensive", label: "Ofensivo ou discurso de ódio" },
  { id: "spam", label: "Spam ou propaganda" },
  { id: "harassment", label: "Assédio a alguém" },
  { id: "other", label: "Outro motivo" },
];

interface ReportModalProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string; // review.id (denúncia de review) ou uid (denúncia de usuário)
  venueId?: string; // só preenchido pra denúncia de review
  onClose: () => void;
}

// Denúncia de avaliação ou de perfil. Não existe painel de moderação no
// app ainda (nem precisa: revisão é manual, direto no Console do
// Firestore — mesmo espírito de seedFirestoreFromMock em AppHeader.tsx).
// O id do documento é determinístico (tipo_alvo_denunciante): denunciar
// de novo só sobrescreve o motivo em vez de duplicar.
//
// ATENÇÃO: espelhar nas regras do Firestore —
//   match /reports/{reportId} {
//     allow write: if request.auth != null
//       && request.resource.data.reporterId == request.auth.uid
//       && reportId == request.resource.data.type + '_' + request.resource.data.targetId + '_' + request.auth.uid;
//     allow read: if false; // só via Console, ninguém lê denúncia pelo app
//   }
export function ReportModal({ visible, targetType, targetId, venueId, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [isSending, setSending] = useState(false);
  const [isDone, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setReason(null);
    setDone(false);
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || !user || !db) return;
    setSending(true);
    setError("");
    try {
      const reportId = `${targetType}_${targetId}_${user.uid}`;
      await setDoc(doc(db, "reports", reportId), {
        type: targetType,
        targetId,
        venueId: venueId ?? null,
        reporterId: user.uid,
        reason,
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setError("Não deu pra enviar a denúncia agora. Tenta de novo em instantes.");
    } finally {
      setSending(false);
    }
  };

  if (isDone) {
    return (
      <FeedbackModal
        visible
        icon="check-circle"
        title="Denúncia enviada"
        message="Obrigado por avisar — vamos revisar o quanto antes."
        onClose={handleClose}
      />
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isSending ? undefined : handleClose}
          accessibilityLabel="Fechar"
        />

        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.iconCircle}>
            <Feather name="flag" size={22} color={colors.hypeHigh} />
          </View>

          <Text style={styles.title}>
            {targetType === "review" ? "Denunciar avaliação" : "Denunciar usuário"}
          </Text>
          <Text style={styles.subtitle}>Por que você está denunciando isso?</Text>

          <View style={styles.reasons}>
            {REASONS.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setReason(r.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === r.id }}
                style={({ pressed }) => [styles.reasonRow, pressed && styles.pressed]}
              >
                <View style={[styles.radio, reason === r.id && styles.radioActive]}>
                  {reason === r.id && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.reasonText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
              disabled={isSending}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <PressableScale
              onPress={handleSubmit}
              disabled={!reason || isSending}
              accessibilityRole="button"
              accessibilityLabel="Enviar denúncia"
              style={[styles.confirmButton, !reason && styles.confirmButtonDisabled]}
            >
              <Text style={styles.confirmText}>{isSending ? "..." : "Denunciar"}</Text>
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
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    gap: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(193, 88, 75, 0.16)",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 12,
  },
  reasons: {
    alignSelf: "stretch",
    gap: 2,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.accent,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  error: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.hypeHigh,
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 16,
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
    backgroundColor: colors.hypeHigh,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  pressed: {
    opacity: 0.75,
  },
});
