import {
  AVATAR_VIEWS,
  BOTTOM_COLORS,
  DEFAULT_LOOK,
  EYE_COLORS,
  HAIR_COLORS,
  LOOK_SLOTS,
  SHOE_COLORS,
  SKIN_COLORS,
  TOP_COLORS,
} from "@/data/character";
import {
  canUseItem,
  DEFAULT_FRAME_ID,
  getItem,
  getRarity,
  isLookSlot,
  itemsOfKind,
  STORE_ITEMS,
  viewForKind,
} from "@/data/storeCatalog";

const COLOR_MAPS: Record<string, Record<string, string>> = {
  skin: SKIN_COLORS,
  eyes: EYE_COLORS,
  hairColor: HAIR_COLORS,
  top: TOP_COLORS,
  bottom: BOTTOM_COLORS,
  shoes: SHOE_COLORS,
};

describe("catálogo da loja", () => {
  it("não repete id", () => {
    const ids = STORE_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo item tem preço inteiro e não negativo", () => {
    for (const item of STORE_ITEMS) {
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThanOrEqual(0);
    }
  });

  it("todo espaço do personagem tem ao menos uma peça gratuita (dá pra montar um look sem gastar)", () => {
    for (const slot of LOOK_SLOTS) {
      expect(itemsOfKind(slot).some((item) => item.price === 0)).toBe(true);
    }
  });

  it("o look padrão só usa peças gratuitas que existem", () => {
    for (const slot of LOOK_SLOTS) {
      const item = getItem(DEFAULT_LOOK[slot]);
      expect(item?.kind).toBe(slot);
      expect(item?.price).toBe(0);
    }
  });

  it("toda peça com cor no modelo tem entrada no mapa de cores, e vice-versa", () => {
    for (const [slot, colors] of Object.entries(COLOR_MAPS)) {
      const ids = itemsOfKind(slot as never).map((item) => item.id);
      expect(ids.sort()).toEqual(Object.keys(colors).sort());
    }
  });

  it("a moldura padrão existe e é gratuita", () => {
    expect(getItem(DEFAULT_FRAME_ID)?.price).toBe(0);
  });

  it("canUseItem: gratuito ou comprado", () => {
    const paid = STORE_ITEMS.find((item) => item.price > 0)!;
    expect(canUseItem(paid, [])).toBe(false);
    expect(canUseItem(paid, [paid.id])).toBe(true);
    expect(canUseItem(getItem(DEFAULT_FRAME_ID)!, [])).toBe(true);
  });

  it("raridade acompanha o preço", () => {
    expect(getRarity({ ...getItem("sk-1")!, price: 0 })).toBe("common");
    expect(getRarity({ ...getItem("sk-1")!, price: 100 })).toBe("rare");
    expect(getRarity({ ...getItem("sk-1")!, price: 250 })).toBe("epic");
    expect(getRarity({ ...getItem("sk-1")!, price: 600 })).toBe("legendary");
  });

  it("enquadramento da prévia: roupa, calça e calçado de perto, o resto no busto", () => {
    expect(viewForKind("top")).toBe("top");
    expect(viewForKind("bottom")).toBe("bottom");
    expect(viewForKind("shoes")).toBe("shoes");
    for (const kind of ["skin", "eyes", "hair", "hairColor", "accessory", "mood", "frame", "title"] as const) {
      expect(viewForKind(kind)).toBe("bust");
    }
    for (const slot of LOOK_SLOTS) {
      expect(AVATAR_VIEWS[viewForKind(slot)]).toBeDefined();
      expect(isLookSlot(slot)).toBe(true);
    }
  });
});
