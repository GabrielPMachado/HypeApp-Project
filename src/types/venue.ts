// Tipos base do domínio "local" (bar/casa noturna), conforme descrito no README.

export type HypeLevel = "low" | "medium" | "high"; // 🟢 Vazio | 🟡 Movimentado | 🔴 Lotado

export type VibeTag =
  | "rock"
  | "samba"
  | "eletronica"
  | "para-conversar"
  | "para-dancar";

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hypeLevel: HypeLevel;
  hypeScore: number; // "Nota do Hype", 0-10
  vibeTags: VibeTag[];
  updatedAt: string; // ISO timestamp da última atualização colaborativa
}
