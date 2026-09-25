import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { Character3D } from "@/components/Character3D";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import type { AvatarView, Look } from "@/data/character";
import { DEFAULT_FRAME_ID, getItem } from "@/data/storeCatalog";
import { resolveLook } from "@/utils/look";

interface UserAvatarProps {
  name: string;
  // Peças equipadas do personagem; null/ausente = ainda não montou o seu
  // (cai num personagem inicial sorteado a partir do nome, ver resolveLook).
  look?: Look | null;
  frameId?: string | null;
  size?: number;
  // Halo suave na cor da moldura — só nos tamanhos grandes (perfil).
  glow?: boolean;
  // Enquadramento: "bust" (padrão) é o busto num círculo, "full" é o boneco 3D
  // de corpo inteiro num cartão em pé (size vira a altura), e "top" | "bottom" |
  // "shoes" são recortes de perto pra prévia de peças na loja.
  view?: AvatarView;
  // Só no "full": o boneco balança e gira com o dedo.
  interactive?: boolean;
  paused?: boolean;
}

// Largura do cartão de corpo inteiro em relação à altura.
const FULL_ASPECT = 0.62;

// Avatar do usuário: o personagem montado por ele (data/character.ts) sobre um
// fundo tingido pela cor da moldura equipada, dentro da moldura. Id de moldura
// desconhecido (item removido do catálogo, dado antigo) cai na padrão.
export function UserAvatar({ name, look, frameId, size = 44, glow = false, view = "bust", interactive = false, paused = false }: UserAvatarProps) {
  const frame = getItem(frameId) ?? getItem(DEFAULT_FRAME_ID)!;
  const character = resolveLook(look, name);

  const ring = Math.max(2, Math.round(size * 0.055));
  const inner = size - ring * 2;

  if (view === "full") {
    const width = Math.round(size * FULL_ASPECT);
    const radius = Math.round(width * 0.24);
    const border = Math.max(2, Math.round(width * 0.03));
    const stage = (
      <View style={[styles.faceBase, { width: width - border * 2, height: size - border * 2, borderRadius: radius - border }]}>
        <Character3D
          look={character}
          width={width - border * 2}
          height={size - border * 2}
          frameColor={frame.color}
          interactive={interactive}
          paused={paused}
        />
      </View>
    );
    return (
      <View
        style={{ width, height: size }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Personagem de ${name || "usuário"}`}
      >
        {glow && (
          <View
            pointerEvents="none"
            style={[
              styles.glow,
              { top: -12, left: -12, width: width + 24, height: size + 24, borderRadius: radius + 12, backgroundColor: `${frame.color}22` },
            ]}
          />
        )}
        {frame.gradient ? (
          <LinearGradient
            colors={frame.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.center, { width, height: size, borderRadius: radius }]}
          >
            {stage}
          </LinearGradient>
        ) : (
          <View style={[styles.center, { width, height: size, borderRadius: radius, borderWidth: border, borderColor: frame.color }]}>
            {stage}
          </View>
        )}
      </View>
    );
  }

  const face = (
    <View style={[styles.faceBase, { width: inner, height: inner, borderRadius: inner / 2 }]}>
      <LinearGradient
        colors={[`${frame.color}66`, `${frame.color}12`]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.faceFill}
      >
        <CharacterAvatar look={character} view={view} size={inner} />
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
});
