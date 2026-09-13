// Tipos base do domínio "local" (bar/casa noturna), conforme descrito no README.

export type HypeLevel = "low" | "medium" | "high"; // 🟢 Vazio | 🟡 Movimentado | 🔴 Lotado

export type VibeTag =
  | "rock"
  | "samba"
  | "eletronica"
  | "para-conversar"
  | "para-dancar";

export type PriceRange = "$" | "$$" | "$$$";

// Avaliação de qualidade do local (independente do "hype" em tempo real).
// Cada critério vai de 0 a 5. O card na lista mostra só o hype; o
// breakdown completo fica na tela de detalhes.
export interface Rating {
  music: number;
  price: number; // custo-benefício
  service: number;
  ambiance: number;
}

export interface Review {
  id: string;
  authorName: string;
  rating: Rating; // nota por critério (música, preço, atendimento, ambiente)
  comment: string;
  createdAt: string; // ISO timestamp
}

export interface Venue {
  id: string;
  name: string;
  locationId: string; // referencia CityLocation (src/data/locations.ts)
  address: string;
  priceRange: PriceRange;
  openingHours: string;
  latitude: number;
  longitude: number;
  hypeLevel: HypeLevel;
  hypeScore: number; // "Nota do Hype", 0-10 — energia atual, em tempo real
  vibeTags: VibeTag[];
  reviews: Review[]; // a avaliação de qualidade é derivada destes (ver getAggregateRating)
  updatedAt: string; // ISO timestamp da última atualização colaborativa
}
