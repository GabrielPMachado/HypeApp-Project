import { DEFAULT_LOOK, LOOK_SLOTS } from "@/data/character";
import { getItem } from "@/data/storeCatalog";
import { lookEquals, parseLook, resolveLook, seededLook, withPart } from "@/utils/look";

describe("parseLook", () => {
  it("devolve null quando não é um mapa", () => {
    expect(parseLook(undefined)).toBeNull();
    expect(parseLook(null)).toBeNull();
    expect(parseLook("hs-short")).toBeNull();
    expect(parseLook(["hs-short"])).toBeNull();
  });

  it("aceita um look completo", () => {
    const look = { ...DEFAULT_LOOK, hair: "hs-long", top: "tp-blazer" };
    expect(parseLook(look)).toEqual(look);
  });

  it("completa espaços que faltam com a peça padrão", () => {
    expect(parseLook({ hair: "hs-curly" })).toEqual({ ...DEFAULT_LOOK, hair: "hs-curly" });
  });

  it("ignora id desconhecido ou de outro tipo de peça", () => {
    const look = parseLook({ hair: "hs-inexistente", top: "hs-long", bottom: 42 });
    expect(look).toEqual(DEFAULT_LOOK);
  });
});

describe("seededLook", () => {
  it("é sempre o mesmo pra mesma semente", () => {
    expect(seededLook("Ana")).toEqual(seededLook("Ana"));
  });

  it("só usa peças gratuitas, cada uma no espaço certo", () => {
    for (const seed of ["Ana", "Bruno", "Carla", "Dani", "", "😀 emoji", "a".repeat(200)]) {
      const look = seededLook(seed);
      for (const slot of LOOK_SLOTS) {
        const item = getItem(look[slot]);
        expect(item?.kind).toBe(slot);
        expect(item?.price).toBe(0);
      }
    }
  });

  it("nunca sorteia careca", () => {
    const hairs = new Set<string>();
    for (let i = 0; i < 400; i++) hairs.add(seededLook(`pessoa-${i}`).hair);
    expect(hairs.has("hs-bald")).toBe(false);
    expect(hairs.size).toBeGreaterThan(3);
  });

  it("varia entre pessoas diferentes", () => {
    const looks = new Set(["Ana", "Bruno", "Carla", "Dani", "Edu", "Fabi", "Gabi", "Hugo"].map((n) => JSON.stringify(seededLook(n))));
    expect(looks.size).toBeGreaterThan(4);
  });
});

describe("resolveLook", () => {
  it("usa o look salvo quando existe", () => {
    const saved = { ...DEFAULT_LOOK, hair: "hs-bun" };
    expect(resolveLook(saved, "Ana")).toBe(saved);
  });

  it("cai no look sorteado pelo nome quando não montou o seu", () => {
    expect(resolveLook(null, "Ana")).toEqual(seededLook("Ana"));
    expect(resolveLook(undefined, "Ana")).toEqual(seededLook("Ana"));
  });
});

describe("withPart e lookEquals", () => {
  it("troca só o espaço da peça", () => {
    const item = getItem("tp-tux")!;
    const next = withPart(DEFAULT_LOOK, item);
    expect(next.top).toBe("tp-tux");
    expect(next.hair).toBe(DEFAULT_LOOK.hair);
    expect(DEFAULT_LOOK.top).not.toBe("tp-tux"); // não muta o original
  });

  it("moldura e título não mudam o personagem", () => {
    expect(withPart(DEFAULT_LOOK, getItem("fr-gold")!)).toBe(DEFAULT_LOOK);
    expect(withPart(DEFAULT_LOOK, getItem("ti-king")!)).toBe(DEFAULT_LOOK);
  });

  it("compara os nove espaços", () => {
    expect(lookEquals(DEFAULT_LOOK, { ...DEFAULT_LOOK })).toBe(true);
    for (const slot of LOOK_SLOTS) {
      expect(lookEquals(DEFAULT_LOOK, { ...DEFAULT_LOOK, [slot]: "outro" })).toBe(false);
    }
  });
});
