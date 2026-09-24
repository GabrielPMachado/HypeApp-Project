import { findProximityAlerts, PROXIMITY_ALERT_RADIUS_KM } from "@/utils/proximityAlerts";
import type { Venue } from "@/types/venue";

const HERE = { latitude: -30.0407, longitude: -51.2247 };

function venue(id: string, opts: { latitude: number; longitude: number; hypeScore: number }): Venue {
  return {
    id,
    name: id,
    address: "",
    priceRange: "$",
    openingHours: "",
    latitude: opts.latitude,
    longitude: opts.longitude,
    hypeScore: opts.hypeScore,
    vibeTags: [],
    hypeReports: [],
    reviews: [],
    updatedAt: new Date().toISOString(),
  };
}

describe("findProximityAlerts", () => {
  it("inclui bar perto e lotado", () => {
    const near = venue("near", { ...HERE, hypeScore: 9 });
    const result = findProximityAlerts([near], HERE, new Set());
    expect(result.map((c) => c.venue.id)).toEqual(["near"]);
  });

  it("exclui bar longe mesmo que lotado", () => {
    const far = venue("far", { latitude: -22.9133, longitude: -43.1797, hypeScore: 9 });
    const result = findProximityAlerts([far], HERE, new Set());
    expect(result).toHaveLength(0);
  });

  it("exclui bar perto mas de boas (não lotado)", () => {
    const chill = venue("chill", { ...HERE, hypeScore: 2 });
    const result = findProximityAlerts([chill], HERE, new Set());
    expect(result).toHaveLength(0);
  });

  it("não repete um bar já avisado (cooldown decidido por quem chama)", () => {
    const near = venue("near", { ...HERE, hypeScore: 9 });
    const result = findProximityAlerts([near], HERE, new Set(["near"]));
    expect(result).toHaveLength(0);
  });

  it("o raio de alerta é pequeno (menos de 1km)", () => {
    expect(PROXIMITY_ALERT_RADIUS_KM).toBeLessThan(1);
  });
});
