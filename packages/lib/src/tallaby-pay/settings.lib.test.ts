import { describe, expect, it } from "vitest";

import { TALLABY_PAY_DEFAULT_SETTINGS, readTallabyPaySettings } from "./settings.lib";

describe("readTallabyPaySettings", () => {
  it("uses the owner's defaults when the row is missing: 3%, no hold, EGP 500, off", () => {
    expect(readTallabyPaySettings(undefined, false)).toEqual({
      feeBps: 300,
      holdDays: 0,
      minPayoutPiastres: 50_000,
      live: false,
    });
    expect(TALLABY_PAY_DEFAULT_SETTINGS.live).toBe(false);
  });

  it("reads the stored row and the switch", () => {
    expect(readTallabyPaySettings({ feeBps: 450, holdDays: 7, minPayout: "200.00" }, true)).toEqual({
      feeBps: 450,
      holdDays: 7,
      minPayoutPiastres: 20_000,
      live: true,
    });
  });

  it("falls back per field on a value the database checks would refuse", () => {
    expect(readTallabyPaySettings({ feeBps: 5_000, holdDays: -1, minPayout: "abc" }, false)).toEqual(
      TALLABY_PAY_DEFAULT_SETTINGS,
    );
  });
});
