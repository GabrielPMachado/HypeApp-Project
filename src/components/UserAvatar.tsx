import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { DEFAULT_AVATAR_ID, DEFAULT_FRAME_ID, getItem } from "@/data/storeCatalog";
import { fontFamily } from "@/theme/typography";

interface UserAvatarProps {
  name: string;
  avatarId?: string | null;
  frameId?: string | null;
  size?: number;
  // Halo suave na cor da moldura — só nos tamanhos grandes (perfil).
  glow?: boolean;
}

// Avatar do usuário: glifo do avatar equipado (ou a inicial do nome, no
// "Clássico") sobre um degradê do tom do item, dentro da moldura equipada.
// Ids desconhecidos (item removido do catálogo, dado antigo) caem no
// padrão em vez de quebrar.
export function UserAvatar({ name, avatarId, frameId, size = 44, glow = false }: UserAvatarProps) {
  const avatar = getItem(avatarId) ?? getItem(DEFAULT_AVATAR_ID)!;
  const frame = getItem(frameId) ?? getItem(DEFAULT_FRAME_ID)!;

  const ring = Math.max(2, Math.round(size * 0.055));
  const inner = size - ring * 2;
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  const face = (
    <View style={[styles.faceBase, { width: inner, height: inner, borderRadius: inner / 2 }]}>
      <LinearGradient
        colors={[`${avatar.color}55`, `${avatar.color}14`]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.faceFill}
      >
        {avatar.icon ? (
          <MaterialCommunityIcons name={avatar.icon} size={inner * 0.56} color={avatar.color} />
        ) : (
          <Text
            style={[styles.initial, { fontSize: inner * 0.44, color: avatar.color }]}
            allowFontScaling={false}
          >
            {initial}
          </Text>
        )}
      </LinearGradient>
    </View>
  );

  const outer = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Avatar de ${name || "usuário"}`}
    >
      {glow && (
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              backgroundColor: `${frame.color}26`,
            },
          ]}
        />
      )}

      {frame.gradient ? (
        <LinearGradient
          colors={frame.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.center, outer]}
        >
          {face}
        </LinearGradient>
      ) : (
        <View style={[styles.center, outer, { borderWidth: ring, borderColor: frame.color }]}>{face}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  faceBase: {
    backgroundColor: "#0F0F13",
    overflow: "hidden",
  },
  faceFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    top: -10,
    left: -10,
  },
  initial: {
    fontFamily: fontFamily.display,
  },
});
