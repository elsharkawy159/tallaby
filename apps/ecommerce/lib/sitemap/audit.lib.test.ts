import { describe, expect, it, vi } from "vitest";
import {
  auditUrls,
  classifyPage,
  extractHeadSignals,
  parseSitemapXml,
  summarizeAudit,
  validateUrlShape,
  type FetchedPage,
} from "./audit.lib";

const ORIGIN = "https://www.tallaby.com";

function page(url: string, html: string, overrides: Partial<FetchedPage> = {}): FetchedPage {
  return {
    url,
    httpStatus: 200,
    location: null,
    isRedirect: false,
    xRobotsTag: null,
    contentType: "text/html; charset=utf-8",
    html,
    ...overrides,
  };
}

const head = (url: string, lang: "ar" | "en", extra = "") =>
  `<html lang="${lang}" dir="rtl"><head><link rel="canonical" href="${url}"/>` +
  `<link rel="alternate" hrefLang="${lang}" href="${url}"/>${extra}</head><body></body></html>`;

describe("validateUrlShape", () => {
  it("accepts absolute https URLs on the canonical origin", () => {
    expect(validateUrlShape(`${ORIGIN}/en/products/x`, ORIGIN)).toEqual([]);
    expect(validateUrlShape(ORIGIN, ORIGIN)).toEqual([]);
  });

  it("flags the wrong host, http, query strings, fragments and trailing slashes", () => {
    expect(validateUrlShape("https://tallaby.com/x", ORIGIN)).toEqual([
      "origin https://tallaby.com is not https://www.tallaby.com",
    ]);
    expect(validateUrlShape("http://www.tallaby.com/x", ORIGIN)).toContain("not https");
    expect(validateUrlShape(`${ORIGIN}/products?x=1`, ORIGIN)).toContain("has a query string");
    expect(validateUrlShape(`${ORIGIN}/a#b`, ORIGIN)).toContain("has a fragment");
    expect(validateUrlShape(`${ORIGIN}/about/`, ORIGIN)).toContain("trailing slash");
    expect(validateUrlShape("/relative", ORIGIN)).toEqual(["not an absolute URL"]);
  });
});

describe("extractHeadSignals", () => {
  it("reads canonical, robots, lang, hreflang, meta refresh and page state", () => {
    const s = extractHeadSignals(
      `<html lang="en"><head><link rel="canonical" href="https://x/a?b=1&amp;c=2"/>` +
        `<meta name="robots" content="noindex, follow"/>` +
        `<link rel="alternate" hrefLang="ar" href="https://x/ar"/>` +
        `<meta id="__next-page-redirect" http-equiv="refresh" content="1;url=/products"/>` +
        `</head><body><main data-page-state="not-found"></main></body></html>`
    );
    expect(s).toEqual({
      canonical: "https://x/a?b=1&c=2",
      robots: ["noindex, follow"],
      htmlLang: "en",
      metaRefresh: "/products",
      pageState: "not-found",
      hreflang: { ar: "https://x/ar" },
    });
  });
});

describe("classifyPage", () => {
  const url = `${ORIGIN}/en/products/speaker`;

  it("valid: 200, self-canonical, indexable", () => {
    const r = classifyPage(page(url, head(url, "en")));
    expect(r.status).toBe("valid");
    expect(r.issues).toEqual([]);
  });

  it("redirect: 3xx with or without a visible target", () => {
    expect(classifyPage(page(url, "", { httpStatus: 307, location: `${ORIGIN}/en/products` })).status).toBe("redirect");
    // Browser fetch with redirect: "manual" gives an opaque response.
    expect(classifyPage(page(url, "", { httpStatus: 0, isRedirect: true })).status).toBe("redirect");
  });

  it("redirect: Next's streamed meta-refresh redirect served with 200", () => {
    const r = classifyPage(page(url, `<head><meta http-equiv="refresh" content="1;url=/en/products"/></head>`));
    expect(r.status).toBe("redirect");
    expect(r.location).toBe("/en/products");
  });

  it("not_found: 404 and 410", () => {
    expect(classifyPage(page(url, "", { httpStatus: 404 })).status).toBe("not_found");
    expect(classifyPage(page(url, "", { httpStatus: 410 })).status).toBe("not_found");
  });

  it("soft_404: not-found page or empty listing served with 200", () => {
    expect(classifyPage(page(url, `<main data-page-state="not-found">`)).status).toBe("soft_404");
    expect(classifyPage(page(url, `<div data-page-state="empty-listing">`)).status).toBe("soft_404");
  });

  it("server_error: 5xx", () => {
    expect(classifyPage(page(url, "", { httpStatus: 500 })).status).toBe("server_error");
  });

  it("non_indexable: noindex meta, X-Robots-Tag, or canonical elsewhere", () => {
    expect(classifyPage(page(url, head(url, "en", `<meta name="robots" content="noindex"/>`))).status).toBe(
      "non_indexable"
    );
    expect(classifyPage(page(url, head(url, "en"), { xRobotsTag: "noindex" })).status).toBe("non_indexable");
    const other = classifyPage(page(url, head(`${ORIGIN}/en/products`, "en")));
    expect(other.status).toBe("non_indexable");
    expect(other.issues[0]).toContain("canonical points to");
  });

  it("warns (without failing) on wrong page language or missing self hreflang", () => {
    const arUrl = `${ORIGIN}/products/x`;
    const r = classifyPage(page(arUrl, head(arUrl, "en")));
    expect(r.status).toBe("valid");
    expect(r.issues.some((i) => i.includes("page language is en, expected ar"))).toBe(true);
  });
});

