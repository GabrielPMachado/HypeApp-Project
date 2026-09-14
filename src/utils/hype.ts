import type { HypeLevel, HypeReport } from "@/types/venue";

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
