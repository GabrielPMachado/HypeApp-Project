import type { Group } from "three";

import { darken, DEFAULT_LOOK, EYE_COLORS, HAIR_COLORS, SKIN_COLORS, type Look } from "@/data/character";
import { buildAccessory } from "@/three/accessories";
import { buildBody } from "@/three/body";
import { buildHair, NATURAL_HAIR } from "@/three/hair";
import { buildHead, HEAD_OFFSET_Y, HEAD_SCALE } from "@/three/head";
import { Kit } from "@/three/kit";

// Modelo 3D do personagem: geometria procedural (esferas, cilindros, tubos)
// montada a partir do mesmo Look do avatar 2D, com luz e sombra de verdade —
// a versão "boneco 3D" do perfil, que gira. Só depende do three (nada de DOM),
// então roda igual no celular (expo-gl) e no navegador (galeria de testes).
//
// Unidades: o boneco tem ~1,8 de altura, pés em y=0, olhando pra +z.
//   kit.ts          material, tubo, revolução (ferramentas)
//   head.ts         crânio e rosto
//   hair.ts         cabelo (mechas achatadas fundidas)
//   ribbon.ts       geometria das mechas
//   accessories.ts  óculos, bonés, chapéus, coroa...
//   body.ts         braços, roupa, calça e calçado

export interface CharacterModel {
  root: Group;
  dispose(): void;
}

const HIDES_FRONT_HAIR = ["ac-cap", "ac-fedora"];

export function buildCharacterModel(look: Look): CharacterModel {
  const kit = new Kit();
  const skin = SKIN_COLORS[look.skin] ?? SKIN_COLORS[DEFAULT_LOOK.skin];
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[DEFAULT_LOOK.hairColor];
  const iris = EYE_COLORS[look.eyes] ?? EYE_COLORS[DEFAULT_LOOK.eyes];
  const brow = NATURAL_HAIR.includes(look.hairColor) ? darken(hair, 0.2) : "#3B2A22";

  // A cabeça é encolhida até a proporção de gente e posicionada com o queixo
  // logo acima dos ombros.
  kit.head.scale.setScalar(HEAD_SCALE);
  kit.head.position.set(0, HEAD_OFFSET_Y, 0);

  buildBody(kit, look, skin);
  buildHead(kit, { skin, iris, brow }, look.mood);
  buildHair(kit, look.hair, hair, HIDES_FRONT_HAIR.includes(look.accessory));
  buildAccessory(kit, look.accessory);

  return { root: kit.root, dispose: () => kit.dispose() };
}
