// Pontuação e níveis ("Especialistas da Noite", ver README). O Firestore
// guarda só os FATOS (quantos hypes/avaliações a pessoa mandou, em
// users/{uid}); pontos e nível são derivados daqui — mudar um peso ou o
// limite de um nível não exige migrar dado nenhum.
//
// ATENÇÃO: os pesos de pontos (10 e 25) também estão nas regras do
// Firestore (função purchase, cálculo do saldo de moedas) — mudou aqui,
// muda lá.

import type { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import type { Venue } from "@/types/venue";
import { getOverallRating } from "@/utils/rating";

export const HYPE_REPORT_POINTS = 10;
export const REVIEW_POINTS = 25;

export interface UserStats {
  hypeReportCount: number;
  reviewCount: number;
}

const LEVELS = [
  { title: "Novato", minPoints: 0 },
  { title: "Explorador", minPoints: 50 },
  { title: "Boêmio", minPoints: 150 },
  { title: "Especialista da Noite", minPoints: 400 },
  { title: "Lenda da Noite", minPoints: 1000 },
] as const;

export interface LevelInfo {
  level: number; // 1-based
  title: string;
  progress: number; // 0..1 dentro do nível atual (1 no nível máximo)
  pointsToNext: number | null;
  nextTitle: string | null;
}

export function calcPoints(stats: UserStats): number {
  return stats.hypeReportCount * HYPE_REPORT_POINTS + stats.reviewCount * REVIEW_POINTS;
}

// Moedas = pontos ganhos − moedas já gastas na loja. O NÍVEL vem dos
// pontos vitalícios (calcPoints), então gastar moeda nunca faz ninguém
// cair de nível.
export function calcCoins(stats: UserStats, spentCoins: number): number {
  return Math.max(0, calcPoints(stats) - spentCoins);
}

export function getLevelInfo(points: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) index = i;
  }

  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  if (!next) {
    return { level: index + 1, title: current.title, progress: 1, pointsToNext: null, nextTitle: null };
  }

  return {
    level: index + 1,
    title: current.title,
    progress: (points - current.minPoints) / (next.minPoints - current.minPoints),
    pointsToNext: next.minPoints - points,
    nextTitle: next.title,
  };
}

// ---- Conquistas ----
// Derivadas dos contadores e da atividade — não existe dado novo no
// Firestore e elas não dão moeda (a regra do Firestore não teria como
// conferir algo como "participou de 5 bares").

type FeatherName = ComponentProps<typeof Feather>["name"];

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: FeatherName;
  unlocked: boolean;
  progress: string; // ex: "3/10"
}

interface BadgeContext {
  stats: UserStats;
  visitedVenues: number;
  level: number;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: FeatherName;
  target: number;
  value: (context: BadgeContext) => number;
}

const BADGES: BadgeDefinition[] = [
  {
    id: "first-hype",
    name: "Primeiro Hype",
    description: "Mande seu primeiro Hype agora",
    icon: "zap",
    target: 1,
    value: (c) => c.stats.hypeReportCount,
  },
  {
    id: "hyped",
    name: "Hypado",
    description: "Mande 10 hypes",
    icon: "trending-up",
    target: 10,
    value: (c) => c.stats.hypeReportCount,
  },
  {
    id: "first-review",
    name: "Crítico de Plantão",
    description: "Faça sua primeira avaliação completa",
    icon: "edit-3",
    target: 1,
    value: (c) => c.stats.reviewCount,
  },
  {
    id: "reviewer",
    name: "Crítico Assíduo",
    description: "Faça 10 avaliações completas",
    icon: "star",
    target: 10,
    value: (c) => c.stats.reviewCount,
  },
  {
    id: "explorer",
    name: "Explorador",
    description: "Participe em 5 bares diferentes",
    icon: "map",
    target: 5,
    value: (c) => c.visitedVenues,
  },
  {
    id: "bohemian",
    name: "Boêmio",
    description: "Chegue ao nível 3",
    icon: "moon",
    target: 3,
    value: (c) => c.level,
  },
  {
    id: "legend",
    name: "Lenda da Noite",
    description: "Chegue ao nível 5",
    icon: "award",
    target: 5,
    value: (c) => c.level,
  },
];

export function getBadges(stats: UserStats, visitedVenues: number): Badge[] {
  const context: BadgeContext = {
    stats,
    visitedVenues,
    level: getLevelInfo(calcPoints(stats)).level,
  };

  return BADGES.map(({ value, target, ...badge }) => {
    const current = value(context);
    return {
      ...badge,
      unlocked: current >= target,
      progress: `${Math.min(current, target)}/${target}`,
    };
  });
}

// ---- Atividade ----
// Tudo que a pessoa já postou, achado no array de bares que o app já
// carrega (posts com authorId = uid) — sem leitura extra no Firestore.

export interface ActivityItem {
  id: string;
  kind: "hype" | "review";
  venueId: string;
  venueName: string;
  createdAt: string; // ISO
  value: number; // nota do hype (0-10) ou nota geral da avaliação (0-5)
}

export interface UserActivity {
  items: ActivityItem[]; // mais recente primeiro
  visitedVenueCount: number;
  favorite: { venueName: string; count: number } | null;
}

export function getUserActivity(venues: Venue[], uid: string): UserActivity {
  const items: ActivityItem[] = [];
  const countByVenue = new Map<string, { venueName: string; count: number }>();

  for (const venue of venues) {
    let count = 0;

    for (const report of venue.hypeReports) {
      if (report.authorId !== uid) continue;
      count++;
      items.push({
        id: report.id,
        kind: "hype",
        venueId: venue.id,
        venueName: venue.name,
        createdAt: report.createdAt,
        value: report.score,
      });
    }

    for (const review of venue.reviews) {
      if (review.authorId !== uid) continue;
      count++;
      items.push({
        id: review.id,
        kind: "review",
        venueId: venue.id,
        venueName: venue.name,
        createdAt: review.createdAt,
        value: getOverallRating(review.rating),
      });
    }

    if (count > 0) countByVenue.set(venue.id, { venueName: venue.name, count });
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  let favorite: UserActivity["favorite"] = null;
  for (const entry of countByVenue.values()) {
    if (!favorite || entry.count > favorite.count) favorite = entry;
  }

  return { items, visitedVenueCount: countByVenue.size, favorite };
}
