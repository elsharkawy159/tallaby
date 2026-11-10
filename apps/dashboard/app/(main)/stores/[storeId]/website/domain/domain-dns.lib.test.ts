import { describe, expect, it } from "vitest";
import en from "../../../../../../messages/en.json";
import ar from "../../../../../../messages/ar.json";
import { DOMAIN_PROVIDERS } from "./domain-providers.lib";
import { APEX_A_RECORD, CNAME_TARGET, MAX_TTL, MIN_TTL, RECOMMENDED_TTL, REGISTRAR_GUIDES, dnsRecords, splitDomain } from "./domain-dns.lib";

describe("TTL", () => {
  it("recommends a value every registrar accepts (60–3600)", () => {
    expect(MIN_TTL).toBe(60);
    expect(MAX_TTL).toBe(3600);
    expect(RECOMMENDED_TTL).toBeGreaterThanOrEqual(MIN_TTL);
    expect(RECOMMENDED_TTL).toBeLessThanOrEqual(MAX_TTL);
  });
});

describe("splitDomain", () => {
  it("treats a plain or country second-level domain as the root", () => {
    expect(splitDomain("faster-eg.com")).toEqual({ root: "faster-eg.com", label: null });
    expect(splitDomain("faster.com.eg")).toEqual({ root: "faster.com.eg", label: null });
    expect(splitDomain("shop.co.uk")).toEqual({ root: "shop.co.uk", label: null });
  });

  it("returns the host label of a subdomain", () => {
    expect(splitDomain("shop.faster-eg.com")).toEqual({ root: "faster-eg.com", label: "shop" });
    expect(splitDomain("shop.faster.com.eg")).toEqual({ root: "faster.com.eg", label: "shop" });
    expect(splitDomain("a.b.faster.io")).toEqual({ root: "faster.io", label: "a.b" });
  });
});

describe("dnsRecords", () => {
  it("uses @ and www for a root domain, each with the recommended TTL", () => {
    expect(dnsRecords("faster-eg.com")).toEqual([
      { type: "A", name: "@", value: APEX_A_RECORD, ttl: RECOMMENDED_TTL },
      { type: "CNAME", name: "www", value: CNAME_TARGET, ttl: RECOMMENDED_TTL },
    ]);
  });

  it("uses the subdomain label and CNAMEs for a subdomain", () => {
    expect(dnsRecords("shop.faster-eg.com").map((r) => [r.type, r.name, r.value])).toEqual([
      ["CNAME", "shop", CNAME_TARGET],
      ["CNAME", "www.shop", CNAME_TARGET],
    ]);
  });

  it("shows Vercel's TXT records by their host part", () => {
    const records = dnsRecords("shop.faster-eg.com", [{ type: "TXT", domain: "_vercel.faster-eg.com", value: "vc-domain-verify=x" }]);
    expect(records.at(-1)).toEqual({ type: "TXT", name: "_vercel", value: "vc-domain-verify=x", ttl: RECOMMENDED_TTL });
  });
});

describe("registrar guides", () => {
  it("has a guide for every suggested provider, plus Other last", () => {
    const ids = REGISTRAR_GUIDES.map((g) => g.id);
    for (const p of DOMAIN_PROVIDERS) expect(ids).toContain(p.id);
    expect(ids.at(-1)).toBe("other");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps 3–5 steps, names the menu when it uses the open step, and turns Cloudflare's proxy off", () => {
    for (const g of REGISTRAR_GUIDES) {
      expect(g.steps.length).toBeGreaterThanOrEqual(3);
      expect(g.steps.length).toBeLessThanOrEqual(5);
      if (g.steps.includes("open")) expect(g.menu).toBeTruthy();
      expect(g.steps.some((s) => s.startsWith("ttl"))).toBe(true);
    }
    expect(REGISTRAR_GUIDES.find((g) => g.id === "cloudflare")?.steps).toContain("ttlCloudflare");
  });

  it("has every step text in Arabic and English", () => {
    for (const messages of [en, ar]) {
      const steps = messages.settings.customDomain.guide.steps as Record<string, string>;
      for (const g of REGISTRAR_GUIDES) for (const s of g.steps) expect(steps[s], s).toBeTruthy();
    }
  });
});
