import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARKETPLACE_PAGES, redirects } from "../redirects.mjs";
import { platformRedirects } from "../platform-redirects.mjs";

type Row = { source: string; destination: string; permanent: boolean; has?: { type: string; value: string }[] };
const rows = redirects as Row[];
const row = (source: string) => rows.find((r) => r.source === source);

describe("old marketplace pages (redirects.mjs)", () => {
  it("send /categories, /products and /wishlist, with sub-paths, to the home page of their language", () => {
    expect(MARKETPLACE_PAGES).toEqual(["categories", "products", "wishlist"]);
    for (const page of MARKETPLACE_PAGES) {
      for (const source of [`/${page}`, `/${page}/:path*`]) {
        expect(row(source), source).toMatchObject({ destination: "/", permanent: true });
        expect(row(`/en${source}`), `/en${source}`).toMatchObject({ destination: "/en", permanent: true });
      }
    }
  });

  it("only fire on tallaby.com and www, never on a store host", () => {
    for (const page of MARKETPLACE_PAGES) {
      for (const source of [`/${page}`, `/${page}/:path*`, `/en/${page}`, `/en/${page}/:path*`]) {
        const has = row(source)?.has ?? [];
        expect(has, source).toHaveLength(1);
        expect(has[0]!.type).toBe("host");
        // Next matches a `has` host value against the whole host.
        const host = new RegExp(`^${has[0]!.value}$`);
        expect(host.test("tallaby.com")).toBe(true);
        expect(host.test("www.tallaby.com")).toBe(true);
        expect(host.test("sara.tallaby.com")).toBe(false);
        expect(host.test("faster-eg.com")).toBe(false);
      }
    }
  });

  it("are not pages of this app and don't overlap the account.<root> redirects", () => {
    const site = path.resolve(__dirname, "../app/[locale]/(marketing)");
    for (const page of MARKETPLACE_PAGES) {
      expect(existsSync(path.join(site, "(site)", page)), page).toBe(false);
      expect(existsSync(path.join(site, page)), page).toBe(false);
    }
    const platform = new Set(platformRedirects("tallaby.com").map((r) => r.source));
    expect(rows.filter((r) => platform.has(r.source))).toEqual([]);
    // Each source is listed once.
    expect(new Set(rows.map((r) => r.source)).size).toBe(rows.length);
  });
});
