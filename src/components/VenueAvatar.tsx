import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

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
  size?: number;
}

// Mostra a foto real do bar quando existir (logoUrl); enquanto não temos
// esse dado (upload via Firebase Storage é próxima etapa), cai pra um
// card de iniciais com cor determinística — nunca genérico/vazio.
// Formato quadrado arredondado (não círculo) de propósito: lê como foto
// de local, não como avatar de perfil de usuário.
export function VenueAvatar({ name, logoUrl, size = 44 }: VenueAvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size * 0.28 };

  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={[styles.image, dimensionStyle]} />;
  }

  const tone = AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];

  return (
    <View
      style={[
        styles.placeholder,
        dimensionStyle,
        { backgroundColor: `${tone}33`, borderColor: `${tone}55` },
      ]}
    >
      <Text style={[styles.initials, { color: tone, fontSize: size * 0.36 }]}>
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
  },
  initials: {
    fontFamily: fontFamily.display,
  },
});
