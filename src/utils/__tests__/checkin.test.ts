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

describe("verifyCheckIn", () => {
  const venue = { latitude: -30.04, longitude: -51.22 };
  const position = (latitude: number, longitude: number) =>
    ({ coords: { latitude, longitude } }) as never;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.dontMock("expo-location");
  });

  function load(mock: {
    status?: string;
    lastKnown?: unknown;
    current?: () => Promise<unknown>;
  }) {
    const getCurrent = jest.fn(mock.current ?? (() => Promise.resolve(position(venue.latitude, venue.longitude))));
    jest.doMock("expo-location", () => ({
      Accuracy: { Balanced: 3 },
      requestForegroundPermissionsAsync: () => Promise.resolve({ status: mock.status ?? "granted" }),
      getLastKnownPositionAsync: () => Promise.resolve(mock.lastKnown ?? null),
      getCurrentPositionAsync: getCurrent,
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return { ...require("@/utils/checkin"), getCurrent };
  }

  it("sem permissão, falha na hora com permission-denied", async () => {
    const { verifyCheckIn } = load({ status: "denied" });
    await expect(verifyCheckIn(venue)).resolves.toEqual({ ok: false, reason: "permission-denied" });
  });

  it("usa a última posição conhecida (sem esperar o GPS) quando ela é recente e precisa", async () => {
    const { verifyCheckIn, getCurrent } = load({ lastKnown: position(venue.latitude, venue.longitude) });
    await expect(verifyCheckIn(venue)).resolves.toEqual({ ok: true });
    expect(getCurrent).not.toHaveBeenCalled();
  });

  it("última posição conhecida longe do bar -> too-far", async () => {
    const { verifyCheckIn } = load({ lastKnown: position(-30.1, -51.3) });
    await expect(verifyCheckIn(venue)).resolves.toEqual({ ok: false, reason: "too-far" });
  });

  it("sem posição conhecida, pede ao GPS e confere a distância", async () => {
    const { verifyCheckIn, getCurrent } = load({});
    await expect(verifyCheckIn(venue)).resolves.toEqual({ ok: true });
    expect(getCurrent).toHaveBeenCalledTimes(1);
  });

  it("GPS que nunca responde vira 'unavailable' depois do tempo limite, sem travar", async () => {
    const { verifyCheckIn, POSITION_TIMEOUT_MS } = load({ current: () => new Promise(() => {}) });
    const result = verifyCheckIn(venue);
    await jest.advanceTimersByTimeAsync(POSITION_TIMEOUT_MS + 100);
    await expect(result).resolves.toEqual({ ok: false, reason: "unavailable" });
  });
});
