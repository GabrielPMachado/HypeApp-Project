import { ALL_VIBE_TAGS } from "@/constants/vibeTags";
import type { Look } from "@/data/character";
import { DEFAULT_FRAME_ID } from "@/data/storeCatalog";
import type { VibeTag } from "@/types/venue";
import type { UserStats } from "@/utils/gamification";
import { parseLook } from "@/utils/look";

// Perfil de usuário (users/{uid} no Firestore). É público pra qualquer
// usuário logado — por isso não guarda dado pessoal (o e-mail fica só no
// Firebase Auth).
export interface Profile extends UserStats {
  displayName: string;
  bio: string;
  favoriteVibes: VibeTag[];
  look: Look | null; // null = ainda não montou o personagem (ver resolveLook)
  frameId: string;
  titleId: string | null; // null = mostra o título do nível
  spentCoins: number;
  inventory: string[];
  createdAt: Date | null;
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// Converte o documento cru do Firestore no Profile do app. Contas mais
// antigas não têm vários campos (bio, avatar, moedas...) — todos caem num
// valor padrão em vez de quebrar.
export function parseProfile(data: Record<string, unknown>): Profile {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;

  return {
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    bio: typeof data.bio === "string" ? data.bio : "",
    favoriteVibes: Array.isArray(data.favoriteVibes)
      ? data.favoriteVibes.filter((tag): tag is VibeTag => ALL_VIBE_TAGS.includes(tag as VibeTag))
      : [],
    look: parseLook(data.look),
    frameId: typeof data.frameId === "string" ? data.frameId : DEFAULT_FRAME_ID,
    titleId: typeof data.titleId === "string" ? data.titleId : null,
    hypeReportCount: toCount(data.hypeReportCount),
    reviewCount: toCount(data.reviewCount),
    spentCoins: toCount(data.spentCoins),
    inventory: Array.isArray(data.inventory)
      ? data.inventory.filter((id): id is string => typeof id === "string")
      : [],
    createdAt: typeof createdAt?.toDate === "function" ? createdAt.toDate() : null,
  };
}
