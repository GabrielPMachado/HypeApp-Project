import type { HypeLevel, HypeReport } from "@/types/venue";

const LEVEL_TO_NUMBER: Record<HypeLevel, number> = { low: 1, medium: 2, high: 3 };
const NUMBER_TO_LEVEL: HypeLevel[] = ["low", "medium", "high"];

const WINDOW_STEP_MIN = 30; // janela avança de 30 em 30 minutos

export interface HypeStatus {
  level: HypeLevel;
  sampleSize: number;
  windowMinutes: number; // tamanho da janela que precisou ser usada
  lastReportAt: string;
}

// Nível de hype exibido = média dos reports recebidos na janela dos
// últimos 30 minutos. Se ninguém avaliou nesse intervalo, a janela vai
// dobrando de 30 em 30 min (1h, 1h30, 2h...) até encontrar pelo menos um
// report — assim o app nunca mostra "sem dado" enquanto existir
// qualquer avaliação, só deixa claro de quanto tempo atrás ela é.
export function getCurrentHypeStatus(reports: HypeReport[]): HypeStatus | null {
  if (reports.length === 0) return null;

  const now = Date.now();
  const ages = reports.map((r) => Math.max(0, now - new Date(r.createdAt).getTime()));
  const minAgeMinutes = Math.min(...ages) / (60 * 1000);

  const windowMinutes = Math.max(WINDOW_STEP_MIN, Math.ceil(minAgeMinutes / WINDOW_STEP_MIN) * WINDOW_STEP_MIN);
  const windowMs = windowMinutes * 60 * 1000;

  const source = reports.filter((r) => now - new Date(r.createdAt).getTime() <= windowMs);

  const average = source.reduce((sum, r) => sum + LEVEL_TO_NUMBER[r.level], 0) / source.length;
  const rounded = Math.min(3, Math.max(1, Math.round(average)));

  const lastReportAt = source.reduce(
    (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
    source[0].createdAt
  );

  return {
    level: NUMBER_TO_LEVEL[rounded - 1],
    sampleSize: source.length,
    windowMinutes,
    lastReportAt,
  };
}

// Formata a janela usada na legenda da UI (ex: "30 min", "1h", "1h30").
export function formatHypeWindow(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}`;
}
