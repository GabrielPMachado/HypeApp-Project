import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

// Catálogo da loja de cosméticos (avatar, moldura e título), pago com as
// moedas do jogo (ver calcCoins em utils/gamification.ts).
//
// ATENÇÃO: os preços e a lista de itens gratuitos TAMBÉM existem nas
// regras do Firestore (funções itemPrice/isFreeItem) — é lá que a compra
// é validada de verdade, já que as chaves do Firebase são públicas e o app
// sozinho não segura ninguém. Mudou preço ou item aqui? Muda lá também
// (Console > Firestore > Regras), senão a compra é negada. Os ids são o
// que vale nas regras — nome e ícone podem mudar à vontade.

export type ItemKind = "avatar" | "frame" | "title";
export type GlyphName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface StoreItem {
  id: string;
  kind: ItemKind;
  name: string;
  price: number; // 0 = gratuito (já vem liberado pra todo mundo)
  icon?: GlyphName; // só avatares; sem ícone o avatar mostra a inicial do nome
  color: string; // tom do avatar / cor da moldura / cor do título
  gradient?: readonly [string, string, ...string[]]; // só molduras degradê
}

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  avatar: "Avatares",
  frame: "Molduras",
  title: "Títulos",
};

export const DEFAULT_AVATAR_ID = "av-classic";
export const DEFAULT_FRAME_ID = "fr-amber";

export const STORE_ITEMS: StoreItem[] = [
  // Avatares — gratuitos
  { id: "av-classic", kind: "avatar", name: "Clássico", price: 0, color: "#E8B24D" },
  { id: "av-cool", kind: "avatar", name: "Curtidor", price: 0, icon: "emoticon-cool", color: "#5AA9E6" },
  { id: "av-party", kind: "avatar", name: "Festeiro", price: 0, icon: "party-popper", color: "#F0559A" },
  { id: "av-moon", kind: "avatar", name: "Notívago", price: 0, icon: "moon-waning-crescent", color: "#A67CFF" },
  // Avatares — pagos
  { id: "av-fox", kind: "avatar", name: "Gato da Noite", price: 80, icon: "cat", color: "#E8813A" },
  { id: "av-owl", kind: "avatar", name: "Coruja", price: 80, icon: "owl", color: "#C49A6C" },
  { id: "av-ghost", kind: "avatar", name: "Fantasma", price: 120, icon: "ghost", color: "#B0BEC5" },
  { id: "av-dj", kind: "avatar", name: "DJ", price: 150, icon: "headphones", color: "#4FC3F7" },
  { id: "av-wolf", kind: "avatar", name: "Morcego", price: 150, icon: "bat", color: "#B39DDB" },
  { id: "av-alien", kind: "avatar", name: "Alien", price: 250, icon: "alien", color: "#6BCB77" },
  { id: "av-dragon", kind: "avatar", name: "Unicórnio", price: 400, icon: "unicorn", color: "#FF8AD8" },
  { id: "av-crown", kind: "avatar", name: "Realeza", price: 600, icon: "crown", color: "#FFD54A" },

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
