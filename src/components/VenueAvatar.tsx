import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { VIBE_TAG_ICONS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { VibeTag } from "@/types/venue";

// Paleta de identidade só pra distinguir os avatares entre si — tons
// dessaturados, coerentes com a paleta "dark premium" do app.
const AVATAR_PALETTE = ["#4E9E77", "#C79A3E", "#C1584B", "#6C8EBF", "#8B6FB3", "#4F9DA6"];

// Cores da borda neon — o gradiente gira continuamente por trás, então a
// última cor repete a primeira pra fechar o loop sem "costura" visível.
const NEON_COLORS = ["#E8B24D", "#FF3DBB", "#7C4DFF", "#33D9FF", "#E8B24D"] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Anel giratório atrás do conteúdo do avatar: um quadrado bem maior que
// o próprio avatar (pra cobrir os cantos durante toda a volta) com um
// gradiente diagonal, girando sem parar. Só a borda fica visível porque
// o conteúdo por cima cobre o miolo (ver VenueAvatar).
function NeonRing({ size }: { size: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3200, easing: Easing.linear }),
      -1
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ringSize = size * 1.8; // cobre os cantos em qualquer ângulo de rotação

  return (
    <Animated.View
      style={[
        styles.neonRing,
        {
          width: ringSize,
          height: ringSize,
          left: (size - ringSize) / 2,
          top: (size - ringSize) / 2,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={NEON_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

interface VenueAvatarProps {
  name: string;
  logoUrl?: string;
  vibeTag?: VibeTag;
  size?: number;
}

// Mostra a foto real do bar quando existir (logoUrl) — hoje nenhum local
// tem, porque isso exigiria upload próprio ou uma API com licença pra
// servir fotos (ex: Google Places); não podemos usar fotos/logos reais
// de terceiros sem autorização. Enquanto isso, cai numa "marca" gerada:
// ícone da vibe do local (ver VIBE_TAG_ICONS) como marca d'água atrás
// das iniciais — formato retangular (cantos discretos, não um quadrado
// bem arredondado), com uma borda neon de gradiente girando ao redor.
export function VenueAvatar({ name, logoUrl, vibeTag, size = 44 }: VenueAvatarProps) {
  const outerRadius = size * 0.18;
  const borderWidth = Math.max(2, Math.round(size * 0.045));
  const innerSize = size - borderWidth * 2;
  const innerRadius = Math.max(2, outerRadius - borderWidth);

  const tone = AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
  const iconName = vibeTag ? VIBE_TAG_ICONS[vibeTag] : "map-pin";

  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: outerRadius }]}>
      <NeonRing size={size} />

      <View
        style={[
          styles.inner,
          {
            top: borderWidth,
            left: borderWidth,
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
          },
        ]}
      >
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={{ width: innerSize, height: innerSize, borderRadius: innerRadius }}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerRadius,
                backgroundColor: `${tone}33`,
              },
            ]}
          >
            <Feather name={iconName} size={size * 0.6} color={`${tone}55`} style={styles.watermark} />
            <Text style={[styles.initials, { color: tone, fontSize: size * 0.32 }]}>
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  neonRing: {
    position: "absolute",
  },
  inner: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  watermark: {
    position: "absolute",
  },
  initials: {
    fontFamily: fontFamily.display,
  },
});
