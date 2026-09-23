import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";

import { EvaluationModal } from "@/components/EvaluationModal";
import { HypeBadge } from "@/components/HypeBadge";
import { HypeReportModal } from "@/components/HypeReportModal";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { RatingStars } from "@/components/RatingStars";
import { ReviewItem } from "@/components/ReviewItem";
import { VenueAvatar } from "@/components/VenueAvatar";
import { VenueLocationMap } from "@/components/VenueLocationMap";
import { VIBE_TAG_LABELS } from "@/constants/vibeTags";
import { useVenues } from "@/context/VenuesContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { Venue } from "@/types/venue";
import { formatHypeWindow, getCurrentHypeStatus } from "@/utils/hype";
import { getAggregateRating, getOverallRating } from "@/utils/rating";
import { getAggregateVibeTags } from "@/utils/vibeTags";

interface VenueDetailSheetProps {
  visible: boolean;
  venue: Venue | null;
  onClose: () => void;
}

const SNAP_POINTS = ["92%"];

// Detalhe do bar como uma "folha" que sobe de baixo e fica por cima da
// lista (não navega pra outra tela). Usa @gorhom/bottom-sheet (com
// react-native-gesture-handler por baixo) em vez de Modal + PanResponder
// caseiro: arrastar-pra-fechar disputando toque com um ScrollView é um
// problema conhecido de coordenação nativa, e essa biblioteca é feita
// especificamente pra resolver isso nas duas plataformas — arraste de
// qualquer ponto do conteúdo, só fecha quando o scroll já estiver no topo.
export function VenueDetailSheet({ visible, venue, onClose }: VenueDetailSheetProps) {
  const { addHypeReport, addReview } = useVenues();
  const [isHypeModalOpen, setHypeModalOpen] = useState(false);
  const [isEvaluationOpen, setEvaluationOpen] = useState(false);
  const sheetRef = useRef<BottomSheetModal>(null);
  // Chamar dismiss() numa folha que a PRÓPRIA biblioteca já fechou
  // sozinha (gesto de arrastar ou toque no backdrop) é o que deixava
  // tudo preso de vez — não é só uma questão de tempo, o dismiss() extra
  // bagunça o estado interno da BottomSheetModal. Por isso rastreamos
  // SE foi a biblioteca que já fechou (via onDismiss, antes do nosso
  // efeito reagir) pra nunca mandar fechar de novo nesse caso.
  const dismissedByLibraryRef = useRef(false);
  // Só quando SOMOS NÓS que pedimos o fechamento (ex: botão X) que
  // existe uma janela real de "ainda fechando" — chamar present() logo
  // depois de um dismiss() programático nosso é o bug conhecido da
  // biblioteca com chamadas em sucessão rápida.
  const isClosingRef = useRef(false);
  const pendingOpenRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CLOSE_ANIMATION_MS = 350;

  const scheduleCloseUnlock = () => {
    if (closeTimeoutRef.current) return; // já tem um agendado, deixa terminar
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      isClosingRef.current = false;
      if (pendingOpenRef.current) {
        pendingOpenRef.current = false;
        present();
      }
    }, CLOSE_ANIMATION_MS);
  };

  // Sempre que a folha realmente abre, zera o sinalizador de "a
  // biblioteca já fechou sozinha" — ele só deve valer pro fechamento
  // seguinte a ESSA abertura, nunca sobrar de uma abertura anterior.
  const present = () => {
    dismissedByLibraryRef.current = false;
    sheetRef.current?.present();
  };

  // Reage tanto a "visible" quanto a "venue?.id": só olhar "visible" não
  // basta, porque clicar num card com a folha ainda aberta (fechando um
  // local e abrindo outro em seguida) não muda visible (já era true),
  // então o efeito nunca disparava de novo e a folha ficava presa.
  useEffect(() => {
    if (!visible) {
      pendingOpenRef.current = false;

      if (dismissedByLibraryRef.current) {
        // A folha já fechou sozinha antes desse efeito rodar (gesto ou
        // backdrop) — ela já está de fato fechada, nada a mandar fazer.
        dismissedByLibraryRef.current = false;
        isClosingRef.current = false;
        return;
      }

      // Fomos nós que pedimos o fechamento (botão X): a folha ainda
      // está de fato aberta, então mandamos fechar e aplicamos a janela
      // de segurança antes de aceitar reabrir.
      isClosingRef.current = true;
      sheetRef.current?.dismiss();
      scheduleCloseUnlock();
      return;
    }

    if (!isClosingRef.current) {
      present();
      return;
    }

    // Ainda dentro da janela de segurança de um fechamento programático
    // nosso — só marca que queremos abrir; o timer já agendado em
    // scheduleCloseUnlock cuida de chamar present() assim que a janela
    // terminar, sempre para o local mais recente pedido.
    pendingOpenRef.current = true;
  }, [visible, venue?.id]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  if (!venue) return null;

  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const aggregateRating = getAggregateRating(venue.reviews);
  const vibeTags = getAggregateVibeTags(venue);

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        onDismiss={() => {
          dismissedByLibraryRef.current = true;
          onClose();
        }}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Fechar detalhes do local"
        >
          <Feather name="x" size={18} color={colors.text} />
        </Pressable>

        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <View style={styles.identityRow}>
              <View style={styles.avatarWrap}>
                <VenueAvatar
                  name={venue.name}
                  logoUrl={venue.logoUrl}
                  vibeTag={venue.vibeTags[0]}
                  size={56}
                />
              </View>
              <View style={styles.identityText}>
                <Text style={styles.name}>{venue.name}</Text>
                <Text style={styles.address}>{venue.address}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather name="clock" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{venue.openingHours}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="dollar-sign" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{venue.priceRange}</Text>
              </View>
            </View>

            <View style={styles.tagsRow}>
              {vibeTags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.hypeBlock}>
            <View style={styles.hypeRow}>
              {hypeStatus ? (
                <HypeBadge level={hypeStatus.level} />
              ) : (
                <Text style={styles.noStatus}>Ainda sem status de hype</Text>
              )}
              <View style={styles.hypeScorePill}>
                <Feather name="zap" size={12} color={colors.accent} />
                <Text style={styles.hypeScoreText}>
                  {(hypeStatus?.score ?? venue.hypeScore).toFixed(1)} hype agora
                </Text>
              </View>
            </View>

            {hypeStatus && (
              <Text style={styles.hypeMeta}>
                Média de {hypeStatus.sampleSize}{" "}
                {hypeStatus.sampleSize === 1 ? "avaliação" : "avaliações"} — janela de{" "}
                {formatHypeWindow(hypeStatus.windowMinutes)}
              </Text>
            )}
          </View>

          <VenueLocationMap
            latitude={venue.latitude}
            longitude={venue.longitude}
            address={venue.address}
          />

          <View style={styles.evaluateRow}>
            <Pressable
              onPress={() => setHypeModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Hype agora"
              accessibilityHint="Diz como está o movimento do local neste momento"
              style={({ pressed }) => [styles.hypeButton, pressed && styles.buttonPressed]}
            >
              <Feather name="zap" size={15} color={colors.background} />
              <Text style={styles.hypeButtonText}>Hype agora</Text>
            </Pressable>

            <Pressable
              onPress={() => setEvaluationOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Avaliação completa"
              accessibilityHint="Dá notas de música, preço, atendimento e ambiente"
              style={({ pressed }) => [styles.fixedButton, pressed && styles.buttonPressed]}
            >
              <Feather name="edit-3" size={15} color={colors.text} />
              <Text style={styles.fixedButtonText}>Avaliação completa</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.overallRow}>
              <Text style={styles.sectionTitle}>Avaliação</Text>
              {aggregateRating && (
                <View style={styles.overallValue}>
                  <RatingStars value={getOverallRating(aggregateRating)} size={15} />
                  <Text style={styles.overallText}>
                    {getOverallRating(aggregateRating).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {aggregateRating ? (
              <RatingBreakdown rating={aggregateRating} />
            ) : (
              <Text style={styles.emptyReviews}>
                Ainda sem avaliações — toque em "Avaliação completa" pra ser o primeiro.
              </Text>
            )}
          </View>

          <PremiumTeaser
            title="Histórico do hype"
            description="Veja como a energia do local variou ao longo da noite. Disponível no plano Premium."
          />

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comentários {venue.reviews.length > 0 ? `(${venue.reviews.length})` : ""}
            </Text>

            {venue.reviews.length === 0 ? (
              <Text style={styles.emptyReviews}>Nenhum comentário ainda.</Text>
            ) : (
              <View style={styles.reviewsList}>
                {venue.reviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <HypeReportModal
        visible={isHypeModalOpen}
        venueName={venue.name}
        currentHypeScore={hypeStatus?.score ?? venue.hypeScore}
        onClose={() => setHypeModalOpen(false)}
        onSubmit={(score) => addHypeReport(venue.id, score)}
      />

      <EvaluationModal
        visible={isEvaluationOpen}
        venueName={venue.name}
        onClose={() => setEvaluationOpen(false)}
        onSubmit={({ rating, vibeTags: selectedTags, comment }) => {
          addReview(venue.id, { rating, vibeTags: selectedTags, comment });
          setEvaluationOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  handleIndicator: {
    backgroundColor: colors.borderStrong,
    width: 36,
    height: 4,
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 14,
    gap: 20,
  },
  headerBlock: {
    gap: 12,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 40,
  },
  avatarWrap: {
    position: "relative",
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  address: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hypeBlock: {
    gap: 6,
  },
  hypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noStatus: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  hypeScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hypeScoreText: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  hypeMeta: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  evaluateRow: {
    flexDirection: "row",
    gap: 10,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  hypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
  },
  hypeButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  fixedButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 13,
  },
  fixedButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overallText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  emptyReviews: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    fontStyle: "italic",
  },
  reviewsList: {
    marginTop: 4,
  },
});
