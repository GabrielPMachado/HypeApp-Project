import {
  formatHypeWindow,
  getCurrentHypeStatus,
  hypeDayStart,
  hypeTrendByDay,
  rankingScore,
  scoreToLevel,
} from "@/utils/hype";
import type { HypeReport } from "@/types/venue";

// Hora local (não UTC) e à noite: os testes de "minutos atrás" ficam sempre
// depois do último 12:00, em qualquer fuso da máquina.
const NOW = new Date(2026, 0, 2, 20, 0, 0, 0);

function report(minutesAgo: number, score: number): HypeReport {
  return {
    id: `hr-${minutesAgo}-${score}`,
    authorName: "Teste",
    score,
    createdAt: new Date(NOW.getTime() - minutesAgo * 60 * 1000).toISOString(),
  };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("getCurrentHypeStatus", () => {
  it("retorna null sem nenhum report", () => {
    expect(getCurrentHypeStatus([])).toBeNull();
  });

  it("mantém a média dos reports dos últimos 30min, sem perder valor", () => {
    const status = getCurrentHypeStatus([report(10, 8), report(20, 6)]);
    expect(status).not.toBeNull();
    expect(status!.score).toBe(7);
    expect(status!.sampleSize).toBe(2);
    expect(status!.pointsLost).toBe(0);
  });

  it("um report de exatamente 30min ainda vale integralmente", () => {
    const status = getCurrentHypeStatus([report(30, 6)]);
    expect(status!.score).toBe(6);
    expect(status!.pointsLost).toBe(0);
  });

  it.each([
    [31, 8, 7],
    [59, 8, 7],
    [61, 8, 6],
    [91, 8, 5],
  ])("report de %smin com nota %s vira %s (perde 1 ponto a cada 30min)", (minutes, score, expected) => {
    const status = getCurrentHypeStatus([report(minutes, score)]);
    expect(status!.score).toBe(expected);
    expect(status!.pointsLost).toBe(score - expected);
    expect(status!.minutesSinceLastReport).toBe(minutes);
  });

  it("nunca fica abaixo de 0", () => {
    const status = getCurrentHypeStatus([report(300, 5)]);
    expect(status!.score).toBe(0);
    expect(status!.level).toBe("low");
  });

  it("reports antigos já fora da retenção não puxam a média de um report novo", () => {
    const status = getCurrentHypeStatus([report(10, 10), report(200, 0)]);
    expect(status!.sampleSize).toBe(1);
    expect(status!.score).toBe(10);
  });

  it("parte da nota do report mais recente quando nenhum está na retenção", () => {
    const status = getCurrentHypeStatus([report(45, 4), report(100, 9)]);
    expect(status!.score).toBe(3);
  });

  it("classifica o nível a partir da média calculada, não da nota semente", () => {
    const status = getCurrentHypeStatus([report(5, 9)]);
    expect(status!.level).toBe("high");
  });
});

describe("reinício diário às 12:00", () => {
  const at = (hour: number, minute: number, dayOffset = 0) =>
    new Date(2026, 0, 2 + dayOffset, hour, minute, 0, 0);
  const reportAt = (date: Date, score: number): HypeReport => ({
    id: `hr-${date.getTime()}`,
    authorName: "Teste",
    score,
    createdAt: date.toISOString(),
  });

  it.each([
    [at(11, 59), at(12, 0, -1)],
    [at(12, 0), at(12, 0)],
    [at(12, 1), at(12, 0)],
    [at(23, 30), at(12, 0)],
    [at(0, 5), at(12, 0, -1)],
  ])("hypeDayStart de %s é %s", (now, expected) => {
    expect(hypeDayStart(now).getTime()).toBe(expected.getTime());
  });

  it("antes das 12:00 ainda vale o que foi enviado desde o meio-dia de ontem", () => {
    jest.setSystemTime(at(11, 0));
    const status = getCurrentHypeStatus([reportAt(at(23, 0, -1), 9)]);
    expect(status).not.toBeNull();
    expect(status!.score).toBe(0);
  });

  it("às 12:00 os reports da noite anterior deixam de contar", () => {
    jest.setSystemTime(at(12, 0));
    expect(getCurrentHypeStatus([reportAt(at(23, 0, -1), 9)])).toBeNull();
    expect(getCurrentHypeStatus([reportAt(at(11, 59), 9)])).toBeNull();
  });

  it("report enviado depois do meio-dia conta normalmente", () => {
    jest.setSystemTime(at(12, 30));
    const status = getCurrentHypeStatus([reportAt(at(12, 10), 7), reportAt(at(23, 0, -1), 9)]);
    expect(status!.score).toBe(7);
    expect(status!.sampleSize).toBe(1);
  });

  it("depois do reinício o ranking volta pra nota semente", () => {
    jest.setSystemTime(at(12, 5));
    expect(rankingScore({ hypeScore: 6.5, hypeReports: [reportAt(at(23, 0, -1), 9)] })).toBe(6.5);
  });
});

describe("scoreToLevel", () => {
  it.each([
    [0, "low"],
    [3.5, "low"],
    [3.6, "medium"],
    [7, "medium"],
    [7.1, "high"],
    [10, "high"],
  ] as const)("score %s -> %s", (score, level) => {
    expect(scoreToLevel(score)).toBe(level);
  });
});

describe("formatHypeWindow", () => {
  it.each([
    [30, "30 min"],
    [59, "59 min"],
    [60, "1h"],
    [90, "1h30"],
    [120, "2h"],
  ])("%s minutos -> %s", (minutes, expected) => {
    expect(formatHypeWindow(minutes)).toBe(expected);
  });
});

describe("hypeTrendByDay", () => {
  it("retorna um balde por dia pedido, vazio (null) sem report nenhum", () => {
    const buckets = hypeTrendByDay([], 7);
    expect(buckets).toHaveLength(7);
    expect(buckets.every((b) => b.average === null)).toBe(true);
  });

  it("agrupa reports de hoje no último balde (o mais recente)", () => {
    const buckets = hypeTrendByDay([report(0, 8)], 3);
    expect(buckets[2].average).toBe(8);
    expect(buckets[0].average).toBeNull();
    expect(buckets[1].average).toBeNull();
  });

  it("tira a média quando há mais de um report no mesmo dia", () => {
    const buckets = hypeTrendByDay([report(0, 4), report(1, 8)], 1);
    expect(buckets[0].average).toBe(6);
  });
});

describe("rankingScore", () => {
  it("usa a nota semente quando não há nenhum report", () => {
    expect(rankingScore({ hypeScore: 6.5, hypeReports: [] })).toBe(6.5);
  });

  it("usa a média real assim que existe pelo menos um report", () => {
    expect(rankingScore({ hypeScore: 6.5, hypeReports: [report(5, 9)] })).toBe(9);
  });
});
