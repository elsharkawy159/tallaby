import { readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { legacyProductsTarget } from "@/lib/products/product-routes.lib";
import {
  isStorelessStorePath,
  STORE_SECTIONS,
  STORE_SETTINGS_PAGES,
  storelessTarget,
  toStorelessPath,
} from "./storeless-routes.lib";

const ID = "22222222-2222-4222-8222-222222222222";
const S = `/stores/${ID}`;
const segs = (p: string) => p.split("/").filter(Boolean);

const MAIN = path.resolve(__dirname, "../../app/[locale]/(main)");
const STORE_DIR = path.join(MAIN, "stores/[storeId]");

/** Every page under stores/[storeId], as a URL tail with sample values for dynamic segments. */
function storePageRoutes(dir = STORE_DIR, prefix = ""): string[] {
  const out: string[] = [];
  if (prefix && existsSync(path.join(dir, "page.tsx"))) out.push(prefix);
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory() || name.startsWith("_") || name.startsWith("[[...")) continue;
    const segment = name.startsWith("[") ? `sample-${name.replace(/\W/g, "")}` : name;
    out.push(...storePageRoutes(full, `${prefix}/${segment}`));
  }
  return out;
}

describe("route constants match the file tree", () => {
  it("STORE_SECTIONS lists every store section folder", () => {
    const folders = readdirSync(STORE_DIR).filter(
      (n) => statSync(path.join(STORE_DIR, n)).isDirectory() && !n.startsWith("[") && !n.startsWith("_"),
    );
    expect([...STORE_SECTIONS].sort()).toEqual(folders.sort());
  });

  it("STORE_SETTINGS_PAGES lists every store settings sub-page", () => {
    const dir = path.join(STORE_DIR, "settings");
    const pages = readdirSync(dir).filter((n) => existsSync(path.join(dir, n, "page.tsx")));
    expect([...STORE_SETTINGS_PAGES].sort()).toEqual(pages.sort());
  });

  it("no store settings page name is also an account settings page", () => {
    const account = readdirSync(path.join(MAIN, "settings")).filter((n) => existsSync(path.join(MAIN, "settings", n, "page.tsx")));
    expect(account.length).toBeGreaterThan(0);
    for (const name of account) expect(STORE_SETTINGS_PAGES as readonly string[]).not.toContain(name);
  });
});

describe("storelessTarget", () => {
  it.each([
    ["/website", `${S}/website`],
    ["/website/design", `${S}/website/design`],
    ["/website/blog/abc", `${S}/website/blog/abc`],
    ["/analytics", `${S}/analytics`],
    ["/apps", `${S}/apps`],
    ["/apps/size_chart/settings", `${S}/apps/size_chart/settings`],
    ["/catalog", `${S}/catalog`],
    ["/earnings", `${S}/earnings`],
    ["/settings/payments", `${S}/settings/payments`],
    ["/settings/sales-popup", `${S}/settings/sales-popup`],
    ["/settings/app", `${S}/settings/app`],
    ["/stores/website", `${S}/website`],
    ["/stores/settings", `${S}/settings`],
    ["/stores/settings/payments", `${S}/settings/payments`],
    ["/stores/shipping", `${S}/shipping`],
    ["/stores/welcome", `${S}/welcome`],
    ["/stores/products/add", `${S}/products/add`],
  ])("%s → %s", (from, to) => {
    expect(storelessTarget(segs(from), ID, {})).toBe(to);
    expect(isStorelessStorePath(segs(from))).toBe(true);
  });

  it("keeps the query string, repeated keys included", () => {
    expect(storelessTarget(["settings", "payments"], ID, { tab: "cod", x: ["1", "2"] })).toBe(
      `${S}/settings/payments?tab=cod&x=1&x=2`,
    );
    expect(storelessTarget(["website", "forms"], ID, { q: "a b&c" })).toBe(`${S}/website/forms?q=a+b%26c`);
  });

  it.each([
    [[]],
    [["settings"]],
    [["settings", "plan"]],
    [["settings", "fulfillment"]],
    [["settings", "unknown"]],
    [["orders"]],
    [["wallet"]],
    [["stores"]],
    [["stores", ID]],
    [["stores", ID, "website"]],
    [["stores", "unknown"]],
    [["products"]],
    [["welcome"]],
    [["shipping"]],
    [["Website"]],
    [["foo", "bar"]],
  ])("%j is not a store link", (path) => {
    expect(storelessTarget(path, ID, {})).toBeNull();
    expect(isStorelessStorePath(path)).toBe(false);
  });

  it("never builds an open redirect or climbs out of the store", () => {
    expect(storelessTarget(["website", ".."], ID)).toBeNull();
    expect(storelessTarget(["website", ".", "x"], ID)).toBeNull();
    expect(storelessTarget(["website", ""], ID)).toBeNull();
    expect(storelessTarget(["stores", "settings", "..", ".."], ID)).toBeNull();
    expect(storelessTarget(["", "evil.com"], ID)).toBeNull();
    expect(storelessTarget(["//evil.com"], ID)).toBeNull();
    // Decoded slashes and backslashes stay inside one encoded segment.
    expect(storelessTarget(["website", "/evil.com"], ID)).toBe(`${S}/website/%2Fevil.com`);
    expect(storelessTarget(["website", "a/../../b"], ID)).toBe(`${S}/website/a%2F..%2F..%2Fb`);
    expect(storelessTarget(["website", "\\evil.com"], ID)).toBe(`${S}/website/%5Cevil.com`);
    expect(storelessTarget(["website"], "")).toBeNull();
    expect(storelessTarget(["website"], "a/b")).toBe("/stores/a%2Fb/website");
    for (const p of [["website", "x"], ["settings", "payments"], ["stores", "shipping"]]) {
      expect(storelessTarget(p, ID, { next: "//evil.com" })).toMatch(/^\/stores\/[^/]/);
    }
  });
});

