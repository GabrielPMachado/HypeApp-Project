import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ConfirmModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { FollowStats } from "@/components/FollowStats";
import { PartnerPanelModal } from "@/components/PartnerPanelModal";
import {
  ActivityList,
  BadgeGrid,
  LevelCard,
  ProfileBackdrop,
  ProfileHero,
  Section,
  StatsRow,
} from "@/components/ProfileParts";
import { RecapModal } from "@/components/RecapModal";
import { StoreModal } from "@/components/StoreModal";
import { UserListModal } from "@/components/UserListModal";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/constants/legal";
import { useAuth } from "@/context/AuthContext";
import { useProximityAlerts } from "@/context/ProximityAlertsContext";
import { useVenues } from "@/context/VenuesContext";
import { getFrameColor, getItem } from "@/data/storeCatalog";
import { isFirebaseConfigured } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import {
  calcPoints,
  getBadges,
  getLevelInfo,
  getUserActivity,
  HYPE_REPORT_POINTS,
  REVIEW_POINTS,
} from "@/utils/gamification";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function EarnRow({
  icon,
  label,
  reward,
  muted = false,
}: {
  icon: keyof typeof Feather.glyphMap;
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

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

// Perfil da própria pessoa (o próprio usuário está sempre autenticado
// aqui — ver o gate em app/_layout.tsx): identidade, nível, conquistas,
// atividade e edição. O perfil de OUTRA pessoa é o PublicProfileModal.
export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, profile, displayName, coins, signOut, deleteAccount } = useAuth();
  const { venues } = useVenues();
  const { enabled: proximityEnabled, setEnabled: setProximityEnabled } = useProximityAlerts();
  const [isEditing, setEditing] = useState(false);
  const [isStoreOpen, setStoreOpen] = useState(false);
  const [isRecapOpen, setRecapOpen] = useState(false);
  const [userListRelation, setUserListRelation] = useState<"following" | "followers" | null>(null);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // ownerId é setado manualmente no Console por enquanto (ver
  // types/venue.ts) — assume 1 bar por dono, que é o caso de uso real
  // até aqui (nenhuma rede cadastrada ainda).
  const [isPartnerPanelOpen, setPartnerPanelOpen] = useState(false);
  const ownedVenue = venues.find((venue) => venue.ownerId === user?.uid);

  const stats = {
    hypeReportCount: profile?.hypeReportCount ?? 0,
    reviewCount: profile?.reviewCount ?? 0,
  };
  const points = calcPoints(stats);
  const info = getLevelInfo(points);

  const activity = useMemo(
    () => (user ? getUserActivity(venues, user.uid) : { items: [], visitedVenueCount: 0, favorite: null }),
    [venues, user]
  );
  const badges = getBadges(stats, activity.visitedVenueCount);

  const titleItem = getItem(profile?.titleId);
  const createdAt = profile?.createdAt ?? (user?.metadata.creationTime ? new Date(user.metadata.creationTime) : null);
  const memberSince = createdAt ? `Membro desde ${MONTHS[createdAt.getMonth()]} de ${createdAt.getFullYear()}` : "";
  const subtitle = [user?.email, memberSince].filter(Boolean).join(" · ");

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  // deleteAccount apaga a conta de autenticação primeiro (ver
  // AuthContext) — se o Firebase recusar por login antigo, pede pra
  // entrar de novo em vez de um erro técnico sem saída.
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // Sucesso: o listener de auth detecta a conta sumindo e o app
      // inteiro volta pra tela de login sozinho — nada a fechar aqui.
    } catch (error) {
      setConfirmingDelete(false);
      const code = (error as { code?: string }).code;
      setDeleteError(
        code === "auth/requires-recent-login"
          ? "Por segurança, saia e entre na conta de novo antes de excluir — daí repita esse passo."
          : "Não deu pra excluir a conta agora. Tenta de novo em instantes."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <ProfileBackdrop color={getFrameColor(profile?.frameId)} />

        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel="Fechar perfil"
          >
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle} accessibilityRole="header">
            Perfil
          </Text>
          <Pressable
            onPress={() => setEditing(true)}
            hitSlop={8}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Feather name="edit-2" size={19} color={colors.accent} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ProfileHero
            name={displayName}
            avatarId={profile?.avatarId ?? ""}
            frameId={profile?.frameId ?? ""}
            titleLabel={titleItem?.name ?? info.title}
            titleColor={titleItem?.color}
            subtitle={subtitle}
            bio={profile?.bio ?? ""}
            vibes={profile?.favoriteVibes ?? []}
            level={info.level}
            onPressEmptyBio={() => setEditing(true)}
          />

          {isFirebaseConfigured && user && (
            <View style={styles.socialRow}>
              <FollowStats
                uid={user.uid}
                onPressFollowing={() => setUserListRelation("following")}
                onPressFollowers={() => setUserListRelation("followers")}
              />
            </View>
          )}

          <LevelCard info={info} points={points} coins={coins} onPressStore={() => setStoreOpen(true)} />

          <StatsRow
            hypes={stats.hypeReportCount}
            reviews={stats.reviewCount}
            venues={activity.visitedVenueCount}
          />

          <Pressable
            onPress={() => setRecapOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ver meu resumo da semana"
            style={({ pressed }) => [styles.recapButton, pressed && styles.recapButtonPressed]}
          >
            <Feather name="star" size={15} color={colors.accent} />
            <Text style={styles.recapButtonText}>Ver meu resumo</Text>
            <Feather name="chevron-right" size={16} color={colors.textFaint} />
          </Pressable>

          {ownedVenue && (
            <Pressable
              onPress={() => setPartnerPanelOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir painel do parceiro"
              style={({ pressed }) => [styles.recapButton, pressed && styles.recapButtonPressed]}
            >
              <Feather name="briefcase" size={15} color={colors.accent} />
              <Text style={styles.recapButtonText}>Painel do parceiro — {ownedVenue.name}</Text>
              <Feather name="chevron-right" size={16} color={colors.textFaint} />
            </Pressable>
          )}

          <Section title="CONQUISTAS">
            <BadgeGrid badges={badges} />
          </Section>

          <Section title="ATIVIDADE RECENTE">
            <ActivityList activity={activity} />
          </Section>

          <Section title="COMO GANHAR PONTOS">
            <EarnRow icon="zap" label="Hype agora" reward={`+${HYPE_REPORT_POINTS} pts`} />
            <EarnRow icon="edit-3" label="Avaliação completa" reward={`+${REVIEW_POINTS} pts`} />
            <EarnRow icon="camera" label="Check-in com QR Code na mesa" reward="Em breve" muted />
          </Section>

          <Section title="NOTIFICAÇÕES">
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Bar lotado por perto</Text>
                <Text style={styles.settingHint}>
                  Avisa quando você passar perto de um bar lotado agora — só com o app aberto.
                </Text>
              </View>
              <Switch
                value={proximityEnabled}
                onValueChange={setProximityEnabled}
                trackColor={{ true: colors.accent }}
              />
            </View>
          </Section>

          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
          >
            <Feather name="log-out" size={15} color={colors.hypeHigh} />
            <Text style={styles.signOutText}>Sair da conta</Text>
          </Pressable>

          <Pressable
            onPress={() => setConfirmingDelete(true)}
            accessibilityRole="button"
            accessibilityLabel="Excluir conta"
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
          >
            <Text style={styles.deleteText}>Excluir conta</Text>
          </Pressable>

          <View style={styles.legalRow}>
            <Pressable onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)} hitSlop={6}>
              <Text style={styles.legalLink}>Termos de Uso</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>·</Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={6}>
              <Text style={styles.legalLink}>Política de Privacidade</Text>
            </Pressable>
          </View>
        </ScrollView>

        <EditProfileModal
          visible={isEditing}
          onClose={() => setEditing(false)}
          onOpenStore={() => {
            setEditing(false);
            setStoreOpen(true);
          }}
        />
        <StoreModal visible={isStoreOpen} onClose={() => setStoreOpen(false)} />
        <RecapModal visible={isRecapOpen} onClose={() => setRecapOpen(false)} />
        {ownedVenue && (
          <PartnerPanelModal
            visible={isPartnerPanelOpen}
            venue={ownedVenue}
            onClose={() => setPartnerPanelOpen(false)}
          />
        )}

        {user && userListRelation && (
          <UserListModal
            visible
            uid={user.uid}
            relation={userListRelation}
            title={userListRelation === "following" ? "Seguindo" : "Seguidores"}
            onClose={() => setUserListRelation(null)}
          />
        )}

        <ConfirmModal
          visible={isConfirmingDelete}
          icon="trash-2"
          title="Excluir sua conta?"
          message="Isso apaga seu perfil, nível, moedas e itens da loja pra sempre. Não tem como desfazer."
          confirmLabel="Excluir"
          destructive
          isBusy={isDeleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmingDelete(false)}
        />

        <FeedbackModal
          visible={deleteError !== ""}
          icon="alert-circle"
          title="Não deu pra excluir"
          message={deleteError}
          onClose={() => setDeleteError("")}
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
    gap: 22,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  settingHint: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    lineHeight: 15,
  },
  socialRow: {
    flexDirection: "row",
  },
  recapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  recapButtonPressed: {
    opacity: 0.7,
  },
  recapButtonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
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
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
  deleteText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textDecorationLine: "underline",
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  legalLink: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textDecorationLine: "underline",
  },
  legalSeparator: {
    fontSize: 11,
    color: colors.textFaint,
  },
});
