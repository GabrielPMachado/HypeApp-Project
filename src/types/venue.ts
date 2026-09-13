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

// Cada avaliação da comunidade registra, de uma vez só: como está o local
// agora (hypeLevel), a nota por critério, as características percebidas
// (vibeTags) e um comentário — tudo feito no mesmo fluxo ("Fazer
// avaliação"). O nível de hype exibido no app é derivado da MÉDIA das
// avaliações recentes (ver getCurrentHypeStatus em src/utils/hype.ts),
// não um valor fixo.
export interface Review {
  id: string;
  authorName: string;
  hypeLevel: HypeLevel;
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
  reviews: Review[]; // hype atual e nota de qualidade são derivados destes
  updatedAt: string; // ISO timestamp da última atualização colaborativa
}
