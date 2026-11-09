import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  englishLandingRedirect,
  isArabicMarketingPath,
  isBotUserAgent,
  MARKETING_SEGMENTS,
  preferredLanguage,
  type LocaleLandingRequest,
} from "./locale-landing.lib";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function request(overrides: Partial<Omit<LocaleLandingRequest, "headers">> & { headers?: Record<string, string> } = {}) {
  const { headers = {}, ...rest } = overrides;
  const all: Record<string, string> = {
    "user-agent": CHROME,
    "accept-language": "en-US,en;q=0.9",
    "sec-fetch-dest": "document",
    ...headers,
  };
  const lower = Object.fromEntries(Object.entries(all).map(([k, v]) => [k.toLowerCase(), v]));
  return englishLandingRedirect({
    method: "GET",
    pathname: "/",
    search: "",
    host: "tallaby.com",
    localeCookie: null,
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
    ...rest,
  });
}

describe("preferredLanguage", () => {
  it.each([
    ["en-US,en;q=0.9", "en"],
    ["ar-EG,ar;q=0.9,en;q=0.8", "ar"],
    ["ar", "ar"],
    ["AR-sa", "ar"],
    ["en-GB", "en"],
    ["fr-FR,fr;q=0.9", "en"], // neither: not Arabic, so English
    ["de-DE,de;q=0.9,ar;q=0.5", "ar"], // Arabic is the best match among ar/en
    ["en;q=0.4,ar;q=0.8", "ar"], // q-values, not order
    ["ar;q=0.8,en;q=0.8", "ar"], // a tie keeps the header order
    ["en;q=0.8,ar;q=0.8", "en"],
    ["ar;q=0,en", "en"], // q=0 means "not acceptable"
    ["*", null],
    ["*;q=0.5,ar", "ar"],
    ["", null],
    [";;;", null],
    ["ar;q=abc,en", "en"], // a bad q drops that entry
  ])("%s -> %s", (header, expected) => {
    expect(preferredLanguage(header)).toBe(expected);
  });

  it("is null without a header", () => {
    expect(preferredLanguage(null)).toBeNull();
    expect(preferredLanguage(undefined)).toBeNull();
  });
});

describe("isBotUserAgent", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1) Chrome/130 Safari/537.36",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    "WhatsApp/2.23.20.0 A",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Mozilla/5.0 (compatible; AhrefsBot/7.0)",
    "Mozilla/5.0 (compatible; SomeCrawler/1.0)",
    "my-spider/2",
    "Mozilla/5.0 (compatible; Link Preview)",
    "Google-InspectionTool/1.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130 Safari/537.36",
    "",
  ])("%s is a bot", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it("treats a missing UA as not a person", () => {
    expect(isBotUserAgent(null)).toBe(true);
  });

  it.each([CHROME, IPHONE, "Mozilla/5.0 (Linux; Android 14; CUBOT_X30) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36"])(
    "%s is a person",
    (ua) => {
      expect(isBotUserAgent(ua)).toBe(false);
    },
  );
});

describe("isArabicMarketingPath", () => {
  it.each(["/", "/pricing", "/blog", "/blog/some-post", "/features/coupons", "/follow-us", "/templates/x"])("%s is a marketing page", (p) => {
    expect(isArabicMarketingPath(p)).toBe(true);
  });

  it.each([
    "/en",
    "/en/pricing",
    "/ar/pricing",
    "/api/x",
    "/_next/static/chunk.js",
    "/robots.txt",
    "/sitemap.xml",
    "/sitemap.xsl",
    "/blog/cover.png",
    "/cart",
    "/auth/login",
    "/storefront/x",
    "/dev-library",
    "/template-preview/x",
    "/products/x",
    "pricing",
  ])("%s is not", (p) => {
    expect(isArabicMarketingPath(p)).toBe(false);
  });

  it("lists exactly the marketing route folders", () => {
    const marketing = path.resolve(__dirname, "../../app/[locale]/(marketing)");
    const folders = (dir: string) =>
      readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("(") && !entry.name.startsWith("_"))
        .map((entry) => entry.name);
    const expected = ["", ...folders(marketing), ...folders(path.join(marketing, "(site)"))].sort();
    expect([...MARKETING_SEGMENTS].sort()).toEqual(expected);
  });
});

describe("englishLandingRedirect", () => {
  it("sends an English browser landing on Arabic to /en, keeping the path and query", () => {
    expect(request()).toBe("/en");
    expect(request({ pathname: "/pricing", search: "?ref=abc&utm_source=fb" })).toBe("/en/pricing?ref=abc&utm_source=fb");
    expect(request({ pathname: "/blog/post-1" })).toBe("/en/blog/post-1");
  });

  it("sends a non-Arabic, non-English browser to /en too", () => {
    expect(request({ headers: { "accept-language": "fr-FR,fr;q=0.9" } })).toBe("/en");
  });

  it("works without Sec-Fetch-Dest (older browsers)", () => {
    const lower = { "user-agent": CHROME, "accept-language": "en" } as Record<string, string>;
    expect(
      englishLandingRedirect({
        method: "GET",
        pathname: "/",
        search: "",
        host: "tallaby.com",
        localeCookie: null,
        headers: { get: (n) => lower[n] ?? null },
      }),
    ).toBe("/en");
  });

  it("keeps Arabic browsers on Arabic", () => {
    expect(request({ headers: { "accept-language": "ar-EG,ar;q=0.9,en;q=0.8" } })).toBeNull();
    expect(request({ headers: { "accept-language": "fr,ar;q=0.9" } })).toBeNull();
  });

  it("never fights a chosen language (the locale cookie)", () => {
    expect(request({ localeCookie: "ar" })).toBeNull();
    expect(request({ localeCookie: "en", headers: { "accept-language": "ar-EG,ar;q=0.9" } })).not.toBeNull();
  });

  it.each(["POST", "HEAD", "PUT"])("ignores %s", (method) => {
    expect(request({ method })).toBeNull();
  });

  it("ignores requests with no Accept-Language", () => {
    expect(request({ headers: { "accept-language": "" } })).toBeNull();
    expect(request({ headers: { "accept-language": "*" } })).toBeNull();
  });

  it("ignores bots", () => {
    expect(request({ headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } })).toBeNull();
    expect(request({ headers: { "user-agent": "WhatsApp/2.23" } })).toBeNull();
  });

  it("ignores prefetches and non-document fetches", () => {
    expect(request({ headers: { "next-router-prefetch": "1" } })).toBeNull();
    expect(request({ headers: { purpose: "prefetch" } })).toBeNull();
    expect(request({ headers: { "sec-purpose": "prefetch;prerender" } })).toBeNull();
    expect(request({ headers: { "sec-fetch-dest": "empty" } })).toBeNull(); // client-router RSC fetch
    expect(request({ headers: { "sec-fetch-dest": "image" } })).toBeNull();
  });

  it("ignores clicks from another tallaby.com page, not landings from elsewhere", () => {
    expect(request({ headers: { referer: "https://tallaby.com/en/pricing" } })).toBeNull();
    expect(request({ headers: { referer: "https://www.google.com/" } })).toBe("/en");
    expect(request({ headers: { referer: "not a url" } })).toBe("/en");
  });

  it("ignores non-marketing paths and English or file paths", () => {
    for (const pathname of ["/en", "/en/pricing", "/cart", "/auth/login", "/api/x", "/robots.txt", "/sitemap.xml", "/sitemap.xsl"]) {
      expect(request({ pathname })).toBeNull();
    }
  });
});
