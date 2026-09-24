import {
  calcCoins,
  calcPoints,
  getBadges,
  getLevelInfo,
  getUserActivity,
  HYPE_REPORT_POINTS,
  REVIEW_POINTS,
} from "@/utils/gamification";
import type { Venue } from "@/types/venue";

describe("calcPoints", () => {
  it("soma hype reports e avaliações com pesos diferentes", () => {
    expect(calcPoints({ hypeReportCount: 2, reviewCount: 1 })).toBe(
      2 * HYPE_REPORT_POINTS + 1 * REVIEW_POINTS
    );
  });

  it("é zero sem nenhuma atividade", () => {
    expect(calcPoints({ hypeReportCount: 0, reviewCount: 0 })).toBe(0);
  });
});

describe("calcCoins", () => {
  it("moedas = pontos ganhos - moedas gastas", () => {
    const stats = { hypeReportCount: 5, reviewCount: 0 }; // 50 pontos
    expect(calcCoins(stats, 20)).toBe(30);
  });

  it("nunca fica negativo mesmo gastando mais do que ganhou", () => {
    const stats = { hypeReportCount: 1, reviewCount: 0 }; // 10 pontos
    expect(calcCoins(stats, 999)).toBe(0);
  });
});

describe("getLevelInfo", () => {
  it("começa no nível 1 (Novato) com zero pontos", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("Novato");
    expect(info.progress).toBe(0);
  });

  it("sobe de nível exatamente no limiar de pontos", () => {
    const info = getLevelInfo(50);
    expect(info.title).toBe("Explorador");
  });

  it("calcula o progresso dentro do nível atual", () => {
    // Explorador vai de 50 a 150; 100 pontos = metade do caminho
    const info = getLevelInfo(100);
    expect(info.progress).toBeCloseTo(0.5);
    expect(info.pointsToNext).toBe(50);
    expect(info.nextTitle).toBe("Boêmio");
  });

  it("no nível máximo não há próximo nível", () => {
    const info = getLevelInfo(5000);
    expect(info.title).toBe("Lenda da Noite");
    expect(info.progress).toBe(1);
    expect(info.pointsToNext).toBeNull();
    expect(info.nextTitle).toBeNull();
  });
});

describe("getBadges", () => {
  it("libera a conquista quando o contador atinge a meta", () => {
    const badges = getBadges({ hypeReportCount: 1, reviewCount: 0 }, 0);
    const firstHype = badges.find((b) => b.id === "first-hype")!;
    expect(firstHype.unlocked).toBe(true);
    expect(firstHype.progress).toBe("1/1");

    const hyped = badges.find((b) => b.id === "hyped")!;
    expect(hyped.unlocked).toBe(false);
    expect(hyped.progress).toBe("1/10");
  });

  it("não deixa o progresso passar da meta no texto", () => {
    const badges = getBadges({ hypeReportCount: 999, reviewCount: 0 }, 0);
    const hyped = badges.find((b) => b.id === "hyped")!;
    expect(hyped.progress).toBe("10/10");
  });

  it("conquista de nível usa o nível derivado, não os pontos crus", () => {
    // 400 pontos = nível 4 (Especialista da Noite) -> ainda não é nível 5
    const badges = getBadges({ hypeReportCount: 40, reviewCount: 0 }, 0);
    const legend = badges.find((b) => b.id === "legend")!;
    expect(legend.unlocked).toBe(false);
  });
});

describe("getUserActivity", () => {
  const venue = (id: string, name: string): Venue => ({
    id,
    name,
    address: "",
    priceRange: "$",
    openingHours: "",
    latitude: 0,
    longitude: 0,
    hypeScore: 5,
    vibeTags: [],
    hypeReports: [],
    reviews: [],
    updatedAt: new Date().toISOString(),
  });

  it("só conta posts do uid pedido, mais recente primeiro", () => {
    const v1 = venue("v1", "Bar A");
    v1.hypeReports = [
      { id: "h1", authorName: "Eu", authorId: "me", score: 7, createdAt: "2026-01-01T10:00:00.000Z" },
      { id: "h2", authorName: "Outro", authorId: "outro", score: 9, createdAt: "2026-01-01T11:00:00.000Z" },
      { id: "h3", authorName: "Eu", authorId: "me", score: 8, createdAt: "2026-01-02T10:00:00.000Z" },
    ];

    const activity = getUserActivity([v1], "me");
    expect(activity.items).toHaveLength(2);
    expect(activity.items[0].id).toBe("h3"); // mais recente primeiro
    expect(activity.visitedVenueCount).toBe(1);
  });

  it("bar favorito é o que teve mais posts do usuário", () => {
    const v1 = venue("v1", "Bar A");
    const v2 = venue("v2", "Bar B");
    v1.hypeReports = [
      { id: "h1", authorName: "Eu", authorId: "me", score: 7, createdAt: "2026-01-01T10:00:00.000Z" },
      { id: "h2", authorName: "Eu", authorId: "me", score: 7, createdAt: "2026-01-01T11:00:00.000Z" },
    ];
    v2.hypeReports = [
      { id: "h3", authorName: "Eu", authorId: "me", score: 7, createdAt: "2026-01-01T12:00:00.000Z" },
    ];

    const activity = getUserActivity([v1, v2], "me");
    expect(activity.favorite).toEqual({ venueName: "Bar A", count: 2 });
    expect(activity.visitedVenueCount).toBe(2);
  });

  it("filtra por período quando 'since' é passado (ver RecapModal)", () => {
    const v1 = venue("v1", "Bar A");
    v1.hypeReports = [
      { id: "old", authorName: "Eu", authorId: "me", score: 7, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "novo", authorName: "Eu", authorId: "me", score: 7, createdAt: "2026-01-10T00:00:00.000Z" },
    ];

    const activity = getUserActivity([v1], "me", new Date("2026-01-05T00:00:00.000Z"));
    expect(activity.items).toHaveLength(1);
    expect(activity.items[0].id).toBe("novo");
  });

  it("sem nenhuma atividade não tem favorito", () => {
    const activity = getUserActivity([venue("v1", "Bar A")], "me");
    expect(activity.favorite).toBeNull();
    expect(activity.items).toHaveLength(0);
  });
});
