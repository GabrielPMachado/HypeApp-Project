import type { HypeLevel, HypeReport, Venue } from "@/types/venue";

const WINDOW_STEP_MIN = 30; // janela avança de 30 em 30 minutos

export interface HypeStatus {
  score: number; // 0-10, média dos reports na janela
  level: HypeLevel; // versão categórica de "score", só pro selo colorido
  sampleSize: number;
  windowMinutes: number; // tamanho da janela que precisou ser usada
  lastReportAt: string;
}

// Nota de hype exibida = média das notas (0-10) dadas pelos usuários no
// deslizador, na janela dos últimos 30 minutos. Se ninguém avaliou nesse
// intervalo, a janela vai dobrando de 30 em 30 min (1h, 1h30, 2h...) até
// encontrar pelo menos um report — assim o app nunca mostra "sem dado"
// enquanto existir qualquer avaliação, só deixa claro de quanto tempo
// atrás ela é.
export function getCurrentHypeStatus(reports: HypeReport[]): HypeStatus | null {
  if (reports.length === 0) return null;

  const now = Date.now();
  const ages = reports.map((r) => Math.max(0, now - new Date(r.createdAt).getTime()));
  const minAgeMinutes = Math.min(...ages) / (60 * 1000);

  const windowMinutes = Math.max(WINDOW_STEP_MIN, Math.ceil(minAgeMinutes / WINDOW_STEP_MIN) * WINDOW_STEP_MIN);
  const windowMs = windowMinutes * 60 * 1000;

  const source = reports.filter((r) => now - new Date(r.createdAt).getTime() <= windowMs);

  const score = source.reduce((sum, r) => sum + r.score, 0) / source.length;

  const lastReportAt = source.reduce(
    (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
    source[0].createdAt
  );

  return {
    score,
    level: scoreToLevel(score),
    sampleSize: source.length,
    windowMinutes,
    lastReportAt,
  };
}

// Converte a nota 0-10 numa categoria pro selo colorido (🟢🟡🔴).
export function scoreToLevel(score: number): HypeLevel {
  if (score <= 3.5) return "low";
  if (score <= 7) return "medium";
  return "high";
}

// Formata a janela usada na legenda da UI (ex: "30 min", "1h", "1h30").
export function formatHypeWindow(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}`;
}

export interface HypeDayBucket {
  dateLabel: string; // "dd/mm"
  average: number | null; // null = nenhum report naquele dia
}

// Tendência dos últimos N dias pro painel do parceiro (ver
// PartnerPanelModal.tsx) — média por dia corrido (hora local do
// aparelho), não por janela de 30min como getCurrentHypeStatus (isso
// aqui é retrospectivo, não é "agora").
export function hypeTrendByDay(reports: HypeReport[], days = 7): HypeDayBucket[] {
  const now = new Date();
  const buckets: HypeDayBucket[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

    const dayReports = reports.filter((r) => {
      const time = new Date(r.createdAt).getTime();
      return time >= day.getTime() && time < nextDay.getTime();
    });

    buckets.push({
      dateLabel: `${day.getDate()}/${day.getMonth() + 1}`,
      average:
        dayReports.length === 0
          ? null
          : dayReports.reduce((sum, r) => sum + r.score, 0) / dayReports.length,
    });
  }

  return buckets;
}

// Nota usada pra ordenar/colorir por hype em qualquer lugar do app
// (ranking da lista, círculos do mapa de calor): a média real dos
// reports quando existir, senão a nota semente — a mesma regra exibida
// no card (ver VenueCard/VenueDetailSheet), pra número e posição/cor
// nunca destoarem entre as telas.
export function rankingScore(venue: Pick<Venue, "hypeScore" | "hypeReports">): number {
  return getCurrentHypeStatus(venue.hypeReports)?.score ?? venue.hypeScore;
}
