import { describe, expect, it } from "vitest";
import { checkOrderCountry, parseStoreOrderCountries, storeSellingCountries } from "./order-countries.lib";

describe("parseStoreOrderCountries", () => {
  it("is off by default and on only for a real true", () => {
    expect(parseStoreOrderCountries(null)).toEqual({ enabled: false });
    expect(parseStoreOrderCountries({})).toEqual({ enabled: false });
    expect(parseStoreOrderCountries({ orderCountries: [] })).toEqual({ enabled: false });
    expect(parseStoreOrderCountries({ orderCountries: { enabled: "yes" } })).toEqual({ enabled: false });
    expect(parseStoreOrderCountries({ orderCountries: { enabled: true } })).toEqual({ enabled: true });
  });
});

describe("storeSellingCountries", () => {
  it("takes the country of each enabled zone's places", () => {
    expect(
      storeSellingCountries([
        { places: ["EG/CAIRO", "EG/GIZA/dokki"] },
        { places: ["SA", "sa/RIYADH"] },
        { places: ["AE"], enabled: false },
        { places: ["bad-key", ""] },
      ]),
    ).toEqual(["EG", "SA"]);
  });

  it("falls back to Egypt with no zones", () => {
    expect(storeSellingCountries([])).toEqual(["EG"]);
    expect(storeSellingCountries([{ places: null }])).toEqual(["EG"]);
  });
});

describe("checkOrderCountry", () => {
  const on = { enabled: true };
  it("allows everything while off", () => {
    expect(checkOrderCountry({ enabled: false }, "US", ["EG"])).toEqual({ ok: true });
  });
  it("allows a known country in the list and an unknown country", () => {
    expect(checkOrderCountry(on, "eg", ["EG"])).toEqual({ ok: true });
    expect(checkOrderCountry(on, null, ["EG"])).toEqual({ ok: true });
    expect(checkOrderCountry(on, "XX1", ["EG"])).toEqual({ ok: true });
  });
  it("refuses a known country outside the list", () => {
    expect(checkOrderCountry(on, "US", ["EG", "SA"])).toEqual({ ok: false, visitorCountry: "US" });
  });
});
