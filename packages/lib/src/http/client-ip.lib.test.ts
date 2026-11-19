import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientCountry, getClientIp } from "./client-ip.lib";

const h = (init: Record<string, string>) => new Headers(init);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getClientIp", () => {
  it("takes the first x-forwarded-for entry, trimmed", () => {
    expect(getClientIp(h({ "x-forwarded-for": " 41.1.2.3 , 10.0.0.1, 10.0.0.2" }))).toBe("41.1.2.3");
  });

  it("falls back to x-real-ip, then null", () => {
    expect(getClientIp(h({ "x-real-ip": "41.9.9.9" }))).toBe("41.9.9.9");
    expect(getClientIp(h({ "x-forwarded-for": " , 10.0.0.1", "x-real-ip": "41.9.9.9" }))).toBe("41.9.9.9");
    expect(getClientIp(h({}))).toBeNull();
    expect(getClientIp(h({ "x-forwarded-for": "", "x-real-ip": "" }))).toBeNull();
  });

  it("ignores CF-Connecting-IP unless TRUST_CLOUDFLARE_HEADERS=1", () => {
    const headers = h({ "cf-connecting-ip": "6.6.6.6", "x-forwarded-for": "41.1.2.3" });
    expect(getClientIp(headers)).toBe("41.1.2.3");
    vi.stubEnv("TRUST_CLOUDFLARE_HEADERS", "true");
    expect(getClientIp(headers)).toBe("41.1.2.3");
    expect(getClientIp(h({ "cf-connecting-ip": "6.6.6.6" }))).toBeNull();
  });

  it("uses CF-Connecting-IP when trusted, else the usual headers", () => {
    vi.stubEnv("TRUST_CLOUDFLARE_HEADERS", "1");
    expect(getClientIp(h({ "cf-connecting-ip": " 41.5.5.5 ", "x-forwarded-for": "6.6.6.6" }))).toBe("41.5.5.5");
    expect(getClientIp(h({ "x-forwarded-for": "41.1.2.3, 10.0.0.1" }))).toBe("41.1.2.3");
    expect(getClientIp(h({ "cf-connecting-ip": " ", "x-real-ip": "41.9.9.9" }))).toBe("41.9.9.9");
  });
});

describe("getClientCountry", () => {
  it("reads x-vercel-ip-country, upper-cased, or null", () => {
    expect(getClientCountry(h({ "x-vercel-ip-country": "eg" }))).toBe("EG");
    expect(getClientCountry(h({ "x-vercel-ip-country": "EGY" }))).toBeNull();
    expect(getClientCountry(h({}))).toBeNull();
  });

  it("ignores CF-IPCountry unless TRUST_CLOUDFLARE_HEADERS=1", () => {
    expect(getClientCountry(h({ "cf-ipcountry": "SE", "x-vercel-ip-country": "EG" }))).toBe("EG");
    expect(getClientCountry(h({ "cf-ipcountry": "SE" }))).toBeNull();
  });

  it("uses CF-IPCountry when trusted, with XX and T1 as null", () => {
    vi.stubEnv("TRUST_CLOUDFLARE_HEADERS", "1");
    expect(getClientCountry(h({ "cf-ipcountry": "se", "x-vercel-ip-country": "EG" }))).toBe("SE");
    expect(getClientCountry(h({ "cf-ipcountry": "XX", "x-vercel-ip-country": "EG" }))).toBeNull();
    expect(getClientCountry(h({ "cf-ipcountry": "T1" }))).toBeNull();
    expect(getClientCountry(h({ "cf-ipcountry": "bad" }))).toBeNull();
    // No Cloudflare header at all: the usual header.
    expect(getClientCountry(h({ "x-vercel-ip-country": "EG" }))).toBe("EG");
  });
});
