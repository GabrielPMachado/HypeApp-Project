import { Feather } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HypeBadge } from "@/components/HypeBadge";
import { NeonBorder } from "@/components/NeonBorder";
import { VenueAvatar } from "@/components/VenueAvatar";
import { VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Venue, VibeTag } from "@/types/venue";
import { getCurrentHypeStatus } from "@/utils/hype";
import { getAggregateVibeTags } from "@/utils/vibeTags";

// Espaçamento entre os itens da linha de tags — precisa ser o mesmo
// número usado no "gap" do estilo tagsRow, pra conta de quantos itens
// cabem bater com o espaçamento real renderizado.
const TAG_GAP = 6;

interface VenueCardProps {
  venue: Venue;
  rank: number;
  onPress: () => void;
}

export function VenueCard({ venue, rank, onPress }: VenueCardProps) {
  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const vibeTags = getAggregateVibeTags(venue);
  const isLeader = rank === 1;

  return (
    <NeonBorder active={isLeader} borderRadius={18} borderWidth={2}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${venue.name}, ${rank}º no ranking, hype ${(hypeStatus?.score ?? venue.hypeScore).toFixed(1).replace(".", ",")}${
          isLeader ? ", o mais hypado agora" : ""
        }`}
        accessibilityHint="Abre os detalhes do local"
        style={({ pressed }) => [
          styles.card,
          isLeader && styles.cardLeaderInner,
          pressed && styles.cardPressed,
        ]}
      >
      {isLeader && (
        <View style={styles.leaderBadge}>
          <Feather name="trending-up" size={11} color={colors.background} />
          <Text style={styles.leaderBadgeText}>Mais hypado agora</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <VenueAvatar
          name={venue.name}
          logoUrl={venue.logoUrl}
          vibeTag={venue.vibeTags[0]}
          size={52}
        />

        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {venue.address}
          </Text>
        </View>

        {/* Coluna com a nota de hype e, embaixo dela, quantas pessoas já
            avaliaram até agora — a posição no ranking já fica clara pela
            ordem da lista, sem precisar repetir um número no card. */}
        <View style={styles.rankColumn}>
          <View style={styles.scorePill}>
            <Feather name="zap" size={12} color={colors.accent} />
            <Text style={styles.scoreText}>{(hypeStatus?.score ?? venue.hypeScore).toFixed(1)}</Text>
          </View>

          <View style={styles.reportCountBadge}>
            <View style={styles.reportCountDot} />
            <Text style={styles.reportCountText}>{venue.hypeReports.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {venue.openingHours}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="dollar-sign" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{venue.priceRange}</Text>
        </View>
      </View>

      <TagsRow
        leading={
          hypeStatus ? (
            <HypeBadge level={hypeStatus.level} />
          ) : (
            <Text style={styles.noStatus}>Sem status</Text>
          )
        }
        tags={vibeTags}
      />
      </Pressable>
    </NeonBorder>
  );
}

interface TagsRowProps {
  leading: ReactNode;
  tags: VibeTag[];
}

// A linha de tags não pode virar duas linhas: quando o selo de status +
// as características não cabem lado a lado, corta o excesso e mostra
// um "+N" no lugar — só quando o usuário toca nele é que o resto
// aparece (aí sim a linha pode quebrar livremente).
//
// RN não tem um "line-clamp" pronto, então a única forma confiável de
// saber quantos itens cabem é medir a largura real de cada um. Por
// isso existe essa cópia invisível (measureRow) — ela renderiza os
// mesmos itens fora da tela só pra capturar o tamanho de cada um via
// onLayout, sem ocupar espaço nem responder a toque.
function TagsRow({ leading, tags }: TagsRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [rowWidth, setRowWidth] = useState(0);
  const [leadingWidth, setLeadingWidth] = useState(0);
  const [moreChipWidth, setMoreChipWidth] = useState(0);
  const [tagWidths, setTagWidths] = useState<Partial<Record<VibeTag, number>>>({});

  const measured =
    rowWidth > 0 &&
    leadingWidth > 0 &&
    moreChipWidth > 0 &&
    tags.every((tag) => tagWidths[tag] !== undefined);

  const visibleCount = useMemo(() => {
    if (!measured) return tags.length; // ainda sem medida — mostra tudo por 1 frame (fica escondido pelo overflow:hidden até recalcular)
    let used = leadingWidth;
    let count = 0;
    for (let i = 0; i < tags.length; i++) {
      const width = tagWidths[tags[i]] ?? 0;
      const hasMoreAfter = i < tags.length - 1;
      const projected = used + TAG_GAP + width;
      const needed = hasMoreAfter ? projected + TAG_GAP + moreChipWidth : projected;
      if (needed > rowWidth) break;
      used = projected;
      count++;
    }
    return count;
  }, [measured, tags, tagWidths, leadingWidth, moreChipWidth, rowWidth]);

  const hiddenCount = tags.length - visibleCount;
  const visibleTags = expanded ? tags : tags.slice(0, visibleCount);

  return (
    <View>
      <View
        style={[styles.tagsRow, !expanded && styles.tagsRowCollapsed]}
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
      >
        {leading}
        {visibleTags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
          </View>
        ))}
        {!expanded && hiddenCount > 0 && (
          <Pressable
            onPress={() => setExpanded(true)}
            hitSlop={8}
            style={styles.moreChip}
            accessibilityRole="button"
            accessibilityLabel={`Mostrar mais ${hiddenCount} ${hiddenCount === 1 ? "característica" : "características"}`}
          >
            <Text style={styles.moreChipText}>+{hiddenCount}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.measureRow} pointerEvents="none">
        <View onLayout={(event) => setLeadingWidth(event.nativeEvent.layout.width)}>{leading}</View>
        {tags.map((tag) => (
          <View
            key={tag}
            style={styles.tag}
            onLayout={(event) => {
              // Precisa ler a largura AQUI, fora do updater de função —
              // o React já recicla/anula esse evento sintético antes de
              // (prev) => {...} rodar, então event.nativeEvent lá dentro
              // vem null (o aviso "synthetic event is reused" é exatamente isso).
              const width = event.nativeEvent.layout.width;
              setTagWidths((prev) => ({ ...prev, [tag]: width }));
            }}
          >
            <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
          </View>
        ))}
        <View style={styles.moreChip} onLayout={(event) => setMoreChipWidth(event.nativeEvent.layout.width)}>
          <Text style={styles.moreChipText}>+9</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  // Quando é o líder, o card fica dentro de um NeonBorder — a própria
  // borda estática vira supérflua (o anel giratório já demarca o card).
  cardLeaderInner: {
    borderWidth: 0,
  },
  cardPressed: {
    opacity: 0.85,
  },
  leaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: -2,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rankColumn: {
    alignItems: "center",
    gap: 5,
  },
  reportCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 20,
    height: 16,
    borderRadius: 999,
    paddingHorizontal: 5,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportCountDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.hypeLow,
  },
  reportCountText: {
    fontSize: 9,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.hypeLow,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  address: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  metaRow: {
    flexDirection: "row",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  noStatus: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: TAG_GAP,
  },
  // Enquanto não expandido, força uma linha só — o "+N" só existe
  // porque a gente já garantiu, via medição, que o que sobrou some daqui.
  tagsRowCollapsed: {
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  // Cópia invisível dos itens, só pra medir largura (ver TagsRow acima).
  measureRow: {
    position: "absolute",
    opacity: 0,
    flexDirection: "row",
    gap: TAG_GAP,
    top: -1000,
    left: 0,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  moreChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: colors.surfaceRaised,
  },
  moreChipText: {
    fontSize: 10,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
});
