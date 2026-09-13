import type { Rating, Review } from "@/types/venue";

const CRITERIA: (keyof Rating)[] = ["music", "price", "service", "ambiance"];

// Nota geral de um Rating = média dos critérios (música, preço,
// atendimento, ambiente). Não confundir com o hypeScore, que é a
// energia em tempo real.
export function getOverallRating(rating: Rating): number {
  const sum = CRITERIA.reduce((acc, key) => acc + rating[key], 0);
  return sum / CRITERIA.length;
}

// A avaliação de qualidade do bar é derivada da média dos reviews da
// comunidade — não é mais um valor fixo. Retorna null quando ainda não
// há nenhuma avaliação.
export function getAggregateRating(reviews: Review[]): Rating | null {
  if (reviews.length === 0) return null;

  const totals = reviews.reduce<Rating>(
    (acc, review) => ({
      music: acc.music + review.rating.music,
      price: acc.price + review.rating.price,
      service: acc.service + review.rating.service,
      ambiance: acc.ambiance + review.rating.ambiance,
    }),
    { music: 0, price: 0, service: 0, ambiance: 0 }
  );

  return {
    music: totals.music / reviews.length,
    price: totals.price / reviews.length,
    service: totals.service / reviews.length,
    ambiance: totals.ambiance / reviews.length,
  };
}
