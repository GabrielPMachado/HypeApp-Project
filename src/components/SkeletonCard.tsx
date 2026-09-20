import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme/colors";

// Blocos cinza que "respiram" no lugar do conteúdo enquanto ele carrega —
// dão a forma da tela antes dos dados chegarem (melhor que um spinner
// solto ou uma tela vazia).
function usePulse() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function Block({
  width,
  height,
  radius = 8,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
}) {
  return <View style={{ width, height, borderRadius: radius, backgroundColor: colors.borderStrong }} />;
}

// Mesma casca do VenueCard (raio, borda, padding, avatar + duas linhas +
// nota à direita + faixa de tags), pra a lista não "pular" quando os
// bares chegam.
export function SkeletonCard() {
  const pulse = usePulse();

  return (
    <Animated.View style={[styles.card, pulse]} accessible accessibilityLabel="Carregando">
      <View style={styles.headerRow}>
        <Block width={44} height={44} radius={8} />
        <View style={styles.lines}>
          <Block width="62%" height={16} />
          <Block width="80%" height={12} />
        </View>
        <Block width={54} height={30} radius={999} />
      </View>
      <Block width="55%" height={12} />
      <View style={styles.tagsRow}>
        <Block width={96} height={26} radius={999} />
        <Block width={112} height={26} radius={999} />
      </View>
    </Animated.View>
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
  },
});
