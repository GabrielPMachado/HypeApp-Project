import type { HypeLevel, HypeReport, Venue } from "@/types/venue";

// Ajustes do "hype agora" — mexer só aqui.
export const HYPE_HOLD_MINUTES = 30; // um report vale integralmente por esse tempo
export const HYPE_DECAY_STEP_MINUTES = 30; // depois disso, perde HYPE_DECAY_POINTS a cada passo desses
export const HYPE_DECAY_POINTS = 1;
export const HYPE_COOLDOWN_MINUTES = 30; // intervalo entre dois hypes da mesma pessoa no mesmo bar (espelha canSubmitHype nas regras do Firestore)
export const HYPE_FUTURE_TOLERANCE_MINUTES = 5; // folga pro relógio do aparelho; report "do futuro" além disso é descartado
export const HYPE_ZERO_AFTER_MINUTES = 120; // sem nenhum report por esse tempo, a nota zera de vez
export const HYPE_RESET_HOUR = 12; // o "dia de hype" vai de 12:00 a 12:00 (hora local do aparelho)

export interface HypeStatus {
  score: number; // 0-10, já com a perda por envelhecimento
  level: HypeLevel; // versão categórica de "score", só pro selo colorido
  sampleSize: number; // reports que sustentam a nota (1 quando já está perdendo valor)
  minutesSinceLastReport: number;
  pointsLost: number; // 0 enquanto o report mais recente ainda está na retenção; toda a nota se zerou
  lastReportAt: string;
}

// Início do "dia de hype" corrente: o último 12:00 local. Reports de antes
// disso não contam mais — a nota de todo bar recomeça do zero (sem status,
// caindo na nota semente, ver rankingScore) a cada meio-dia.
export function hypeDayStart(now: Date = new Date()): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), HYPE_RESET_HOUR, 0, 0, 0);
  if (start.getTime() > now.getTime()) start.setDate(start.getDate() - 1);
  return start;
}

// Nota de hype exibida:
//  - enquanto houver report nos últimos 30 min, é a média deles (o hype é
//    "mantido" nesse período);
//  - passados os 30 min sem report novo, parte da nota do último report e
//    perde 1 ponto a cada 30 min (nunca abaixo de 0), e com 2h sem nenhum
//    report a nota zera de vez. Um report novo "recarrega" o bar, e
//    reports antigos já enfraquecidos não puxam a média de um report
//    fresco pra baixo.
// Só entram reports desde o último 12:00 (ver hypeDayStart).
export function getCurrentHypeStatus(reports: HypeReport[]): HypeStatus | null {
  const now = Date.now();
  const dayStart = hypeDayStart(new Date(now)).getTime();
  // Um createdAt no futuro (data forjada por um cliente adulterado) ficaria
  // "fresco" pra sempre — descarta o que passa da folga de relógio.
  const latestAllowed = now + HYPE_FUTURE_TOLERANCE_MINUTES * 60 * 1000;
  const valid = reports.filter((r) => {
    const time = new Date(r.createdAt).getTime();
    return time >= dayStart && time <= latestAllowed;
  });
  if (valid.length === 0) return null;

  const ageMinutes = (r: HypeReport) =>
    Math.max(0, now - new Date(r.createdAt).getTime()) / (60 * 1000);
  const latest = valid.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
  const minutesSinceLastReport = Math.floor(ageMinutes(latest));

  const fresh = valid.filter((r) => ageMinutes(r) <= HYPE_HOLD_MINUTES);
  if (fresh.length > 0) {
    const score = fresh.reduce((sum, r) => sum + r.score, 0) / fresh.length;
    return {
      score,
      level: scoreToLevel(score),
      sampleSize: fresh.length,
      minutesSinceLastReport,
      pointsLost: 0,
      lastReportAt: latest.createdAt,
    };
  }

  const steps =
    Math.floor((ageMinutes(latest) - HYPE_HOLD_MINUTES) / HYPE_DECAY_STEP_MINUTES) + 1;
  const score =
    ageMinutes(latest) >= HYPE_ZERO_AFTER_MINUTES
      ? 0
      : Math.max(0, latest.score - steps * HYPE_DECAY_POINTS);
  return {
    score,
    level: scoreToLevel(score),
    sampleSize: 1,
    minutesSinceLastReport,
    pointsLost: latest.score - score,
    lastReportAt: latest.createdAt,
  };
}

// Minutos que faltam pra esta pessoa poder hypar este bar de novo (0 = já
// pode). É só um aviso antecipado na tela — quem garante o limite de verdade
// é a regra do Firestore. Só enxerga reports que guardam o authorId (os
// antigos não têm), aí a regra continua sendo a última palavra.
export function hypeCooldownRemainingMinutes(
  reports: HypeReport[],
  uid: string,
  now: number = Date.now()
): number {
  let last: number | null = null;
  for (const r of reports) {
    if (r.authorId !== uid) continue;
    const time = new Date(r.createdAt).getTime();
    if (last === null || time > last) last = time;
  }
  if (last === null) return 0;

  const remainingMs = HYPE_COOLDOWN_MINUTES * 60 * 1000 - (now - last);
  return remainingMs > 0 ? Math.min(HYPE_COOLDOWN_MINUTES, Math.ceil(remainingMs / (60 * 1000))) : 0;
}

// Converte a nota 0-10 numa categoria pro selo colorido (🟢🟡🔴).
export function scoreToLevel(score: number): HypeLevel {
  if (score <= 3.5) return "low";
  if (score <= 7) return "medium";
  return "high";
}

// Formata minutos na legenda da UI (ex: "30 min", "1h", "1h30").
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
