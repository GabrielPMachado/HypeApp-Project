// Paleta "dark premium / nightlife". Escala neutra com um único acento
// (âmbar) usado com moderação — evita a estética "app de brinquedo" de
// cores primárias saturadas espalhadas pela UI.
export const colors = {
  background: "#0A0A0D",
  surface: "#151519",
  surfaceRaised: "#1C1C22",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.16)",
  // Cores dedicadas ao card da lista — âmbar na borda (contraste de cor,
  // não só de luminância) contra um fundo bem mais claro que o da tela.
  cardBorder: "rgba(232, 178, 77, 0.6)",
  cardSurface: "#2E2E3A",

  text: "#F2F2F4",
  textMuted: "#9497A0",
  textFaint: "#5C5F68",

  accent: "#E8B24D", // âmbar — usado só em ênfase (destaque, seleção, dados)
  accentMuted: "rgba(232, 178, 77, 0.16)",

  // Nível de "hype" (ocupação/energia do local). Tons dessaturados,
  // não são as cores de semáforo "cartoon" puras.
  hypeLow: "#4E9E77",
  hypeMedium: "#C79A3E",
  hypeHigh: "#C1584B",

  hypeLowMuted: "rgba(78, 158, 119, 0.16)",
  hypeMediumMuted: "rgba(199, 154, 62, 0.16)",
  hypeHighMuted: "rgba(193, 88, 75, 0.16)",
} as const;
