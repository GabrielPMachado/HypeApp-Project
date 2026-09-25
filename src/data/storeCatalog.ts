import {
  BOTTOM_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  LOOK_SLOT_LABELS,
  LOOK_SLOTS,
  SHOE_COLORS,
  SKIN_COLORS,
  TOP_COLORS,
  type AvatarView,
  type LookSlot,
} from "@/data/character";

// Catálogo da loja de cosméticos (peças do personagem, moldura e título),
// pago com as moedas do jogo (ver calcCoins em utils/gamification.ts).
//
// ATENÇÃO: os preços e a lista de itens gratuitos TAMBÉM existem nas
// regras do Firestore (funções itemPrice/isFreeItem, em
// firestore/firestore.rules) — é lá que a compra é validada de verdade, já
// que as chaves do Firebase são públicas e o app sozinho não segura
// ninguém. Mudou preço ou item aqui? Muda lá também e publica no Console
// (Firestore > Regras), senão a compra é negada. Um teste
// (__tests__/storeCatalog.test.ts) confere se as duas listas batem. Os ids
// são o que vale nas regras — nome e cor podem mudar à vontade. Os ids
// "av-*" da antiga loja de ícones seguem nas regras (compras antigas), mas
// não existem mais aqui.

export type ItemKind = LookSlot | "frame" | "title";

export interface StoreItem {
  id: string;
  kind: ItemKind;
  name: string;
  price: number; // 0 = gratuito (já vem liberado pra todo mundo)
  color: string; // cor de exemplo da peça / cor da moldura / cor do título
  gradient?: readonly [string, string, ...string[]]; // só molduras degradê
}

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  ...LOOK_SLOT_LABELS,
  frame: "Molduras",
  title: "Títulos",
};

export const DEFAULT_FRAME_ID = "fr-amber";

export function isLookSlot(kind: ItemKind): kind is LookSlot {
  return (LOOK_SLOTS as string[]).includes(kind);
}

// Enquadramento do personagem na prévia de cada tipo de peça: roupa, calça e
// calçado aparecem de perto; o resto (cabelo, olhos, moldura...) fica no busto.
export function viewForKind(kind: ItemKind): AvatarView {
  return kind === "top" || kind === "bottom" || kind === "shoes" ? kind : "bust";
}

