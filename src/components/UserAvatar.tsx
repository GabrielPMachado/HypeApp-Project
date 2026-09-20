import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { DEFAULT_AVATAR_ID, DEFAULT_FRAME_ID, getItem } from "@/data/storeCatalog";
import { fontFamily } from "@/theme/typography";

interface UserAvatarProps {
  name: string;
  avatarId?: string | null;
  frameId?: string | null;
  size?: number;
}

// Avatar do usuário: emoji do avatar equipado (ou a inicial do nome, no
// "Clássico") sobre um fundo do tom do item, dentro da moldura equipada.
// Ids desconhecidos (item removido do catálogo, dado antigo) caem no
// padrão em vez de quebrar.
export function UserAvatar({ name, avatarId, frameId, size = 44 }: UserAvatarProps) {
  const avatar = getItem(avatarId) ?? getItem(DEFAULT_AVATAR_ID)!;
  const frame = getItem(frameId) ?? getItem(DEFAULT_FRAME_ID)!;

  const ring = Math.max(2, Math.round(size * 0.055));
  const inner = size - ring * 2;
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  const face = (
    <View
      style={[
        styles.face,
        { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: `${avatar.color}33` },
      ]}
    >
      {avatar.emoji ? (
        <Text style={{ fontSize: inner * 0.52 }} allowFontScaling={false}>
          {avatar.emoji}
        </Text>
      ) : (
        <Text
          style={[styles.initial, { fontSize: inner * 0.42, color: avatar.color }]}
          allowFontScaling={false}
        >
          {initial}
        </Text>
      )}
    </View>
  );

  const outer = { width: size, height: size, borderRadius: size / 2 };

  if (frame.gradient) {
    return (
      <LinearGradient
        colors={frame.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.center, outer]}
      >
        {face}
      </LinearGradient>
    );
  }

  return <View style={[styles.center, outer, { borderWidth: ring, borderColor: frame.color }]}>{face}</View>;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  face: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontFamily: fontFamily.display,
  },
});
