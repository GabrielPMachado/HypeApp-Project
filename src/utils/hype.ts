import type { HypeLevel, Review } from "@/types/venue";

const LEVEL_TO_NUMBER: Record<HypeLevel, number> = { low: 1, medium: 2, high: 3 };
const NUMBER_TO_LEVEL: HypeLevel[] = ["low", "medium", "high"];

const WINDOW_MS = 30 * 60 * 1000; // janela de 30 em 30 minutos

export interface HypeStatus {
  level: HypeLevel;
  sampleSize: number;
  isRecent: boolean; // true quando baseado em avaliações dos últimos 30 min
  lastReportAt: string;
}

// Nível de hype exibido = média das avaliações recebidas nos últimos
// 30 minutos (numérico: De boas=1, Movimentado=2, Lotado=3, arredondado).
// Sem nenhuma avaliação na janela atual, cai pra média de todas as
// avaliações já recebidas, marcando isRecent=false — assim o app não
// fica "sem status" só porque ninguém atualizou nos últimos 30 min.
export function getCurrentHypeStatus(reviews: Review[]): HypeStatus | null {
  if (reviews.length === 0) return null;

  const now = Date.now();
  const recent = reviews.filter((r) => now - new Date(r.createdAt).getTime() <= WINDOW_MS);
  const source = recent.length > 0 ? recent : reviews;

  const average = source.reduce((sum, r) => sum + LEVEL_TO_NUMBER[r.hypeLevel], 0) / source.length;
  const rounded = Math.min(3, Math.max(1, Math.round(average)));

  const lastReportAt = source.reduce(
    (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
    source[0].createdAt
  );

  return {
    level: NUMBER_TO_LEVEL[rounded - 1],
    sampleSize: source.length,
    isRecent: recent.length > 0,
    lastReportAt,
  };
}
