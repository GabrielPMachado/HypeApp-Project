import { getAggregateRating, getOverallRating } from "@/utils/rating";
import type { Review } from "@/types/venue";

describe("getOverallRating", () => {
  it("é a média dos 4 critérios", () => {
    expect(getOverallRating({ music: 4, price: 2, service: 3, ambiance: 5 })).toBe(3.5);
  });
});

describe("getAggregateRating", () => {
  it("retorna null sem nenhuma avaliação", () => {
    expect(getAggregateRating([])).toBeNull();
  });

  const review = (rating: Review["rating"]): Review => ({
    id: Math.random().toString(),
    authorName: "Teste",
    rating,
    vibeTags: [],
    comment: "",
    createdAt: new Date().toISOString(),
  });

  it("calcula a média de cada critério entre todas as avaliações", () => {
    const result = getAggregateRating([
      review({ music: 4, price: 4, service: 4, ambiance: 4 }),
      review({ music: 2, price: 2, service: 2, ambiance: 2 }),
    ]);
    expect(result).toEqual({ music: 3, price: 3, service: 3, ambiance: 3 });
  });
});