export const STORE_ITEMS: StoreItem[] = [
  // Pele — tudo gratuito
  { id: "sk-1", kind: "skin", name: "Porcelana", price: 0, color: SKIN_COLORS["sk-1"] },
  { id: "sk-2", kind: "skin", name: "Areia", price: 0, color: SKIN_COLORS["sk-2"] },
  { id: "sk-3", kind: "skin", name: "Dourada", price: 0, color: SKIN_COLORS["sk-3"] },
  { id: "sk-4", kind: "skin", name: "Morena", price: 0, color: SKIN_COLORS["sk-4"] },
  { id: "sk-5", kind: "skin", name: "Canela", price: 0, color: SKIN_COLORS["sk-5"] },
  { id: "sk-6", kind: "skin", name: "Ébano", price: 0, color: SKIN_COLORS["sk-6"] },

  // Olhos
  { id: "ey-brown", kind: "eyes", name: "Castanhos", price: 0, color: EYE_COLORS["ey-brown"] },
  { id: "ey-hazel", kind: "eyes", name: "Mel", price: 0, color: EYE_COLORS["ey-hazel"] },
  { id: "ey-green", kind: "eyes", name: "Verdes", price: 0, color: EYE_COLORS["ey-green"] },
  { id: "ey-blue", kind: "eyes", name: "Azuis", price: 0, color: EYE_COLORS["ey-blue"] },
  { id: "ey-gray", kind: "eyes", name: "Cinza", price: 0, color: EYE_COLORS["ey-gray"] },
  { id: "ey-violet", kind: "eyes", name: "Violeta", price: 60, color: EYE_COLORS["ey-violet"] },

  // Cabelo
  { id: "hs-short", kind: "hair", name: "Curto", price: 0, color: "#9497A0" },
  { id: "hs-long", kind: "hair", name: "Longo", price: 0, color: "#9497A0" },
  { id: "hs-curly", kind: "hair", name: "Cacheado", price: 0, color: "#9497A0" },
  { id: "hs-bun", kind: "hair", name: "Coque", price: 0, color: "#9497A0" },
  { id: "hs-buzz", kind: "hair", name: "Raspado", price: 0, color: "#9497A0" },
  { id: "hs-bald", kind: "hair", name: "Careca", price: 0, color: "#9497A0" },
  { id: "hs-mohawk", kind: "hair", name: "Moicano", price: 100, color: "#9497A0" },
  { id: "hs-quiff", kind: "hair", name: "Topete", price: 100, color: "#9497A0" },

  // Cor do cabelo
  { id: "hc-black", kind: "hairColor", name: "Preto", price: 0, color: HAIR_COLORS["hc-black"] },
  { id: "hc-brown", kind: "hairColor", name: "Castanho", price: 0, color: HAIR_COLORS["hc-brown"] },
  { id: "hc-blond", kind: "hairColor", name: "Loiro", price: 0, color: HAIR_COLORS["hc-blond"] },
  { id: "hc-red", kind: "hairColor", name: "Ruivo", price: 0, color: HAIR_COLORS["hc-red"] },
  { id: "hc-gray", kind: "hairColor", name: "Grisalho", price: 0, color: HAIR_COLORS["hc-gray"] },
  { id: "hc-blue", kind: "hairColor", name: "Azul", price: 60, color: HAIR_COLORS["hc-blue"] },
  { id: "hc-pink", kind: "hairColor", name: "Rosa", price: 60, color: HAIR_COLORS["hc-pink"] },
  { id: "hc-purple", kind: "hairColor", name: "Roxo", price: 80, color: HAIR_COLORS["hc-purple"] },
  { id: "hc-green", kind: "hairColor", name: "Verde", price: 80, color: HAIR_COLORS["hc-green"] },

  // Roupa — pegada de vida noturna, do básico ao VIP
  { id: "tp-tee-black", kind: "top", name: "Camiseta preta", price: 0, color: TOP_COLORS["tp-tee-black"] },
  { id: "tp-tee-white", kind: "top", name: "Camiseta branca", price: 0, color: TOP_COLORS["tp-tee-white"] },
  { id: "tp-tee-amber", kind: "top", name: "Camiseta âmbar", price: 0, color: TOP_COLORS["tp-tee-amber"] },
  { id: "tp-hoodie-blue", kind: "top", name: "Moletom azul", price: 0, color: TOP_COLORS["tp-hoodie-blue"] },
  { id: "tp-puffer", kind: "top", name: "Casaco de pelo", price: 0, color: TOP_COLORS["tp-puffer"] },
  { id: "tp-jacket", kind: "top", name: "Jaqueta", price: 80, color: TOP_COLORS["tp-jacket"] },
  { id: "tp-shirt", kind: "top", name: "Camisa social", price: 120, color: TOP_COLORS["tp-shirt"] },
  { id: "tp-blazer", kind: "top", name: "Blazer", price: 250, color: TOP_COLORS["tp-blazer"] },
  { id: "tp-tux", kind: "top", name: "Smoking", price: 400, color: TOP_COLORS["tp-tux"] },

  // Calça
  { id: "bt-jeans", kind: "bottom", name: "Jeans", price: 0, color: BOTTOM_COLORS["bt-jeans"] },
  { id: "bt-black", kind: "bottom", name: "Calça preta", price: 0, color: BOTTOM_COLORS["bt-black"] },
  { id: "bt-shorts", kind: "bottom", name: "Bermuda", price: 0, color: BOTTOM_COLORS["bt-shorts"] },
  { id: "bt-cargo", kind: "bottom", name: "Cargo", price: 60, color: BOTTOM_COLORS["bt-cargo"] },
  { id: "bt-slacks", kind: "bottom", name: "Calça social", price: 100, color: BOTTOM_COLORS["bt-slacks"] },

  // Calçado
  { id: "sh-boots", kind: "shoes", name: "Botas", price: 0, color: SHOE_COLORS["sh-boots"] },
  { id: "sh-white", kind: "shoes", name: "Tênis branco", price: 0, color: SHOE_COLORS["sh-white"] },
  { id: "sh-black", kind: "shoes", name: "Tênis preto", price: 0, color: SHOE_COLORS["sh-black"] },
  { id: "sh-red", kind: "shoes", name: "Tênis vermelho", price: 60, color: SHOE_COLORS["sh-red"] },
  { id: "sh-dress", kind: "shoes", name: "Sapato social", price: 100, color: SHOE_COLORS["sh-dress"] },
  { id: "sh-gold", kind: "shoes", name: "Tênis dourado", price: 300, color: SHOE_COLORS["sh-gold"] },

  // Acessório
  { id: "ac-none", kind: "accessory", name: "Nenhum", price: 0, color: "#9497A0" },
  { id: "ac-glasses", kind: "accessory", name: "Óculos", price: 60, color: "#ECECF1" },
  { id: "ac-shades", kind: "accessory", name: "Óculos escuros", price: 80, color: "#111116" },
  { id: "ac-cap", kind: "accessory", name: "Boné", price: 80, color: "#C1584B" },
  { id: "ac-headphones", kind: "accessory", name: "Fone de DJ", price: 150, color: "#4FC3F7" },
  { id: "ac-fedora", kind: "accessory", name: "Chapéu", price: 200, color: "#4A3B34" },
  { id: "ac-crown", kind: "accessory", name: "Coroa", price: 600, color: "#FFD54A" },

  // Expressão — tudo gratuito
  { id: "md-smile", kind: "mood", name: "Sorriso", price: 0, color: "#9497A0" },
  { id: "md-cool", kind: "mood", name: "Descolado", price: 0, color: "#9497A0" },
  { id: "md-wink", kind: "mood", name: "Piscadinha", price: 0, color: "#9497A0" },
  { id: "md-laugh", kind: "mood", name: "Gargalhada", price: 0, color: "#9497A0" },

  // Molduras
  { id: "fr-amber", kind: "frame", name: "Âmbar", price: 0, color: "#E8B24D" },
  { id: "fr-cyan", kind: "frame", name: "Neon Ciano", price: 100, color: "#3DD6E0" },
  { id: "fr-pink", kind: "frame", name: "Rosa Choque", price: 100, color: "#F0559A" },
  { id: "fr-purple", kind: "frame", name: "Roxo Místico", price: 150, color: "#9B6BFF" },
  { id: "fr-gold", kind: "frame", name: "Ouro", price: 300, color: "#FFD54A" },
  {
    id: "fr-rainbow",
    kind: "frame",
    name: "Arco-íris",
    price: 500,
    color: "#B388FF",
    gradient: ["#FF5E62", "#FFC371", "#7CFF6B", "#4FC3F7", "#B388FF"],
  },

  // Títulos (linha sob o nome; sem título equipado, aparece o do nível)
  { id: "ti-night", kind: "title", name: "Vida Noturna", price: 60, color: "#E8B24D" },
  { id: "ti-king", kind: "title", name: "Rei da Pista", price: 200, color: "#E8B24D" },
  { id: "ti-legend", kind: "title", name: "Lenda Urbana", price: 500, color: "#E8B24D" },
];

