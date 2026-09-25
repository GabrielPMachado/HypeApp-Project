import { Box3 } from "three";

import { DEFAULT_LOOK, LOOK_SLOTS, type Look } from "@/data/character";
import { itemsOfKind } from "@/data/storeCatalog";
import { buildCharacterModel } from "@/three/characterModel";

function assertSound(look: Look) {
  const model = buildCharacterModel(look);
  const box = new Box3().setFromObject(model.root);
  expect(model.root.children.length).toBeGreaterThan(20);
  for (const value of [...box.min.toArray(), ...box.max.toArray()]) {
    expect(Number.isFinite(value)).toBe(true);
  }
  // pés no chão e o boneco cabe na altura esperada (~2 de altura, ~1 de largura)
  expect(box.min.y).toBeGreaterThan(-0.05);
  expect(box.max.y).toBeLessThan(2.3);
  expect(box.max.x - box.min.x).toBeLessThan(1.6);
  model.dispose();
}

describe("modelo 3D do personagem", () => {
  it("monta o look padrão", () => {
    assertSound(DEFAULT_LOOK);
  });

  // Cada peça de cada espaço, uma de cada vez sobre o look padrão: pega peça
  // sem case no switch, geometria com NaN ou objeto que sai do enquadramento.
  for (const slot of LOOK_SLOTS) {
    for (const item of itemsOfKind(slot)) {
      it(`monta com ${slot}=${item.id}`, () => {
        assertSound({ ...DEFAULT_LOOK, [slot]: item.id });
      });
    }
  }

  it("monta chapéu por cima de cada penteado", () => {
    for (const hair of itemsOfKind("hair")) {
      for (const accessory of ["ac-cap", "ac-fedora", "ac-crown", "ac-headphones"]) {
        assertSound({ ...DEFAULT_LOOK, hair: hair.id, accessory });
      }
    }
  });

  it("id desconhecido cai na peça padrão em vez de quebrar", () => {
    assertSound({ ...DEFAULT_LOOK, top: "tp-nao-existe", bottom: "x", shoes: "y", skin: "z", hair: "w" });
  });

  it("dispose pode ser chamado mais de uma vez", () => {
    const model = buildCharacterModel(DEFAULT_LOOK);
    model.dispose();
    expect(() => model.dispose()).not.toThrow();
  });
});
