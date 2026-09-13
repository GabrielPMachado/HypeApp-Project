import type { Venue } from "@/types/venue";

// Dados fictícios para desenvolvimento da UI, antes da integração com o
// Firebase. Coordenadas aproximadas da região da Cidade Baixa (Porto
// Alegre), mas nomes, endereços e reviews são inventados — não
// representam parceiros reais.
//
// O hype exibido é a MÉDIA das avaliações dos últimos 30 minutos (ver
// getCurrentHypeStatus em src/utils/hype.ts), por isso os timestamps
// abaixo variam de propósito: dá pra ver o cálculo em ação —
// "Bar do Zé" tem 2 avaliações recentes concordando (fica "Lotado");
// "Espaço Beco" tem uma avaliação antiga e uma recente, e a recente
// prevalece; "Casa Amarela" só tem avaliação de mais de 30 min atrás,
// então cai no fallback "baseado na última atualização"; "Bendito Bar"
// ainda não tem nenhuma avaliação, pra testar o estado vazio.
export const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Bar do Zé",
    locationId: "cidade-baixa-poa",
    address: "Rua João Alfredo, 412 — Cidade Baixa",
    priceRange: "$$",
    openingHours: "Ter a Dom, 18h às 02h",
    latitude: -30.0407,
    longitude: -51.2247,
    hypeScore: 9.2,
    vibeTags: ["samba", "para-dancar"],
    reviews: [
      {
        id: "r1",
        authorName: "Marina T.",
        hypeLevel: "high",
        rating: { music: 5, price: 4, service: 3.5, ambiance: 4.5 },
        vibeTags: ["samba", "para-dancar"],
        comment: "Roda de samba impecável, mas chega cedo que enche rápido.",
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: "r2",
        authorName: "Diego S.",
        hypeLevel: "high",
        rating: { music: 4, price: 4, service: 3, ambiance: 4.5 },
        vibeTags: ["samba"],
        comment: "Atendimento podia ser mais rápido, mas a vibe compensa.",
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Quintal Music Bar",
    locationId: "cidade-baixa-poa",
    address: "Av. José Bonifácio, 289 — Cidade Baixa",
    priceRange: "$$",
    openingHours: "Qui a Sáb, 19h às 03h",
    latitude: -30.0398,
    longitude: -51.2231,
    hypeScore: 7.1,
    vibeTags: ["rock", "para-conversar"],
    reviews: [
      {
        id: "r3",
        authorName: "Bruno L.",
        hypeLevel: "medium",
        rating: { music: 4.5, price: 3.5, service: 4, ambiance: 3.5 },
        vibeTags: ["rock", "para-conversar"],
        comment: "Banda cover de rock muito boa, som bem equilibrado.",
        createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Espaço Beco",
    locationId: "cidade-baixa-poa",
    address: "Travessa do Carmo, 77 — Cidade Baixa",
    priceRange: "$$$",
    openingHours: "Sex e Sáb, 22h às 05h",
    latitude: -30.0415,
    longitude: -51.226,
    hypeScore: 4.5,
    vibeTags: ["eletronica"],
    reviews: [
      {
        id: "r4",
        authorName: "Carla M.",
        hypeLevel: "low",
        rating: { music: 4.5, price: 2, service: 3, ambiance: 4 },
        vibeTags: ["eletronica"],
        comment: "Line-up ótimo, mas preço da bebida pesa no bolso.",
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
      {
        id: "r4b",
        authorName: "Yuri P.",
        hypeLevel: "medium",
        rating: { music: 4, price: 2.5, service: 3, ambiance: 4 },
        vibeTags: ["eletronica"],
        comment: "Hoje tá mais tranquilo, dá pra conversar sem gritar.",
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Bendito Bar",
    locationId: "cidade-baixa-poa",
    address: "Rua da República, 550 — Cidade Baixa",
    priceRange: "$",
    openingHours: "Seg a Dom, 17h às 00h",
    latitude: -30.0389,
    longitude: -51.2219,
    hypeScore: 8.7,
    vibeTags: ["samba", "para-conversar"],
    reviews: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Casa Amarela",
    locationId: "cidade-baixa-poa",
    address: "Rua General Lima e Silva, 900 — Cidade Baixa",
    priceRange: "$$",
    openingHours: "Qua a Sáb, 18h às 02h",
    latitude: -30.042,
    longitude: -51.2273,
    hypeScore: 6.4,
    vibeTags: ["rock", "eletronica", "para-dancar"],
    reviews: [
      {
        id: "r5",
        authorName: "Felipe R.",
        hypeLevel: "medium",
        rating: { music: 4, price: 3.5, service: 3.5, ambiance: 4.5 },
        vibeTags: ["rock", "eletronica"],
        comment: "Ambiente super versátil, agrada quem quer dançar e quem quer sentar.",
        createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];
