import { distanceKm, venuesWithin } from "@/utils/geo";
import type { Venue } from "@/types/venue";

// Cidade Baixa e Bom Fim, Porto Alegre — usados como pontos de
// referência reais em vez de coordenadas arbitrárias, pra o teste
// documentar uma distância que faz sentido no mundo real.
const CIDADE_BAIXA = { latitude: -30.0407, longitude: -51.2247 };
const BOM_FIM = { latitude: -30.033, longitude: -51.214 };

function venueAt(id: string, latitude: number, longitude: number): Venue {
  return {
    id,
    name: id,
    address: "",
    priceRange: "$",
    openingHours: "",
    latitude,
    longitude,
    hypeScore: 5,
    vibeTags: [],
    hypeReports: [],
    reviews: [],
    updatedAt: new Date().toISOString(),
  };
}

describe("distanceKm", () => {
  it("é zero entre o mesmo ponto", () => {
    expect(distanceKm(CIDADE_BAIXA, CIDADE_BAIXA)).toBe(0);
  });

  it("calcula uma distância plausível entre dois bairros próximos de Porto Alegre", () => {
    const km = distanceKm(CIDADE_BAIXA, BOM_FIM);
    // Cidade Baixa <-> Bom Fim é pertinho (bairros vizinhos) — só valida
    // ordem de grandeza (não quilômetros de sobra nem exatamente zero).
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(3);
  });
});

describe("venuesWithin", () => {
  const venues = [venueAt("perto", CIDADE_BAIXA.latitude, CIDADE_BAIXA.longitude), venueAt("longe", -22.9133, -43.1797)];

  it("inclui bares dentro do raio e exclui os de fora", () => {
    const result = venuesWithin(venues, { ...CIDADE_BAIXA, radiusKm: 5 });
    expect(result.map((v) => v.id)).toEqual(["perto"]);
  });

  it("um raio grande o suficiente inclui todos", () => {
    const result = venuesWithin(venues, { ...CIDADE_BAIXA, radiusKm: 5000 });
    expect(result).toHaveLength(2);
  });

  it("bar com coordenada inválida (NaN) some da lista em vez de quebrar", () => {
    const broken = venueAt("quebrado", NaN, NaN);
    const result = venuesWithin([...venues, broken], { ...CIDADE_BAIXA, radiusKm: 5000 });
    expect(result.find((v) => v.id === "quebrado")).toBeUndefined();
  });
});
