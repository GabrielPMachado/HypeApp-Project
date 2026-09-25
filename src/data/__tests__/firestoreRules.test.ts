/// <reference types="node" />
import { readFileSync } from "fs";
import { join } from "path";

import { LOOK_SLOTS } from "@/data/character";
import { STORE_ITEMS, itemsOfKind } from "@/data/storeCatalog";

// As regras do Firestore validam a loja de verdade (preço, item gratuito,
// peças do personagem) e ficam em firestore/firestore.rules — o app sozinho
// não segura ninguém, porque as chaves do Firebase são públicas. Estes testes
// garantem que o catálogo do app e as regras dizem a mesma coisa: mudou preço
// ou peça num lado e esqueceu do outro, o teste quebra em vez da compra ser
// negada só no celular de alguém.
const RULES = readFileSync(join(__dirname, "..", "..", "..", "firestore", "firestore.rules"), "utf8");

function functionBody(name: string): string {
  const start = RULES.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`função ${name} não encontrada nas regras`);
  const open = RULES.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < RULES.length; i++) {
    if (RULES[i] === "{") depth += 1;
    if (RULES[i] === "}") {
      depth -= 1;
      if (depth === 0) return RULES.slice(open + 1, i);
    }
  }
  throw new Error(`função ${name} sem fechamento`);
}

const rulesPrices = new Map<string, number>(
  [...functionBody("itemPrice").matchAll(/'([a-z0-9-]+)':\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]),
);

const freePattern = /matches\('([^']+)'\)/.exec(functionBody("isFreeItem"))![1];
const isFreeInRules = (id: string) => new RegExp(`^(?:${freePattern})$`).test(id);

describe("regras do Firestore x catálogo da loja", () => {
  it("todo item pago do catálogo tem o mesmo preço nas regras", () => {
    for (const item of STORE_ITEMS.filter((i) => i.price > 0)) {
      expect({ id: item.id, price: rulesPrices.get(item.id) }).toEqual({ id: item.id, price: item.price });
    }
  });

  it("todo item gratuito do catálogo é gratuito nas regras (e não tem preço lá)", () => {
    for (const item of STORE_ITEMS.filter((i) => i.price === 0)) {
      expect({ id: item.id, free: isFreeInRules(item.id) }).toEqual({ id: item.id, free: true });
      expect(rulesPrices.has(item.id)).toBe(false);
    }
  });

  it("item pago nunca é gratuito nas regras", () => {
    for (const item of STORE_ITEMS.filter((i) => i.price > 0)) {
      expect({ id: item.id, free: isFreeInRules(item.id) }).toEqual({ id: item.id, free: false });
    }
  });

  it("as regras não têm preço de item que não existe mais (fora os ícones antigos av-*)", () => {
    const ids = new Set(STORE_ITEMS.map((item) => item.id));
    for (const id of rulesPrices.keys()) {
      if (id.startsWith("av-")) continue;
      expect({ id, inCatalog: ids.has(id) }).toEqual({ id, inCatalog: true });
    }
  });

  it("o look das regras aceita exatamente os espaços do personagem, cada um com seu prefixo", () => {
    const look = functionBody("validLook");
    const allowed = /hasOnly\(\[([^\]]+)\]\)/.exec(look)![1].match(/'([a-zA-Z]+)'/g)!.map((s) => s.replace(/'/g, ""));
    expect([...allowed].sort()).toEqual([...LOOK_SLOTS].sort());

    const prefixes = new Map([...look.matchAll(/validLookPart\(d, '([a-zA-Z]+)', '([a-z]+-)'\)/g)].map((m) => [m[1], m[2]]));
    expect([...prefixes.keys()].sort()).toEqual([...LOOK_SLOTS].sort());
    for (const slot of LOOK_SLOTS) {
      for (const item of itemsOfKind(slot)) {
        expect(item.id.startsWith(prefixes.get(slot)!)).toBe(true);
      }
    }
  });

  it("a edição de perfil das regras aceita o campo look", () => {
    expect(functionBody("profileEdit")).toContain("'look'");
  });
});
