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
// HypeReport = avaliação "de hype": rápida, o usuário dá uma nota de
// 0 a 10 pro quão cheio/animado o local está agora (deslizador, não
// categorias fixas). É o que alimenta getCurrentHypeStatus — a média
// dessas notas na janela recente É o "hype agora" exibido no app.
//
// Review = avaliação "fixa": nota por critério (música, preço,
// atendimento, ambiente), características percebidas e comentário —
// mais estável, não expira como o hype.
export interface HypeReport {
  id: string;
  authorName: string;
  // uid de quem postou (auth.currentUser?.uid) — opcional pra não quebrar
  // dados seedados/antigos que não têm isso. Só serve pra UI decidir se
  // mostra "Você" (é o próprio autor) ou o authorName real (é de outra
  // pessoa) — ver ReviewItem.tsx.
  authorId?: string;
  score: number; // 0-10, dado pelo usuário no deslizador
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
  authorId?: string; // ver comentário em HypeReport.authorId
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
  hypeScore: number; // "Nota do Hype" inicial (seed), 0-10 — só usada quando ainda não há nenhum HypeReport; depois disso o valor exibido é a média real dos reports (ver getCurrentHypeStatus)
  vibeTags: VibeTag[]; // características "seed" do local, antes de qualquer avaliação
  logoUrl?: string; // quando ainda não há logo real, a UI cai pra um avatar com iniciais
  hypeReports: HypeReport[]; // status atual é derivado destes (ver getCurrentHypeStatus)
  reviews: Review[]; // avaliação de qualidade é derivada destes (ver getAggregateRating)
  updatedAt: string; // ISO timestamp da última atualização colaborativa
}
