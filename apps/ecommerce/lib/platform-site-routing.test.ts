import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { isPlatformSitePath, platformSiteOf } from "./platform-site-routing";

// The proxy's database lookups and Supabase session refresh are not what these tests cover.
vi.mock("@/lib/custom-domain-lookup", () => ({
  storeHostForSubdomain: vi.fn(async () => null),
  // faster-eg.com is stored as the apex (today's rows); www.ward-eg.com is a
  // store kept on its www. host (a DNS host with no apex ALIAS).
  storeHostForCustomDomain: vi.fn(async (domain: string) =>
    domain === "faster-eg.com"
      ? { subdomain: "faster", customDomain: "faster-eg.com", defaultLocale: "ar", locales: ["ar", "en"] }
      : domain === "www.ward-eg.com"
        ? { subdomain: "ward", customDomain: "www.ward-eg.com", defaultLocale: "ar", locales: ["ar", "en"] }
        : null,
  ),
}));
vi.mock("@/supabase/middleware", () => ({
  updateSession: vi.fn(async (_request: NextRequest, response: NextResponse) => response),
}));

const { proxy } = await import("@/proxy");

const MARKETING = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

function get(host: string, path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(new URL(`http://${host}${path}`), { headers: { host, "accept-language": "ar", ...headers } }));
}

