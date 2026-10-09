import { DEFAULT_LOOK, LOOK_SLOTS, type Look } from "@/data/character";
import { getItem, isLookSlot, itemsOfKind, type StoreItem } from "@/data/storeCatalog";

// Lê o campo "look" (mapa com as peças equipadas) de um documento cru do
// Firestore. Devolve null quando a pessoa nunca montou um personagem; peça
// desconhecida (removida do catálogo, dado antigo) cai na padrão daquele
// espaço em vez de quebrar a tela.
export function parseLook(value: unknown): Look | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const look = { ...DEFAULT_LOOK };
  for (const slot of LOOK_SLOTS) {
    const id = raw[slot];
    if (typeof id === "string" && getItem(id)?.kind === slot) look[slot] = id;
  }
  return look;
}

// Peças que ficam de fora do sorteio automático: ainda dá pra escolher, mas ninguém
// deve nascer careca só porque o nome caiu nessa.
const NOT_SEEDED = ["hs-bald"];

function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  return hash;
}

// Personagem inicial de quem ainda não montou o seu: sorteado a partir do
// nome (sempre o mesmo pra mesma pessoa), só com peças gratuitas, pra a lista
// de gente não ficar cheia de bonecos idênticos.
export function seededLook(seed: string): Look {
  const hash = hashSeed(seed);
  const pick = (slot: Look extends Record<infer K, string> ? K : never, shift: number): string => {
    const free = itemsOfKind(slot).filter((item) => item.price === 0 && !NOT_SEEDED.includes(item.id));
    return free[(hash >>> shift) % free.length].id;
  };

  return {
    skin: pick("skin", 0),
    eyes: pick("eyes", 15),
    hair: pick("hair", 3),
    hairColor: pick("hairColor", 6),
    top: pick("top", 9),
    bottom: pick("bottom", 18),
    shoes: pick("shoes", 21),
    accessory: DEFAULT_LOOK.accessory,
    mood: pick("mood", 12),
  };
}

export function resolveLook(look: Look | null | undefined, seed: string): Look {
  return look ?? seededLook(seed);
}

// O personagem com esta peça vestida (moldura e título não mudam o personagem).
export function withPart(look: Look, item: StoreItem): Look {
  return isLookSlot(item.kind) ? { ...look, [item.kind]: item.id } : look;
}

export function lookEquals(a: Look, b: Look): boolean {
  return LOOK_SLOTS.every((slot) => a[slot] === b[slot]);
}
