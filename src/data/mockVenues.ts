import type { Venue } from "@/types/venue";

// Dados fictícios para desenvolvimento da UI, antes da integração com o
// Firebase. Coordenadas aproximadas da região da Cidade Baixa (Porto
// Alegre), mas os nomes dos bares são inventados — não representam
// parceiros reais.
export const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Bar do Zé",
    latitude: -30.0407,
    longitude: -51.2247,
    hypeLevel: "high",
    hypeScore: 9.2,
    vibeTags: ["samba", "para-dancar"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Quintal Music Bar",
    latitude: -30.0398,
    longitude: -51.2231,
    hypeLevel: "medium",
    hypeScore: 7.1,
    vibeTags: ["rock", "para-conversar"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Espaço Beco",
    latitude: -30.0415,
    longitude: -51.226,
    hypeLevel: "low",
    hypeScore: 4.5,
    vibeTags: ["eletronica"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Bendito Bar",
    latitude: -30.0389,
    longitude: -51.2219,
    hypeLevel: "high",
    hypeScore: 8.7,
    vibeTags: ["samba", "para-conversar"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Casa Amarela",
    latitude: -30.042,
    longitude: -51.2273,
    hypeLevel: "medium",
    hypeScore: 6.4,
    vibeTags: ["rock", "eletronica", "para-dancar"],
    updatedAt: new Date().toISOString(),
  },
];
