// Catálogo da loja de cosméticos (avatar, moldura e título), pago com as
// moedas do jogo (ver calcCoins em utils/gamification.ts).
//
// ATENÇÃO: os preços e a lista de itens gratuitos TAMBÉM existem nas
// regras do Firestore (funções itemPrice/isFree) — é lá que a compra é
// validada de verdade, já que as chaves do Firebase são públicas e o app
// sozinho não segura ninguém. Mudou preço ou item aqui? Muda lá também
// (Console > Firestore > Regras), senão a compra é negada.

export type ItemKind = "avatar" | "frame" | "title";

export interface StoreItem {
  id: string;
  kind: ItemKind;
  name: string;
  price: number; // 0 = gratuito (já vem liberado pra todo mundo)
  emoji?: string; // só avatares; sem emoji o avatar mostra a inicial do nome
  color: string; // tom do fundo do avatar / cor da moldura / cor do título
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
  { id: "av-cool", kind: "avatar", name: "Curtidor", price: 0, emoji: "😎", color: "#6C8EBF" },
  { id: "av-party", kind: "avatar", name: "Festeiro", price: 0, emoji: "🥳", color: "#F0559A" },
  { id: "av-moon", kind: "avatar", name: "Notívago", price: 0, emoji: "🌙", color: "#8B6FB3" },
  // Avatares — pagos
  { id: "av-fox", kind: "avatar", name: "Raposa da Noite", price: 80, emoji: "🦊", color: "#E8813A" },
  { id: "av-owl", kind: "avatar", name: "Coruja", price: 80, emoji: "🦉", color: "#A1887F" },
  { id: "av-ghost", kind: "avatar", name: "Fantasma", price: 120, emoji: "👻", color: "#B0BEC5" },
  { id: "av-dj", kind: "avatar", name: "DJ", price: 150, emoji: "🎧", color: "#4FC3F7" },
  { id: "av-wolf", kind: "avatar", name: "Lobo", price: 150, emoji: "🐺", color: "#78909C" },
  { id: "av-alien", kind: "avatar", name: "Alien", price: 250, emoji: "👽", color: "#6BCB77" },
  { id: "av-dragon", kind: "avatar", name: "Dragão", price: 400, emoji: "🐉", color: "#E5533D" },
  { id: "av-crown", kind: "avatar", name: "Realeza", price: 600, emoji: "👑", color: "#FFD54A" },

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
