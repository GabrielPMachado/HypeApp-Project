import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import {
  calcPoints,
  getLevelInfo,
  HYPE_REPORT_POINTS,
  REVIEW_POINTS,
} from "@/utils/gamification";

type IconName = keyof typeof Feather.glyphMap;

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

function StatTile({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Feather name={icon} size={16} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EarnRow({
  icon,
  label,
  reward,
  muted = false,
}: {
  icon: IconName;
  label: string;
  reward: string;
  muted?: boolean;
}) {
  const tone = muted ? colors.textFaint : colors.textMuted;
  return (
    <View style={styles.earnRow}>
      <Feather name={icon} size={15} color={tone} />
      <Text style={[styles.earnLabel, { color: tone }]}>{label}</Text>
      <Text style={[styles.earnReward, muted && { color: colors.textFaint }]}>{reward}</Text>
    </View>
  );
}

// Dentro do app o usuário está sempre autenticado (ver gate em
// app/_layout.tsx) — esse menu é a "carteirinha" do jogo (nível, pontos,
// como ganhar mais) e deixa sair; não precisa lidar com o caso deslogado
// (isso é a AuthScreen).
export function AccountModal({ visible, onClose }: AccountModalProps) {
  const { user, profile, displayName, signOut } = useAuth();

  const stats = {
    hypeReportCount: profile?.hypeReportCount ?? 0,
    reviewCount: profile?.reviewCount ?? 0,
  };
  const points = calcPoints(stats);
  const info = getLevelInfo(points);
  const initial = (displayName || "?").charAt(0).toUpperCase();

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.identity}>
                <Text style={styles.name} numberOfLines={1}>
                  {displayName || "Sem nome"}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {profile?.email || user?.email || ""}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.levelCard}>
              <View style={styles.levelTopRow}>
                <Text style={styles.levelLabel}>NÍVEL {info.level}</Text>
                <Text style={styles.points}>{points} pts</Text>
              </View>
              <Text style={styles.levelTitle}>{info.title}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(info.progress, 0.03) * 100}%` }]} />
              </View>
              <Text style={styles.levelHint}>
                {info.nextTitle
                  ? `${info.pointsToNext} pts para ${info.nextTitle}`
                  : "Nível máximo — você é lenda."}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <StatTile icon="zap" value={stats.hypeReportCount} label="Hypes enviados" />
              <StatTile icon="edit-3" value={stats.reviewCount} label="Avaliações feitas" />
            </View>

            <View style={styles.earnSection}>
              <Text style={styles.sectionTitle}>COMO GANHAR PONTOS</Text>
              <EarnRow icon="zap" label="Hype agora" reward={`+${HYPE_REPORT_POINTS} pts`} />
              <EarnRow
                icon="edit-3"
                label="Avaliação completa"
                reward={`+${REVIEW_POINTS} pts`}
              />
              <EarnRow icon="camera" label="Check-in com QR Code na mesa" reward="Em breve" muted />
            </View>

            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
            >
              <Feather name="log-out" size={15} color={colors.hypeHigh} />
              <Text style={styles.signOutText}>Sair da conta</Text>
            </Pressable>
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
    maxHeight: "90%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 8,
  },
  content: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.accent,
  },
  identity: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  email: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  levelCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  levelTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  points: {
    fontSize: 14,
    fontFamily: fontFamily.display,
    color: colors.accent,
  },
  levelTitle: {
    fontSize: 24,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
    overflow: "hidden",
    marginTop: 4,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  levelHint: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  earnSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textFaint,
    letterSpacing: 0.8,
  },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  earnLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.body,
  },
  earnReward: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 4,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.hypeHigh,
  },
});
