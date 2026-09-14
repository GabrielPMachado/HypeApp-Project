import type { HypeReport, Rating, Review, Venue, VibeTag } from "@/types/venue";

// Bares reais (nomes, bairros e endereços verificados) usados como dados
// de desenvolvimento — mas hypeReports, reviews e coordenadas exatas são
// sintéticos, não vêm de nenhuma integração com esses estabelecimentos.
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
    locationId: "cidade-baixa-poa",
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
      hr(40, 8.2, "João N."),
      hr(3, 10, "Fernanda G."),
      hr(10, 8, "Juliana P."),
      hr(1, 0.4, "Bianca K."),
      hr(7, 5.9, "Gustavo I."),
      hr(30, 1.1, "Diego W."),
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
    locationId: "cidade-baixa-poa",
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
      hr(2, 0.6, "Renata Y."),
      hr(29, 8.3, "João G."),
      hr(31, 1.5, "William X."),
      hr(4, 8.2, "Otávio I."),
      hr(2, 9.5, "Lucas O."),
      hr(15, 3.5, "Helena O."),
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
    locationId: "cidade-baixa-poa",
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
      hr(35, 3.3, "Vanessa R."),
      hr(38, 9.2, "Lucas M."),
      hr(13, 1.3, "Zeca X."),
      hr(28, 9.6, "Thiago I."),
      hr(2, 9.9, "Vanessa Y."),
      hr(1, 4.1, "Ana F."),
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
    locationId: "cidade-baixa-poa",
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
      hr(24, 5.1, "Helena Y."),
      hr(24, 2.3, "Fernanda U."),
      hr(3, 8, "Mariana A."),
      hr(41, 5.2, "Sabrina P."),
      hr(34, 7.1, "Olívia J."),
      hr(33, 0.2, "Isabela G."),
    ],
    reviews: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-5",
    name: "Capone Drinkeria",
    locationId: "cidade-baixa-poa",
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
      hr(33, 3.6, "Felipe F."),
      hr(16, 8.5, "Thiago F."),
      hr(37, 4.2, "Thiago M."),
      hr(17, 3.8, "Fernanda H."),
      hr(43, 0, "Olívia M."),
      hr(18, 3.5, "Renata L."),
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
    locationId: "bom-fim-poa",
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
    locationId: "bom-fim-poa",
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
    locationId: "bom-fim-poa",
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
    locationId: "bom-fim-poa",
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
    locationId: "bom-fim-poa",
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
    locationId: "moinhos-poa",
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
    locationId: "moinhos-poa",
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
    locationId: "moinhos-poa",
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
    locationId: "moinhos-poa",
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
    locationId: "moinhos-poa",
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

  // ── Centro, Florianópolis ─────────────────────────────────────────
  {
    id: "fl-1",
    name: "Botequim Floripa",
    locationId: "centro-floripa",
    address: "Centro, Florianópolis",
    priceRange: "$$",
    openingHours: "Ter a Sáb, 18h às 00h",
    ...coords(-27.5954, -48.548, 0),
    hypeScore: 8.0,
    vibeTags: ["samba"],
    hypeReports: [hr(16, 8, "Vitor H.")],
    reviews: [
      rv(
        50,
        "Vitor H.",
        { music: 4.5, price: 3.5, service: 3.5, ambiance: 4 },
        ["samba"],
        "Aula de samba grátis e aquele clima de boteco antigo, show."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fl-2",
    name: "Bar do Noel",
    locationId: "centro-floripa",
    address: "Rua Tiradentes — Centro, Florianópolis",
    priceRange: "$$",
    openingHours: "Qui a Sáb, 19h às 01h",
    ...coords(-27.5954, -48.548, 1),
    hypeScore: 7.7,
    vibeTags: ["samba"],
    hypeReports: [hr(21, 6, "Juliana R.")],
    reviews: [
      rv(
        70,
        "Juliana R.",
        { music: 4, price: 3.5, service: 3.5, ambiance: 4 },
        ["samba"],
        "Roda de samba e choro que lembra os botecos cariocas de verdade."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fl-3",
    name: "La Cave Gastrobar",
    locationId: "centro-floripa",
    address: "Rua Demétrio Ribeiro, 51 — Centro, Florianópolis",
    priceRange: "$$$",
    openingHours: "Qui a Sáb, 18h às 00h",
    ...coords(-27.5954, -48.548, 2),
    hypeScore: 7.1,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(45, 5, "Marcelo T.")],
    reviews: [
      rv(
        45,
        "Marcelo T.",
        { music: 3.5, price: 2.5, service: 4.5, ambiance: 4.5 },
        ["para-conversar"],
        "Carta de vinhos excelente, música ao vivo nas sextas é um plus."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fl-4",
    name: "Bugio",
    locationId: "centro-floripa",
    address: "Rua Victor Meirelles, 112 — Centro, Florianópolis",
    priceRange: "$$",
    openingHours: "Qua a Sáb, 19h às 02h",
    ...coords(-27.5954, -48.548, 3),
    hypeScore: 7.9,
    vibeTags: ["rock"],
    hypeReports: [hr(11, 8, "Natália G.")],
    reviews: [
      rv(
        20,
        "Natália G.",
        { music: 4.5, price: 3.5, service: 3.5, ambiance: 4 },
        ["rock"],
        "Casa de shows com pegada cultural, line-up de rock sempre bom."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fl-5",
    name: "Ponto Bar & Piadina",
    locationId: "centro-floripa",
    address: "Rua Victor Meirelles, 138 — Centro, Florianópolis",
    priceRange: "$",
    openingHours: "Seg a Sáb, 17h às 00h",
    ...coords(-27.5954, -48.548, 4),
    hypeScore: 6.4,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(27, 2, "Diego F.")],
    reviews: [
      rv(
        300,
        "Diego F.",
        { music: 3, price: 4, service: 3.5, ambiance: 3.5 },
        ["para-conversar"],
        "Piadina é ótima pedida, bar de bairro sem frescura."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },

  // ── Vila Madalena, São Paulo ──────────────────────────────────────
  {
    id: "vm-1",
    name: "Cervejaria Nacional",
    locationId: "vila-madalena-sp",
    address: "Av. Pedroso de Morais, 604 — Vila Madalena",
    priceRange: "$$",
    openingHours: "Seg a Dom, 12h às 00h",
    ...coords(-23.5505, -46.691, 0),
    hypeScore: 8.2,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(13, 6, "Amanda C.")],
    reviews: [
      rv(
        100,
        "Amanda C.",
        { music: 3.5, price: 4, service: 4, ambiance: 4 },
        ["para-conversar"],
        "Cerveja de produção própria excelente, ambiente descontraído."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "vm-2",
    name: "Salve Jorge",
    locationId: "vila-madalena-sp",
    address: "Rua Aspicuelta, 544 — Vila Madalena",
    priceRange: "$$",
    openingHours: "Ter a Dom, 17h às 01h",
    ...coords(-23.5505, -46.691, 1),
    hypeScore: 8.6,
    vibeTags: ["para-dancar"],
    hypeReports: [hr(7, 9, "Rafael B.")],
    reviews: [
      rv(
        40,
        "Rafael B.",
        { music: 4, price: 3.5, service: 3.5, ambiance: 4.5 },
        ["para-dancar"],
        "Bar super badalado, sempre cheio mas vale a pena."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "vm-3",
    name: "Bar do Beco",
    locationId: "vila-madalena-sp",
    address: "Rua Aspicuelta, 567 — Vila Madalena",
    priceRange: "$$",
    openingHours: "Qua a Dom, 17h às 00h",
    ...coords(-23.5505, -46.691, 2),
    hypeScore: 8.4,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(17, 8, "Camila O.")],
    reviews: [
      rv(
        60,
        "Camila O.",
        { music: 3.5, price: 3.5, service: 3.5, ambiance: 5 },
        ["para-conversar"],
        "Quintal no Beco do Batman é lindo, paredes grafitadas incríveis."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "vm-4",
    name: "Posto 6",
    locationId: "vila-madalena-sp",
    address: "Rua Aspicuelta, 644 — Vila Madalena",
    priceRange: "$$",
    openingHours: "Seg a Dom, 11h às 01h",
    ...coords(-23.5505, -46.691, 3),
    hypeScore: 8.0,
    vibeTags: ["samba", "para-conversar"],
    hypeReports: [hr(23, 6, "Lucas M.")],
    reviews: [
      rv(
        200,
        "Lucas M.",
        { music: 4, price: 3.5, service: 3.5, ambiance: 4 },
        ["samba"],
        "Eleito melhor bar de SP mais de uma vez, clima de boteco raiz."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "vm-5",
    name: "SubAstor",
    locationId: "vila-madalena-sp",
    address: "Rua Delfina, 163 — Vila Madalena",
    priceRange: "$$$",
    openingHours: "Ter a Sáb, 19h às 01h",
    ...coords(-23.5505, -46.691, 4),
    hypeScore: 7.3,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(33, 3, "Fernanda Q.")],
    reviews: [
      rv(
        500,
        "Fernanda Q.",
        { music: 3, price: 2.5, service: 4.5, ambiance: 5 },
        ["para-conversar"],
        "Speakeasy escondido no subsolo, drinks impecáveis, clima intimista."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },

  // ── Lapa, Rio de Janeiro ──────────────────────────────────────────
  {
    id: "lp-1",
    name: "Rio Scenarium",
    locationId: "lapa-rj",
    address: "Rua do Lavradio, 20 — Lapa",
    priceRange: "$$$",
    openingHours: "Ter a Sáb, 19h às 03h",
    ...coords(-22.9133, -43.1797, 0),
    hypeScore: 9.0,
    vibeTags: ["samba", "para-dancar"],
    hypeReports: [hr(6, 9, "Bianca S.")],
    reviews: [
      rv(
        25,
        "Bianca S.",
        { music: 5, price: 3, service: 4, ambiance: 5 },
        ["samba", "para-dancar"],
        "Casarão do século 19 com samba, gafieira e chorinho, espetacular."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lp-2",
    name: "Carioca da Gema",
    locationId: "lapa-rj",
    address: "Av. Mem de Sá, 79 — Lapa",
    priceRange: "$$",
    openingHours: "Seg a Sáb, 19h às 02h",
    ...coords(-22.9133, -43.1797, 1),
    hypeScore: 8.5,
    vibeTags: ["samba"],
    hypeReports: [hr(10, 8, "Pedro A.")],
    reviews: [
      rv(
        35,
        "Pedro A.",
        { music: 4.5, price: 3.5, service: 3.5, ambiance: 4 },
        ["samba"],
        "Samba autêntico todo santo dia, referência da Lapa."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lp-3",
    name: "Semente",
    locationId: "lapa-rj",
    address: "Lapa, Rio de Janeiro",
    priceRange: "$$",
    openingHours: "Qui a Sáb, 20h às 02h",
    ...coords(-22.9133, -43.1797, 2),
    hypeScore: 8.1,
    vibeTags: ["samba"],
    hypeReports: [hr(20, 6, "Juliana P.")],
    reviews: [
      rv(
        90,
        "Juliana P.",
        { music: 4.5, price: 3.5, service: 3.5, ambiance: 4 },
        ["samba"],
        "Point histórico do choro e samba, revelou muita gente boa."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lp-4",
    name: "Bar Brasil",
    locationId: "lapa-rj",
    address: "Lapa, Rio de Janeiro",
    priceRange: "$$",
    openingHours: "Seg a Sáb, 11h às 00h",
    ...coords(-22.9133, -43.1797, 3),
    hypeScore: 7.4,
    vibeTags: ["para-conversar"],
    hypeReports: [hr(29, 5, "Otávio R.")],
    reviews: [
      rv(
        150,
        "Otávio R.",
        { music: 3.5, price: 4, service: 3.5, ambiance: 4 },
        ["para-conversar"],
        "Mais de 60 anos de história, caipirinha das melhores da Lapa."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lp-5",
    name: "Choperia Brazooka",
    locationId: "lapa-rj",
    address: "Lapa, Rio de Janeiro",
    priceRange: "$$",
    openingHours: "Qui a Sáb, 19h às 03h",
    ...coords(-22.9133, -43.1797, 4),
    hypeScore: 7.8,
    vibeTags: ["samba", "para-dancar"],
    hypeReports: [hr(31, 8, "Talita M.")],
    reviews: [
      rv(
        31,
        "Talita M.",
        { music: 4, price: 3.5, service: 3, ambiance: 4 },
        ["samba", "para-dancar"],
        "Roda de samba e sambokê animadíssimos, uma das maiores choperias da Lapa."
      ),
    ],
    updatedAt: new Date().toISOString(),
  },
];
