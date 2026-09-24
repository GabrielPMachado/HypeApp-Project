import { checkInFailureMessage, CHECK_IN_RADIUS_KM } from "@/utils/checkin";

describe("checkInFailureMessage", () => {
  it("tem uma mensagem própria pra cada motivo de falha", () => {
    expect(checkInFailureMessage("permission-denied")).toMatch(/localização/);
    expect(checkInFailureMessage("too-far")).toMatch(/longe/);
    expect(checkInFailureMessage("unavailable")).toMatch(/GPS/);
  });
});

describe("CHECK_IN_RADIUS_KM", () => {
  it("é um raio pequeno o suficiente pra exigir presença real (menos de 1km)", () => {
    expect(CHECK_IN_RADIUS_KM).toBeGreaterThan(0);
    expect(CHECK_IN_RADIUS_KM).toBeLessThan(1);
  });
});
