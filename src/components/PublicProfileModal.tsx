import { Feather } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BadgeGrid, LevelCard, ProfileHero, Section, StatsRow } from "@/components/ProfileParts";
import { useVenues } from "@/context/VenuesContext";
import { getItem } from "@/data/storeCatalog";
import { db } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { calcPoints, getBadges, getLevelInfo, getUserActivity } from "@/utils/gamification";
import { parseProfile, type Profile } from "@/utils/profile";

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

interface PublicProfileModalProps {
  uid: string | null;
  visible: boolean;
  onClose: () => void;
}

// Perfil de OUTRA pessoa (aberto tocando no nome de quem avaliou): só
// leitura, sem e-mail nem moedas. Carrega users/{uid} sob demanda — o
// documento é público pra qualquer usuário logado (ver regras do
// Firestore).
export function PublicProfileModal({ uid, visible, onClose }: PublicProfileModalProps) {
  const { venues } = useVenues();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!visible || !uid || !db) return;

    let cancelled = false;
    setLoading(true);
    setHasError(false);
    setProfile(null);

    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) setProfile(parseProfile(snap.data()));
        else setHasError(true);
      })
      .catch((error) => {
        console.error("Perfil público: leitura falhou:", error);
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, uid]);

  const stats = {
    hypeReportCount: profile?.hypeReportCount ?? 0,
    reviewCount: profile?.reviewCount ?? 0,
  };
  const points = calcPoints(stats);
  const info = getLevelInfo(points);
  const visitedVenues = useMemo(
    () => (uid ? getUserActivity(venues, uid).visitedVenueCount : 0),
    [venues, uid]
  );

  const titleItem = getItem(profile?.titleId);
  const createdAt = profile?.createdAt;
  const memberSince = createdAt ? `Membro desde ${MONTHS[createdAt.getMonth()]} de ${createdAt.getFullYear()}` : "";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.topButton}>
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Perfil</Text>
          <View style={styles.topButton} />
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {hasError && !isLoading && (
          <View style={styles.center}>
            <Feather name="user-x" size={28} color={colors.textFaint} />
            <Text style={styles.errorText}>Não foi possível abrir esse perfil.</Text>
          </View>
        )}

        {profile && !isLoading && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ProfileHero
              name={profile.displayName}
              avatarId={profile.avatarId}
              frameId={profile.frameId}
              titleLabel={titleItem?.name ?? info.title}
              titleColor={titleItem?.color}
              subtitle={memberSince}
              bio={profile.bio}
              vibes={profile.favoriteVibes}
            />

            <LevelCard info={info} points={points} />

            <StatsRow
              hypes={stats.hypeReportCount}
              reviews={stats.reviewCount}
              venues={visitedVenues}
            />

            <Section title="CONQUISTAS">
              <BadgeGrid badges={getBadges(stats, visitedVenues)} />
            </Section>
          </ScrollView>
        )}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 22,
  },
});