describe("toStorelessPath", () => {
  it.each([
    [`${S}/settings/payments`, "/settings/payments"],
    [`/en${S}/settings/payments`, "/settings/payments"],
    [`/ar${S}/website`, "/website"],
    [`${S}/website`, "/website"],
    [`${S}/website/domain/seo`, "/website/domain/seo"],
    [`${S}/analytics?range=7d`, "/analytics?range=7d"],
    [`${S}/apps/size_chart`, "/apps/size_chart"],
    [`${S}/products`, "/products"],
    [`${S}/products/inventory?low=1`, "/products/inventory?low=1"],
    [`${S}/welcome`, "/welcome"],
    [`${S}/shipping`, "/stores/shipping"],
    [`${S}/settings`, "/stores/settings"],
    [`${S}/settings/`, "/stores/settings"],
    [S, "/stores"],
    [`${S}/`, "/stores"],
  ])("%s → %s", (from, to) => {
    expect(toStorelessPath(from)).toBe(to);
  });

  it.each([
    "/orders",
    "/settings",
    "/settings/plan",
    "/stores",
    "/stores/not-a-uuid/website",
    `${S}/editor`,
    "/",
    "",
  ])("leaves %s unchanged", (p) => {
    expect(toStorelessPath(p)).toBe(p);
  });

  // A copied link opens in the seller's own language, so the locale always goes.
  it.each([
    ["/en/orders", "/orders"],
    ["/ar/orders?status=new", "/orders?status=new"],
    ["/en/settings/plan", "/settings/plan"],
    [`/en${S}/editor`, `${S}/editor`],
    ["/en/stores/not-a-uuid/website", "/stores/not-a-uuid/website"],
    ["/en", "/"],
    ["/ar?x=1", "/?x=1"],
    ["/english/orders", "/english/orders"],
  ])("drops the locale of %s → %s", (from, to) => {
    expect(toStorelessPath(from)).toBe(to);
  });

  it("round trip: every store page maps back to itself", () => {
    const routes = storePageRoutes();
    expect(routes).toContain("/settings/payments");
    expect(routes).toContain("/website/domain/sitemap");
    for (const route of routes) {
      const original = `${S}${route}`;
      const storeless = toStorelessPath(original);
      expect(storeless.startsWith("/stores/" + ID)).toBe(false);
      const [first, ...rest] = segs(storeless);
      if (first === "products") {
        // Through the existing /products/[[...path]] redirect page.
        expect(legacyProductsTarget(ID, rest)).toBe(original);
      } else if (first === "welcome") {
        // Through the existing /welcome redirect page (storeWelcomeHref).
        expect(route).toBe("/welcome");
      } else {
        expect(storelessTarget(segs(storeless), ID, {})).toBe(original);
      }
      expect(toStorelessPath(`/en${original}`)).toBe(storeless);
    }
  });
});
