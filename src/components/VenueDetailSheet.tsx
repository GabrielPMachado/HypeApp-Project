import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

const DRAG_DISMISS_DISTANCE = 120; // arrastou mais que isso, solta e fecha
const DRAG_DISMISS_VELOCITY = 0.8; // ou arrastou rápido o suficiente
const SHEET_EXIT_DISTANCE = 800; // bem maior que qualquer altura de tela real

// Detalhe do bar como uma "folha" que sobe de baixo e fica por cima da
// lista (não navega pra outra tela) — a lista continua ali embaixo,
// visível ao redor, e um toque fora ou no X fecha e volta pra ela.
export function VenueDetailSheet({ visible, venue, onClose }: VenueDetailSheetProps) {
  const { addHypeReport, addReview, setVenueLogo } = useVenues();
  const [isHypeModalOpen, setHypeModalOpen] = useState(false);
  const [isEvaluationOpen, setEvaluationOpen] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;
  // Posição atual do scroll do conteúdo — só vira gesto de fechar a
  // folha quando ela estiver zerada (conteúdo já no topo). Fica numa
  // ref (não state) pra não causar re-render a cada pixel rolado.
  const scrollY = useRef(0);

  // onClose pode ser um novo arrow function a cada render do pai; a ref
  // garante que o PanResponder (criado uma vez só) sempre chame a
  // versão mais recente, sem precisar recriar o gesture handler.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Toda vez que a folha reabre, garante que ela comece na posição
  // normal (caso a última interação tenha sido um arraste incompleto).
  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const handleGestureRelease = (gesture: { dy: number; vy: number }) => {
    const shouldDismiss = gesture.dy > DRAG_DISMISS_DISTANCE || gesture.vy > DRAG_DISMISS_VELOCITY;

    if (shouldDismiss) {
      Animated.timing(translateY, {
        toValue: SHEET_EXIT_DISTANCE,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onCloseRef.current());
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  };

  // Arraste sempre ativo na área do puxador (não tem scroll ali, então
  // não precisa checar posição nenhuma).
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dx) < 30,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => handleGestureRelease(gesture),
    })
  ).current;

  // Arraste em qualquer ponto do conteúdo (inclusive por cima do
  // ScrollView) — mas só "rouba" o gesto do scroll quando o conteúdo já
  // estiver no topo (scrollY <= 0) e o dedo estiver puxando pra baixo.
  // Usa a fase de "capture" pra interceptar antes do ScrollView decidir
  // que o toque é dele.
  const contentPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        scrollY.current <= 0 && gesture.dy > 6 && Math.abs(gesture.dx) < 30,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => handleGestureRelease(gesture),
    })
  ).current;

  if (!venue) return null;

  const hypeStatus = getCurrentHypeStatus(venue.hypeReports);
  const aggregateRating = getAggregateRating(venue.reviews);
  const vibeTags = getAggregateVibeTags(venue);

  // Sem backend ainda, então a logo é a URI local do celular (galeria).
  // Fica salva só neste aparelho, mas já deixa a estrutura pronta pro
  // dia que vier de um upload de verdade.
  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Preciso de acesso às suas fotos pra definir a logo do local."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setVenueLogo(venue.id, result.assets[0].uri);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.dragZone} {...handlePanResponder.panHandlers}>
              <View style={styles.handle} />
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>

            <View style={styles.scrollWrap} {...contentPanResponder.panHandlers}>
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                onScroll={(event) => {
                  scrollY.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
              >
              <View style={styles.headerBlock}>
                <View style={styles.identityRow}>
                  <Pressable onPress={pickLogo} style={styles.avatarWrap}>
                    <VenueAvatar
                      name={venue.name}
                      logoUrl={venue.logoUrl}
                      vibeTag={venue.vibeTags[0]}
                      size={56}
                    />
                    <View style={styles.avatarEditBadge}>
                      <Feather name="camera" size={11} color={colors.background} />
                    </View>
                  </Pressable>
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
                    <Text style={styles.hypeScoreText}>{venue.hypeScore.toFixed(1)} hype agora</Text>
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
                  style={({ pressed }) => [styles.hypeButton, pressed && styles.buttonPressed]}
                >
                  <Feather name="zap" size={15} color={colors.background} />
                  <Text style={styles.hypeButtonText}>Hype agora</Text>
                </Pressable>

                <Pressable
                  onPress={() => setEvaluationOpen(true)}
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
            </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <HypeReportModal
        visible={isHypeModalOpen}
        venueName={venue.name}
        currentHypeLevel={hypeStatus?.level ?? "medium"}
        onClose={() => setHypeModalOpen(false)}
        onSubmit={(level) => addHypeReport(venue.id, level)}
      />

      <EvaluationModal
        visible={isEvaluationOpen}
        venueName={venue.name}
        onClose={() => setEvaluationOpen(false)}
        onSubmit={({ rating, vibeTags: selectedTags, comment }) => {
          addReview(venue.id, { authorName: "Você", rating, vibeTags: selectedTags, comment });
          setEvaluationOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    maxHeight: "92%",
    minHeight: "60%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingTop: 10,
  },
  // Área de toque bem maior que a barrinha visível, mas só no centro —
  // fica longe do botão de fechar (que está no canto direito), então
  // não disputa gesto com ele.
  dragZone: {
    alignSelf: "center",
    width: 140,
    paddingVertical: 10,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  closeButton: {
    position: "absolute",
    top: 14,
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
  scrollWrap: {
    flex: 1,
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
  avatarEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
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