const ITEMS_BY_ID = new Map(STORE_ITEMS.map((item) => [item.id, item]));

export function getItem(id: string | null | undefined): StoreItem | undefined {
  return id ? ITEMS_BY_ID.get(id) : undefined;
}

export function itemsOfKind(kind: ItemKind): StoreItem[] {
  return STORE_ITEMS.filter((item) => item.kind === kind);
}

// Liberado pra usar: gratuito ou já comprado.
export function canUseItem(item: StoreItem, inventory: readonly string[]): boolean {
  return item.price === 0 || inventory.includes(item.id);
}

// Cor da moldura equipada (ou da padrão) — usada em brilhos e fundos do perfil.
export function getFrameColor(frameId: string | null | undefined): string {
  return (getItem(frameId) ?? getItem(DEFAULT_FRAME_ID))!.color;
}

// ---- Raridade ----
// Derivada do preço (não é um campo à parte): mudar um preço já reclassifica
// o item sozinho.
export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_INFO: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Comum", color: "#9497A0" },
  rare: { label: "Raro", color: "#5AA9E6" },
  epic: { label: "Épico", color: "#A67CFF" },
  legendary: { label: "Lendário", color: "#FFC93C" },
};

export function getRarity(item: StoreItem): Rarity {
  if (item.price === 0) return "common";
  if (item.price <= 150) return "rare";
  if (item.price <= 400) return "epic";
  return "legendary";
}
