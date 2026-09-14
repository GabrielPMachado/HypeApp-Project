import { Feather } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import { VIBE_TAG_ICONS } from "@/constants/vibeTags";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { VibeTag } from "@/types/venue";

// Paleta de identidade só pra distinguir os avatares entre si — tons
// dessaturados, coerentes com a paleta "dark premium" do app.
const AVATAR_PALETTE = ["#4E9E77", "#C79A3E", "#C1584B", "#6C8EBF", "#8B6FB3", "#4F9DA6"];

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
// bem arredondado). O destaque de "líder do ranking" fica por conta do
// card inteiro (ver NeonBorder em VenueCard), não do avatar.
export function VenueAvatar({ name, logoUrl, vibeTag, size = 44 }: VenueAvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size * 0.18 };

  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={[styles.image, dimensionStyle]} />;
  }

  const tone = AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
  const iconName = vibeTag ? VIBE_TAG_ICONS[vibeTag] : "map-pin";

  return (
    <View
      style={[
        styles.placeholder,
        dimensionStyle,
        { backgroundColor: `${tone}33`, borderColor: `${tone}55` },
      ]}
    >
      <Feather name={iconName} size={size * 0.6} color={`${tone}55`} style={styles.watermark} />
      <Text style={[styles.initials, { color: tone, fontSize: size * 0.32 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceRaised,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  watermark: {
    position: "absolute",
  },
  initials: {
    fontFamily: fontFamily.display,
  },
});
