import { describe, expect, it } from "vitest";
import { DOMAIN_PROVIDERS, SORTED_DOMAIN_PROVIDERS, sortDomainProviders, type DomainProvider } from "./domain-providers.lib";

describe("domain providers", () => {
  it("lists EGP providers first, then the global ones, each by rank", () => {
    expect(SORTED_DOMAIN_PROVIDERS.map((p) => p.id)).toEqual([
      "hostinger",
      "egyhosting",
      "enghosting",
      "namecheap",
      "godaddy",
      "cloudflare",
      "porkbun",
    ]);
  });

  it("never puts a non-EGP provider before an EGP one", () => {
    const firstGlobal = SORTED_DOMAIN_PROVIDERS.findIndex((p) => !p.paysInEgp);
    expect(SORTED_DOMAIN_PROVIDERS.slice(firstGlobal).every((p) => !p.paysInEgp)).toBe(true);
  });

  it("sorts any list without changing it", () => {
    const list: DomainProvider[] = [
      { id: "b", name: "B", url: "https://b.example/", paysInEgp: false, rank: 1 },
      { id: "a", name: "A", url: "https://a.example/", paysInEgp: true, rank: 2 },
      { id: "c", name: "C", url: "https://c.example/", paysInEgp: true, rank: 1 },
    ];
    expect(sortDomainProviders(list).map((p) => p.id)).toEqual(["c", "a", "b"]);
    expect(list.map((p) => p.id)).toEqual(["b", "a", "c"]);
  });

  it("keeps 6–8 providers with unique ids, https links and no tracking params", () => {
    expect(DOMAIN_PROVIDERS.length).toBeGreaterThanOrEqual(6);
    expect(DOMAIN_PROVIDERS.length).toBeLessThanOrEqual(8);
    expect(new Set(DOMAIN_PROVIDERS.map((p) => p.id)).size).toBe(DOMAIN_PROVIDERS.length);
    for (const p of DOMAIN_PROVIDERS) {
      const url = new URL(p.url);
      expect(url.protocol).toBe("https:");
      expect(url.search).toBe("");
    }
  });
});
