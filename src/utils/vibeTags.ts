import type { Venue, VibeTag } from "@/types/venue";

// Características exibidas = tags "seed" do local + tudo que a
// comunidade já marcou nas avaliações, sem duplicar. Assim o card nunca
// fica vazio, mas cresce com o que os usuários apontam de verdade.
export function getAggregateVibeTags(venue: Venue): VibeTag[] {
  const fromReviews = venue.reviews.flatMap((review) => review.vibeTags);
  return Array.from(new Set([...venue.vibeTags, ...fromReviews]));
}
