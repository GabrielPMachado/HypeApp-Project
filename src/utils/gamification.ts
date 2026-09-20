// Pontuação e níveis ("Especialistas da Noite", ver README). O Firestore
// guarda só os FATOS (quantos hypes/avaliações a pessoa mandou, em
// users/{uid}); pontos e nível são derivados daqui — mudar um peso ou o
// limite de um nível não exige migrar dado nenhum.

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
