import { describe, expect, it } from "vitest";
import { countryFromServerTiming, geoServerTiming, normalizeCountry, requestCountry } from "./visitor-country.lib";

describe("normalizeCountry", () => {
  it("keeps two-letter codes in upper case and drops the rest", () => {
    expect(normalizeCountry("se")).toBe("SE");
    expect(normalizeCountry(" EG ")).toBe("EG");
    expect(normalizeCountry("SWE")).toBeNull();
    expect(normalizeCountry("")).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
  });
});

describe("requestCountry", () => {
  it("reads Vercel's header", () => {
    expect(requestCountry({ header: "IE", override: null, production: true })).toBe("IE");
    expect(requestCountry({ header: null, override: null, production: false })).toBeNull();
  });

  it("lets ?country= stand in outside production only", () => {
    expect(requestCountry({ header: "EG", override: "se", production: false })).toBe("SE");
    expect(requestCountry({ header: "EG", override: "SE", production: true })).toBe("EG");
    expect(requestCountry({ header: "EG", override: "junk", production: false })).toBe("EG");
  });
});

describe("Server-Timing geo", () => {
  it("round-trips the country through the navigation entry", () => {
    expect(geoServerTiming("SE")).toBe("geo;desc=SE");
    expect(countryFromServerTiming([{ name: "cache", description: "" }, { name: "geo", description: "SE" }])).toBe("SE");
    expect(countryFromServerTiming([{ name: "geo", description: "x" }])).toBeNull();
    expect(countryFromServerTiming([])).toBeNull();
    expect(countryFromServerTiming(undefined)).toBeNull();
  });
});
