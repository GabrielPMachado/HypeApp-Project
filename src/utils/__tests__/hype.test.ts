import { formatHypeWindow, getCurrentHypeStatus, rankingScore, scoreToLevel } from "@/utils/hype";
import type { HypeReport } from "@/types/venue";

const NOW = new Date("2026-01-01T22:00:00.000Z");

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

  it("usa a janela padrão de 30min quando há report recente o suficiente", () => {
    const status = getCurrentHypeStatus([report(10, 8), report(20, 6)]);
    expect(status).not.toBeNull();
    expect(status!.windowMinutes).toBe(30);
    expect(status!.score).toBe(7);
    expect(status!.sampleSize).toBe(2);
  });

  it("expande a janela de 30 em 30min até achar algum report", () => {
    // nenhum report nos últimos 30min, mas há um há 45min -> precisa de 1h
    const status = getCurrentHypeStatus([report(45, 4)]);
    expect(status!.windowMinutes).toBe(60);
    expect(status!.score).toBe(4);
  });

  it("ignora reports fora da janela escolhida", () => {
    const status = getCurrentHypeStatus([report(10, 10), report(200, 0)]);
    expect(status!.sampleSize).toBe(1);
    expect(status!.score).toBe(10);
  });

  it("classifica o nível a partir da média calculada, não da nota semente", () => {
    const status = getCurrentHypeStatus([report(5, 9)]);
    expect(status!.level).toBe("high");
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

describe("rankingScore", () => {
  it("usa a nota semente quando não há nenhum report", () => {
    expect(rankingScore({ hypeScore: 6.5, hypeReports: [] })).toBe(6.5);
  });

  it("usa a média real assim que existe pelo menos um report", () => {
    expect(rankingScore({ hypeScore: 6.5, hypeReports: [report(5, 9)] })).toBe(9);
  });
});