/** Everything a test compares: status, where it goes, what it rewrites to and the robots header. */
async function shape(host: string, path: string) {
  const response = await get(host, path);
  return {
    status: response.status,
    location: response.headers.get("location"),
    // The rewrite keeps the request host; compare the path it goes to.
    rewrite: response.headers.get("x-middleware-rewrite")?.replace(/^https?:\/\/[^/]+/, "") ?? null,
    next: response.headers.get("x-middleware-next"),
    robots: response.headers.get("x-robots-tag"),
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("platformSiteOf / isPlatformSitePath", () => {
  it("knows only account.<root> and preview.<root>", () => {
    expect(platformSiteOf("account.tallaby.com")).toBe("account");
    expect(platformSiteOf("preview.tallaby.com")).toBe("preview");
    for (const host of ["tallaby.com", "www.tallaby.com", "glow.tallaby.com", "faster-eg.com", "localhost:3000", null]) {
      expect(platformSiteOf(host)).toBeNull();
    }
  });

  it("allows the account pages with or without a locale prefix", () => {
    for (const path of ["/auth", "/en/auth", "/ar/auth", "/cart", "/cart/checkout", "/en/cart/checkout/payment", "/orders/abc", "/profile", "/profile/wallet", "/en/profile/orders", "/returns", "/shipping", "/payment", "/cookies", "/en/cookies"]) {
      expect(isPlatformSitePath("account", path)).toBe(true);
    }
    for (const path of ["/", "/en", "/pricing", "/authx", "/cartoon", "/template-preview/sage", "/robots.txt", "/sitemap.xml", "/fr/auth"]) {
      expect(isPlatformSitePath("account", path)).toBe(false);
    }
  });

  it("allows the preview pages with or without a locale prefix", () => {
    for (const path of ["/template-preview/sage", "/en/template-preview/sage/about", "/dev-library", "/en/dev-library/section/x"]) {
      expect(isPlatformSitePath("preview", path)).toBe(true);
    }
    for (const path of ["/", "/auth", "/templates", "/template-previews/sage.ar.webp", "/robots.txt"]) {
      expect(isPlatformSitePath("preview", path)).toBe(false);
    }
  });
});

describe("proxy on the reserved subdomains", () => {
  it("routes account pages as on tallaby.com, marked noindex", async () => {
    const account = await shape("account.tallaby.com", "/auth");
    const apex = await shape("tallaby.com", "/auth");
    expect(account).toEqual({ ...apex, robots: "noindex, nofollow" });
    expect((await shape("account.tallaby.com", "/en/profile/wallet")).robots).toBe("noindex, nofollow");
  });

  it("sends other account paths to tallaby.com (308, noindex), keeping the query", async () => {
    expect(await shape("account.tallaby.com", "/pricing?x=1")).toMatchObject({ status: 308, location: `${MARKETING}/pricing?x=1`, robots: "noindex, nofollow" });
    expect(await shape("account.tallaby.com", "/")).toMatchObject({ status: 308, location: `${MARKETING}/` });
    expect(await shape("account.tallaby.com", "/robots.txt")).toMatchObject({ status: 308, location: `${MARKETING}/robots.txt` });
    expect(await shape("account.tallaby.com", "/template-preview/sage")).toMatchObject({ status: 308 });
  });

  it("serves the template preview on preview.<root> and sends the rest to tallaby.com", async () => {
    const preview = await shape("preview.tallaby.com", "/template-preview/sage?thumb=1");
    expect(preview).toEqual({ ...(await shape("tallaby.com", "/template-preview/sage?thumb=1")), robots: "noindex, nofollow" });
    expect(await shape("preview.tallaby.com", "/")).toMatchObject({ status: 308, location: `${MARKETING}/`, robots: "noindex, nofollow" });
    expect(await shape("preview.tallaby.com", "/auth")).toMatchObject({ status: 308, location: `${MARKETING}/auth` });
  });
});

describe("proxy on every other host (unchanged)", () => {
  it("adds no robots header and no redirect on tallaby.com", async () => {
    for (const path of ["/", "/pricing", "/auth", "/template-preview/sage", "/robots.txt"]) {
      const result = await shape("tallaby.com", path);
      expect(result.robots).toBeNull();
      expect(result.status).not.toBe(308);
    }
    expect((await shape("tallaby.com", "/storefront/x")).status).toBe(404);
  });

  it("routes a store subdomain and a custom domain through the storefront", async () => {
    expect(await shape("sara.tallaby.com", "/")).toMatchObject({ robots: null });
    expect((await shape("sara.tallaby.com", "/")).rewrite).toContain("/ar/storefront/sara");
    expect((await shape("faster-eg.com", "/products/bag")).rewrite).toContain("/ar/storefront/faster/products/bag");
    expect((await shape("faster-eg.com", "/products/bag")).robots).toBeNull();
    expect((await shape("unknown-shop.com", "/")).status).toBe(404);
  });
});

describe("proxy on www. of a custom domain", () => {
  it("sends www. to the apex row (308), keeping the path and query", async () => {
    expect(await shape("www.faster-eg.com", "/products/bag?color=red&utm_source=fb")).toMatchObject({
      status: 308,
      location: "https://faster-eg.com/products/bag?color=red&utm_source=fb",
      rewrite: null,
    });
    expect((await shape("www.faster-eg.com", "/")).location).toBe("https://faster-eg.com/");
  });

  it("keeps serving the apex itself, with no redirect", async () => {
    const apex = await shape("faster-eg.com", "/");
    expect(apex.status).not.toBe(308);
    expect(apex.location).toBeNull();
    expect(apex.rewrite).toContain("/ar/storefront/faster");
  });

  it("serves a store stored on its www. host as-is", async () => {
    const www = await shape("www.ward-eg.com", "/products/rose");
    expect(www.location).toBeNull();
    expect(www.rewrite).toContain("/ar/storefront/ward/products/rose");
  });

  it("404s a www. host whose apex is not an active custom domain", async () => {
    for (const host of ["www.unknown-shop.com", "ward-eg.com", "www.www.faster-eg.com"]) {
      expect(await shape(host, "/")).toMatchObject({ status: 404, location: null });
    }
  });

  it("leaves store subdomains and tallaby hosts unchanged", async () => {
    const { storeHostForCustomDomain } = await import("@/lib/custom-domain-lookup");
    vi.mocked(storeHostForCustomDomain).mockClear();
    expect((await shape("sara.tallaby.com", "/")).rewrite).toContain("/ar/storefront/sara");
    for (const host of ["tallaby.com", "www.tallaby.com", "account.tallaby.com"]) {
      expect((await shape(host, "/")).status).not.toBe(404);
    }
    // Platform hosts never reach the custom-domain lookup (or its www. fallback).
    expect(storeHostForCustomDomain).not.toHaveBeenCalled();
  });
});