describe("auditUrls", () => {
  const ok = (url: string) => Promise.resolve(page(url, head(url, url.includes("/en") ? "en" : "ar")));

  it("flags duplicates and invalid URLs without requesting them", async () => {
    const fetchPage = vi.fn(ok);
    const results = await auditUrls(
      [`${ORIGIN}/a`, `${ORIGIN}/a`, "https://tallaby.com/b"],
      { expectedOrigin: ORIGIN, fetchPage, retries: 0 }
    );
    expect(results.map((r) => r.status)).toEqual(["valid", "duplicate", "invalid_url"]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures and reports persistent ones as unverified", async () => {
    let calls = 0;
    const flaky = vi.fn(async (url: string) => {
      calls++;
      if (calls === 1) throw new Error("ECONNRESET");
      return ok(url);
    });
    const [recovered] = await auditUrls([`${ORIGIN}/a`], { expectedOrigin: ORIGIN, fetchPage: flaky, retries: 1 });
    expect(recovered!.status).toBe("valid");

    const limited = vi.fn(async (url: string) => page(url, "", { httpStatus: 429 }));
    const [rateLimited] = await auditUrls([`${ORIGIN}/b`], { expectedOrigin: ORIGIN, fetchPage: limited, retries: 1 });
    expect(rateLimited!.status).toBe("unverified");
    expect(limited).toHaveBeenCalledTimes(2);

    const broken = vi.fn(async (url: string) => page(url, "", { httpStatus: 500 }));
    const [error] = await auditUrls([`${ORIGIN}/c`], { expectedOrigin: ORIGIN, fetchPage: broken, retries: 1 });
    expect(error!.status).toBe("server_error");
  }, 20_000);

  it("never exceeds the concurrency limit and keeps input order", async () => {
    let active = 0;
    let peak = 0;
    const fetchPage = async (url: string) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return ok(url);
    };
    const urls = Array.from({ length: 20 }, (_, i) => `${ORIGIN}/p${i}`);
    const results = await auditUrls(urls, { expectedOrigin: ORIGIN, fetchPage, concurrency: 3 });
    expect(peak).toBeLessThanOrEqual(3);
    expect(results.map((r) => r.url)).toEqual(urls);
    expect(summarizeAudit(results).valid).toBe(20);
  });

  it("requests a rewritten URL but reports the sitemap URL", async () => {
    const fetchPage = vi.fn(async (requested: string) => {
      expect(requested).toBe("http://localhost:3000/en/x");
      return page(requested, head(`${ORIGIN}/en/x`, "en"));
    });
    const [r] = await auditUrls([`${ORIGIN}/en/x`], {
      expectedOrigin: ORIGIN,
      fetchPage,
      requestUrlFor: (u) => u.replace(ORIGIN, "http://localhost:3000"),
    });
    expect(r!.url).toBe(`${ORIGIN}/en/x`);
    expect(r!.status).toBe("valid");
  });
});

describe("parseSitemapXml", () => {
  it("reads urlsets and indexes", () => {
    expect(parseSitemapXml(`<urlset xmlns="x"><url><loc>https://a/b?x=1&amp;y=2</loc></url></urlset>`)).toEqual({
      kind: "urlset",
      locs: ["https://a/b?x=1&y=2"],
    });
    expect(parseSitemapXml(`<sitemapindex><sitemap><loc>https://a/1.xml</loc></sitemap></sitemapindex>`).kind).toBe(
      "sitemapindex"
    );
  });
});
