// Tipos base do domínio "local" (bar/casa noturna), conforme descrito no README.

export type HypeLevel = "low" | "medium" | "high"; // 🟢 Vazio | 🟡 Movimentado | 🔴 Lotado

export type VibeTag =
  | "rock"
  | "samba"
  | "eletronica"
  | "para-conversar"
  | "para-dancar";

export type PriceRange = "$" | "$$" | "$$$";

// Duas avaliações bem diferentes, de propósito separadas:
//
// HypeReport = avaliação "de hype": rápida, só o status de agora (como
// está o local neste instante). É o que alimenta getCurrentHypeStatus.
//
// Review = avaliação "fixa": nota por critério (música, preço,
// atendimento, ambiente), características percebidas e comentário —
// mais estável, não expira como o hype.
export interface HypeReport {
  id: string;
  authorName: string;
  level: HypeLevel;
  createdAt: string; // ISO timestamp
}

// Avaliação de qualidade do local. Cada critério vai de 0 a 5.
export interface Rating {
  music: number;
  price: number; // custo-benefício
  service: number;
  ambiance: number;
}

export interface Review {
  id: string;
  authorName: string;
  rating: Rating;
  vibeTags: VibeTag[];
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
  hypeScore: number; // "Nota do Hype", 0-10 — energia geral (ainda mock/fixa)
  vibeTags: VibeTag[]; // características "seed" do local, antes de qualquer avaliação
  logoUrl?: string; // quando ainda não há logo real, a UI cai pra um avatar com iniciais
  hypeReports: HypeReport[]; // status atual é derivado destes (ver getCurrentHypeStatus)
  reviews: Review[]; // avaliação de qualidade é derivada destes (ver getAggregateRating)
  updatedAt: string; // ISO timestamp da última atualização colaborativa
}
