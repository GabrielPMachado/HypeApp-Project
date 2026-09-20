import type { HypeReport, Rating, Review, Venue, VibeTag } from "@/types/venue";

// Bares reais (nomes, bairros e endereços verificados) usados como dados
// de desenvolvimento — mas hypeReports, reviews e coordenadas exatas são
// sintéticos, não vêm de nenhuma integração com esses estabelecimentos.
//
// Bar nenhum aqui tem "bairro": só endereço e coordenadas. Os grupos
// abaixo são organização do arquivo — o app decide o que mostrar pela
// distância até a região escolhida (ver src/utils/geo.ts), então um bar
// novo só precisa de latitude/longitude, sem cadastrar bairro nenhum.
//
// Os tempos das avaliações são propositalmente variados pra exercitar
// getCurrentHypeStatus (src/utils/hype.ts): a janela de 30 min expande
// pra 1h, 1h30 etc quando não há avaliação recente o suficiente.

let hypeReportSeq = 0;
function hr(minutesAgo: number, score: number, authorName: string): HypeReport {
  hypeReportSeq += 1;
  return {
    id: `hr-${hypeReportSeq}`,
    authorName,
    score,
    createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
}

let reviewSeq = 0;
function rv(
  minutesAgo: number,
  authorName: string,
  rating: Rating,
  vibeTags: VibeTag[],
  comment: string
): Review {
  reviewSeq += 1;
  return {
    id: `rv-${reviewSeq}`,
    authorName,
    rating,
    vibeTags,
    comment,
    createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
}

// Pequeno espalhamento de coordenadas pra os pins de uma mesma região
// não caírem todos exatamente no mesmo ponto no mapa.
const SCATTER = [
  { dLat: 0, dLng: 0 },
  { dLat: 0.0015, dLng: -0.001 },
  { dLat: -0.001, dLng: 0.0018 },
  { dLat: 0.0025, dLng: 0.0008 },
  { dLat: -0.0018, dLng: -0.0022 },
];

function coords(baseLat: number, baseLng: number, index: number) {
  const { dLat, dLng } = SCATTER[index % SCATTER.length];
  return { latitude: baseLat + dLat, longitude: baseLng + dLng };
}

export const mockVenues: Venue[] = [
  // ── Cidade Baixa, Porto Alegre ────────────────────────────────────
  {
    id: "cb-1",
    name: "Boteco do Joaquim",
    address: "Rua João Alfredo, 626 — Cidade Baixa",
    priceRange: "$$",
    openingHours: "Qui a Sáb, 18h30 às 01h",
    ...coords(-30.0407, -51.2247, 0),
    hypeScore: 8.8,
    vibeTags: ["para-conversar"],
    hypeReports: [
      hr(25, 8, "Marina T."),
      hr(8, 9, "Diego S."),
      hr(7, 6.7, "Elisa O."),
      hr(2, 5, "Eduardo K."),
      hr(27, 7.6, "Carolina F."),
      hr(34, 5.9, "Igor N."),
      hr(3, 3.7, "Rodrigo Z."),
      hr(5, 1.1, "Fernanda X."),
      hr(8, 5.5, "Larissa B."),
      hr(2, 8.3, "Beatriz Y."),
      hr(96, 7.1, "Vanessa D."),
      hr(18, 8, "Isabela N."),
      hr(2, 4.9, "Tatiane Z."),
    ],
    reviews: [
      rv(
        120,
        "Marina T.",
        { music: 4, price: 4, service: 3.5, ambiance: 4.5 },
        ["para-conversar"],
        "Picado do Joaquim é imperdível, ambiente de boteco raiz."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-2",
    name: "Paralela",
    address: "Rua Lopo Gonçalves, 66 — Cidade Baixa",
    priceRange: "$$$",
    openingHours: "Ter a Sáb, 19h às 00h",
    ...coords(-30.0407, -51.2247, 1),
    hypeScore: 7.4,
    vibeTags: ["para-conversar"],
    hypeReports: [
      hr(22, 6, "Bruno L."),
      hr(32, 1.6, "Quesia E."),
      hr(17, 8.9, "Pedro K."),
      hr(21, 7.5, "Mariana V."),
      hr(12, 7.9, "Beatriz C."),
      hr(12, 8.2, "Henrique W."),
      hr(4, 1.2, "Zeca S."),
    ],
    reviews: [
      rv(
        200,
        "Bruno L.",
        { music: 4, price: 3, service: 4, ambiance: 4.5 },
        ["para-conversar"],
        "Drinks autorais tipo o Dilmãe e o Gaga valem muito a pena."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-3",
    name: "Matita Perê",
    address: "Cidade Baixa, Porto Alegre",
    priceRange: "$$",
    openingHours: "Qua a Sáb, 19h às 02h",
    ...coords(-30.0407, -51.2247, 2),
    hypeScore: 8.1,
    vibeTags: ["samba", "para-dancar"],
    hypeReports: [
      hr(40, 3, "Carla M."),
      hr(10, 6, "Yuri P."),
      hr(29, 4.7, "Pedro U."),
      hr(12, 5.6, "Gustavo J."),
      hr(22, 6.3, "Olívia K."),
      hr(35, 9.1, "Priscila H."),
      hr(87, 2, "Amanda L."),
      hr(32, 3.5, "Juliana F."),
      hr(8, 4.3, "Camila A."),
      hr(27, 2.3, "Fernanda S."),
      hr(64, 1, "Helena K."),
      hr(5, 2.3, "Renata F."),
      hr(1, 9.3, "Amanda Z."),
      hr(98, 2.6, "Nicolas I."),
      hr(9, 5.7, "Carolina J."),
    ],
    reviews: [
      rv(
        300,
        "Carla M.",
        { music: 4.5, price: 3.5, service: 3, ambiance: 4 },
        ["samba"],
        "Samba de raiz com mais de 100 rótulos de cachaça, imperdível."
      ),
      rv(
        9,
        "Yuri P.",
        { music: 4, price: 3.5, service: 3.5, ambiance: 4 },
        ["samba", "para-dancar"],
        "Hoje a roda tá mais tranquila, dá pra curtir sem multidão."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-4",
    name: "Sgt Peppers",
    address: "Cidade Baixa, Porto Alegre",
    priceRange: "$$",
    openingHours: "Sex e Sáb, 21h às 03h",
    ...coords(-30.0407, -51.2247, 3),
    hypeScore: 7.0,
    vibeTags: ["rock"],
    hypeReports: [
      hr(6, 5.6, "Rafael W."),
      hr(29, 2.1, "Quesia K."),
      hr(7, 3.5, "Vanessa P."),
      hr(1, 0.3, "Carla O."),
      hr(5, 4.2, "João B."),
      hr(108, 3.2, "Ximena J."),
      hr(39, 0.3, "Ximena F."),
    ],
    reviews: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-5",
    name: "Capone Drinkeria",
    address: "Cidade Baixa, Porto Alegre",
    priceRange: "$$$",
    openingHours: "Qui a Sáb, 19h às 01h",
    ...coords(-30.0407, -51.2247, 4),
    hypeScore: 6.8,
    vibeTags: ["para-conversar"],
    hypeReports: [
      hr(50, 5, "Felipe R."),
      hr(1, 2.8, "Henrique Q."),
      hr(11, 9.4, "Mariana I."),
      hr(3, 9.8, "Amanda D."),
      hr(7, 2.1, "Thiago G."),
      hr(2, 0.8, "Yasmin D."),
      hr(20, 1.5, "Caio Y."),
    ],
    reviews: [
      rv(
        50,
        "Felipe R.",
        { music: 3.5, price: 3, service: 4, ambiance: 4.5 },
        ["para-conversar"],
        "Coquetéis muito bem feitos, ambiente aconchegante pra happy hour."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },

  // ── Bom Fim, Porto Alegre ─────────────────────────────────────────
  {
    id: "bf-1",
    name: "Bar Ocidente",
    address: "Rua João Telles — Bom Fim",
    priceRange: "$$",
    openingHours: "Ter a Dom, 18h às 00h",
    ...coords(-30.033, -51.214, 0),
    hypeScore: 8.3,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(15, 6, "Renata K.")],
    reviews: [
      rv(
        180,
        "Renata K.",
        { music: 4, price: 3.5, service: 3.5, ambiance: 5 },
        ["para-conversar"],
        "Casarão histórico incrível, o Sarau Elétrico é imperdível."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bf-2",
    name: "Anexo 456",
    address: "Rua Fernandes Vieira, 456 — Bom Fim",
    priceRange: "$$",
    openingHours: "Qua a Sáb, 18h às 01h",
    ...coords(-30.033, -51.214, 1),
    hypeScore: 7.2,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(18, 5, "Thiago A.")],
    reviews: [
      rv(
        90,
        "Thiago A.",
        { music: 3.5, price: 4, service: 3.5, ambiance: 3.5 },
        ["para-conversar"],
        "Bom pra happy hour com os amigos, chope sempre gelado."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bf-3",
    name: "Bar João Bar e Bilhar",
    address: "Av. Osvaldo Aranha, 1026 — Bom Fim",
    priceRange: "$",
    openingHours: "Seg a Dom, 17h às 00h",
    ...coords(-30.033, -51.214, 2),
    hypeScore: 6.5,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(12, 3, "Paula S.")],
    reviews: [
      rv(
        240,
        "Paula S.",
        { music: 3, price: 4.5, service: 3.5, ambiance: 3 },
        ["para-conversar"],
        "Point tradicional pra jogar sinuca e tomar uma cerveja."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bf-4",
    name: "Vermelho 23",
    address: "Rua Bento Figueiredo, 23 — Bom Fim",
    priceRange: "$$",
    openingHours: "Qui a Sáb, 19h às 02h",
    ...coords(-30.033, -51.214, 3),
    hypeScore: 7.6,
    vibeTags: ["para-dancar"],
    hypeReports: [hr(20, 8, "Gabriel N.")],
    reviews: [
      rv(
        60,
        "Gabriel N.",
        { music: 4, price: 3.5, service: 4, ambiance: 4 },
        ["para-dancar"],
        "Pista pequena mas animada, boa seleção musical."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bf-5",
    name: "Lagom Brewery & Pub",
    address: "Bom Fim, Porto Alegre",
    priceRange: "$$",
    openingHours: "Ter a Sáb, 18h às 00h",
    ...coords(-30.033, -51.214, 4),
    hypeScore: 6.9,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(28, 5, "Camila V.")],
    reviews: [
      rv(
        120,
        "Camila V.",
        { music: 3, price: 3.5, service: 4, ambiance: 3.5 },
        ["para-conversar"],
        "Boa variedade de cerveja artesanal, ótimo pra fugir do centro."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },

  // ── Moinhos de Vento, Porto Alegre ────────────────────────────────
  {
    id: "mv-1",
    name: "Press",
    address: "Rua Hilário Ribeiro, 281 — Moinhos de Vento",
    priceRange: "$$$",
    openingHours: "Todos os dias, 12h às 23h",
    ...coords(-30.0247, -51.2064, 0),
    hypeScore: 7.8,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(14, 6, "Isabela F.")],
    reviews: [
      rv(
        150,
        "Isabela F.",
        { music: 3.5, price: 3, service: 4.5, ambiance: 4.5 },
        ["para-conversar"],
        "O Hot Gin Tônica com maracujá e tabasco é surpreendente."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mv-2",
    name: "Al Coala",
    address: "Rua Hilário Ribeiro, 287 — Moinhos de Vento",
    priceRange: "$$",
    openingHours: "Ter a Dom, 17h às 00h",
    ...coords(-30.0247, -51.2064, 1),
    hypeScore: 7.3,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(24, 6, "Rodrigo M.")],
    reviews: [
      rv(
        80,
        "Rodrigo M.",
        { music: 3.5, price: 4, service: 4, ambiance: 4 },
        ["para-conversar"],
        "Muitas torneiras de chope e hambúrguer bom pra quem não bebe."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mv-3",
    name: "Blink",
    address: "Rua Comendador Caminha, 312 — Moinhos de Vento",
    priceRange: "$$$",
    openingHours: "Seg a Qui, 18h às 01h / Sex e Sáb, 18h às 04h",
    ...coords(-30.0247, -51.2064, 2),
    hypeScore: 8.9,
    vibeTags: ["eletronica", "para-dancar"],
    hypeReports: [hr(9, 9, "Larissa D.")],
    reviews: [
      rv(
        30,
        "Larissa D.",
        { music: 4.5, price: 3, service: 4, ambiance: 5 },
        ["eletronica", "para-dancar"],
        "Decoração em neon linda, 29 drinks em torneira é diferenciado."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mv-4",
    name: "Calçada Bar",
    address: "Rua Padre Chagas, 342 — Moinhos de Vento",
    priceRange: "$$$",
    openingHours: "Qua a Sáb, 18h às 01h",
    ...coords(-30.0247, -51.2064, 3),
    hypeScore: 7.5,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(35, 6, "Eduardo P.")],
    reviews: [
      rv(
        35,
        "Eduardo P.",
        { music: 4, price: 3, service: 4, ambiance: 4.5 },
        ["para-conversar"],
        "Coquetelaria autoral muito boa, luz baixa e som na medida."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mv-5",
    name: "Caminito Bar e Café",
    address: "Rua Padre Chagas, 318 — Moinhos de Vento",
    priceRange: "$$",
    openingHours: "Seg a Sáb, 08h às 00h",
    ...coords(-30.0247, -51.2064, 4),
    hypeScore: 6.2,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(19, 2, "Beatriz L.")],
    reviews: [
      rv(
        400,
        "Beatriz L.",
        { music: 3, price: 3.5, service: 4, ambiance: 3.5 },
        ["para-conversar"],
        "Ótimo de dia pro café, à noite fica mais tranquilo."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
];
