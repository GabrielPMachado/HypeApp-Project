import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditProfileModal } from "@/components/EditProfileModal";
import {
  ActivityList,
  BadgeGrid,
  LevelCard,
  ProfileHero,
  Section,
  StatsRow,
} from "@/components/ProfileParts";
import { StoreModal } from "@/components/StoreModal";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/context/VenuesContext";
import { getItem } from "@/data/storeCatalog";
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
  const { user, profile, displayName, coins, signOut } = useAuth();
  const { venues } = useVenues();
  const [isEditing, setEditing] = useState(false);
  const [isStoreOpen, setStoreOpen] = useState(false);

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.topButton}>
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Perfil</Text>
          <Pressable onPress={() => setEditing(true)} hitSlop={10} style={styles.topButton}>
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
            onPressEmptyBio={() => setEditing(true)}
          />

          <LevelCard info={info} points={points} coins={coins} onPressStore={() => setStoreOpen(true)} />

          <StatsRow
            hypes={stats.hypeReportCount}
            reviews={stats.reviewCount}
            venues={activity.visitedVenueCount}
          />

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

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
          >
            <Feather name="log-out" size={15} color={colors.hypeHigh} />
            <Text style={styles.signOutText}>Sair da conta</Text>
          </Pressable>
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topButton: {
    width: 40,
    height: 40,
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
