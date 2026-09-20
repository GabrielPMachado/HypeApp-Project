import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { VibeTag } from "@/types/venue";
import type { Badge, LevelInfo, UserActivity } from "@/utils/gamification";
import { formatRelativeTime } from "@/utils/time";

// Blocos de tela compartilhados entre o perfil próprio (ProfileModal) e
// o perfil de outra pessoa (PublicProfileModal) — mesmos dados, só muda
// quem pode editar.

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function VibeChips({ tags }: { tags: VibeTag[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.chipsRow}>
      {tags.map((tag) => (
        <View key={tag} style={styles.chip}>
          <Text style={styles.chipText}>{VIBE_TAG_LABELS[tag]}</Text>
        </View>
      ))}
    </View>
  );
}

interface ProfileHeroProps {
  name: string;
  avatarId: string;
  frameId: string;
  titleLabel: string;
  titleColor?: string;
  subtitle?: string;
  bio: string;
  vibes: VibeTag[];
  // Só no perfil próprio: sem bio ainda, mostra um convite pra escrever.
  onPressEmptyBio?: () => void;
}

export function ProfileHero({
  name,
  avatarId,
  frameId,
  titleLabel,
  titleColor = colors.accent,
  subtitle,
  bio,
  vibes,
  onPressEmptyBio,
}: ProfileHeroProps) {
  return (
    <View style={styles.hero}>
      <UserAvatar name={name} avatarId={avatarId} frameId={frameId} size={96} />
      <Text style={styles.name} numberOfLines={1}>
        {name || "Sem nome"}
      </Text>
      <Text style={[styles.titleLine, { color: titleColor }]}>{titleLabel}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {bio.length > 0 ? (
        <Text style={styles.bio}>{bio}</Text>
      ) : onPressEmptyBio ? (
        <Pressable onPress={onPressEmptyBio} hitSlop={8}>
          <Text style={styles.bioEmpty}>Escreva uma bio pra se apresentar</Text>
        </Pressable>
      ) : null}

      <VibeChips tags={vibes} />
    </View>
  );
}

interface LevelCardProps {
  info: LevelInfo;
  points: number;
  // Moedas + atalho da loja (aparecem só no perfil próprio).
  coins?: number;
  onPressStore?: () => void;
}

export function LevelCard({ info, points, coins, onPressStore }: LevelCardProps) {
  return (
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

      {coins !== undefined && (
        <View style={styles.coinsRow}>
          <Text style={styles.coinsText}>🪙 {coins} moedas</Text>
          {onPressStore && (
            <Pressable
              onPress={onPressStore}
              hitSlop={8}
              style={({ pressed }) => [styles.storeButton, pressed && styles.pressed]}
            >
              <Feather name="shopping-bag" size={13} color={colors.background} />
              <Text style={styles.storeButtonText}>Loja</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function StatsRow({ hypes, reviews, venues }: { hypes: number; reviews: number; venues: number }) {
  return (
    <View style={styles.statsRow}>
      <StatTile icon="zap" value={hypes} label="Hypes" />
      <StatTile icon="edit-3" value={reviews} label="Avaliações" />
      <StatTile icon="map-pin" value={venues} label="Bares" />
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statTile}>
      <Feather name={icon} size={15} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <View style={styles.badgeGrid}>
      {badges.map((badge) => (
        <View key={badge.id} style={styles.badgeCell}>
          <View style={[styles.badgeIcon, badge.unlocked && styles.badgeIconUnlocked]}>
            <Feather
              name={badge.unlocked ? badge.icon : "lock"}
              size={20}
              color={badge.unlocked ? colors.accent : colors.textFaint}
            />
          </View>
          <Text
            style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]}
            numberOfLines={2}
          >
            {badge.name}
          </Text>
          <Text style={styles.badgeProgress}>{badge.unlocked ? "Conquistado" : badge.progress}</Text>
        </View>
      ))}
    </View>
  );
}

const MAX_ACTIVITY_ITEMS = 5;

export function ActivityList({ activity }: { activity: UserActivity }) {
  if (activity.items.length === 0) {
    return <Text style={styles.emptyText}>Nada por aqui ainda — mande um Hype ou avalie um bar!</Text>;
  }

  return (
    <View style={styles.activityBox}>
      {activity.favorite && (
        <View style={styles.favoriteRow}>
          <Feather name="heart" size={14} color={colors.accent} />
          <Text style={styles.favoriteText} numberOfLines={1}>
            Bar favorito: <Text style={styles.favoriteName}>{activity.favorite.venueName}</Text>
            {` · ${activity.favorite.count} ${activity.favorite.count === 1 ? "ação" : "ações"}`}
          </Text>
        </View>
      )}

      {activity.items.slice(0, MAX_ACTIVITY_ITEMS).map((item) => (
        <View key={item.id} style={styles.activityRow}>
          <View style={styles.activityIcon}>
            <Feather name={item.kind === "hype" ? "zap" : "edit-3"} size={13} color={colors.accent} />
          </View>
          <Text style={styles.activityText} numberOfLines={1}>
            {item.kind === "hype"
              ? `Hype ${item.value.toFixed(1)} em ${item.venueName}`
              : `Avaliou ${item.venueName} · ${item.value.toFixed(1)} ★`}
          </Text>
          <Text style={styles.activityTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textFaint,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.75,
  },

  hero: {
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
    marginTop: 8,
    maxWidth: "90%",
  },
  titleLine: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
  },
  bio: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  bioEmpty: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipText: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
  coinsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  coinsText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  storeButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
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

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
  },
  badgeCell: {
    width: "25%",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 2,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeIconUnlocked: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  badgeName: {
    fontSize: 10.5,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    textAlign: "center",
  },
  badgeNameLocked: {
    color: colors.textFaint,
  },
  badgeProgress: {
    fontSize: 10,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },

  activityBox: {
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  favoriteText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  favoriteName: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
  },
  activityText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  activityTime: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
});
