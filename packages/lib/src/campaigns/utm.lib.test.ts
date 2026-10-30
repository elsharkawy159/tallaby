import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_COOKIE_MAX_LENGTH,
  DIRECT_SOURCE,
  buildCampaignUrl,
  campaignSource,
  decodeCampaignCookie,
  encodeCampaignCookie,
  parseCampaignTouch,
  sanitizeCampaignTouch,
  sanitizeCampaignValue,
  sanitizeHost,
  sanitizePath,
  slugifyCampaignValue,
} from "./utm.lib";

const NOW = new Date("2026-10-30T10:00:00.000Z");

describe("sanitizeCampaignValue", () => {
  it("trims, collapses spaces and strips unsafe characters", () => {
    expect(sanitizeCampaignValue("  Eid   <script>sale</script>  ")).toBe("Eid scriptsale/script");
    expect(sanitizeCampaignValue("a\"b'c;d`e")).toBe("abcde");
  });
  it("keeps Arabic letters and caps the length", () => {
    expect(sanitizeCampaignValue("عرض العيد")).toBe("عرض العيد");
    expect(sanitizeCampaignValue("x".repeat(500))).toHaveLength(100);
  });
  it("returns undefined for empty or non-strings", () => {
    expect(sanitizeCampaignValue("   ")).toBeUndefined();
    expect(sanitizeCampaignValue(42)).toBeUndefined();
    expect(sanitizeCampaignValue(null)).toBeUndefined();
  });
});

describe("sanitizeHost / sanitizePath", () => {
  it("normalizes hosts", () => {
    expect(sanitizeHost("WWW.Facebook.com:443")).toBe("facebook.com");
    expect(sanitizeHost("l.instagram.com.")).toBe("l.instagram.com");
    expect(sanitizeHost("not a host")).toBeUndefined();
    expect(sanitizeHost("localhost")).toBeUndefined();
  });
  it("keeps only the path", () => {
    expect(sanitizePath("/products/shoe?utm_source=x#top")).toBe("/products/shoe");
    expect(sanitizePath("/products/%D8%B9")).toBe("/products/%D8%B9");
    expect(sanitizePath("https://evil.com/")).toBeUndefined();
    expect(sanitizePath("/" + "a".repeat(400))).toHaveLength(200);
  });
});

describe("parseCampaignTouch", () => {
  it("reads utm params, click ids and the landing path", () => {
    const touch = parseCampaignTouch({
      search: "?utm_source=Facebook&utm_medium=Paid_Social&utm_campaign=Eid%20Sale&fbclid=abc123&gclid=",
      pathname: "/products/shoe",
      referrer: "https://l.facebook.com/",
      ownHost: "shop.tallaby.com",
      now: NOW,
    });
    expect(touch).toEqual({
      source: "facebook",
      medium: "paid_social",
      campaign: "Eid Sale",
      clickIds: ["fbclid"],
      landingPath: "/products/shoe",
      referrerHost: "l.facebook.com",
      at: NOW.toISOString(),
    });
  });
  it("records an outside referrer alone", () => {
    const touch = parseCampaignTouch({ search: "", pathname: "/", referrer: "https://www.google.com/", ownHost: "shop.tallaby.com", now: NOW });
    expect(touch).toMatchObject({ referrerHost: "google.com", landingPath: "/" });
  });
  it("ignores direct visits and same-site referrers", () => {
    expect(parseCampaignTouch({ search: "", pathname: "/", referrer: "", ownHost: "shop.tallaby.com" })).toBeNull();
    expect(
      parseCampaignTouch({ search: "?q=1", pathname: "/cart", referrer: "https://www.shop.tallaby.com/x", ownHost: "shop.tallaby.com" }),
    ).toBeNull();
    expect(
      parseCampaignTouch({ search: "", pathname: "/", referrer: "javascript:alert(1)", ownHost: "shop.tallaby.com" }),
    ).toBeNull();
  });
});

describe("cookie round trip", () => {
  it("encodes and decodes a touch", () => {
    const touch = { source: "tiktok", campaign: "ramadan", clickIds: ["ttclid" as const], landingPath: "/", at: NOW.toISOString() };
    const value = encodeCampaignCookie(touch)!;
    expect(value).not.toMatch(/[;,\s]/);
    expect(decodeCampaignCookie(value)).toEqual(touch);
  });
  it("drops low-value fields to stay under the cap", () => {
    const arabic = "ع".repeat(100);
    const value = encodeCampaignCookie({ source: "facebook", campaign: arabic, content: arabic, term: arabic, medium: arabic })!;
    expect(value.length).toBeLessThanOrEqual(CAMPAIGN_COOKIE_MAX_LENGTH);
    const back = decodeCampaignCookie(value)!;
    expect(back.source).toBe("facebook");
    expect(back.term).toBeUndefined();
  });
  it("rejects malformed, oversized and forged cookies", () => {
    expect(decodeCampaignCookie("%E0%A4%A")).toBeNull();
    expect(decodeCampaignCookie("not-json")).toBeNull();
    expect(decodeCampaignCookie("x".repeat(CAMPAIGN_COOKIE_MAX_LENGTH + 1))).toBeNull();
    expect(decodeCampaignCookie(encodeURIComponent("[1,2]"))).toBeNull();
    const forged = encodeURIComponent(
      JSON.stringify({ source: "<b>fb</b>", admin: true, clickIds: ["fbclid", "evil"], referrerHost: "a b", at: "nope" }),
    );
    expect(decodeCampaignCookie(forged)).toEqual({ source: "bfb/b", clickIds: ["fbclid"] });
  });
  it("sanitizeCampaignTouch needs a signal", () => {
    expect(sanitizeCampaignTouch({ landingPath: "/", at: NOW.toISOString() })).toBeNull();
  });
});

describe("campaignSource", () => {
  it("uses utm_source with aliases merged", () => {
    expect(campaignSource({ source: "fb" })).toBe("facebook");
    expect(campaignSource({ source: "ig" })).toBe("instagram");
    expect(campaignSource({ source: "m.facebook.com" })).toBe("facebook");
    expect(campaignSource({ source: "sara_influencer" })).toBe("sara_influencer");
  });
  it("falls back to click ids, then the referrer", () => {
    expect(campaignSource({ clickIds: ["ttclid"] })).toBe("tiktok");
    expect(campaignSource({ referrerHost: "l.instagram.com" })).toBe("instagram");
    expect(campaignSource({ referrerHost: "google.com.eg" })).toBe("google");
    expect(campaignSource({ referrerHost: "wa.me" })).toBe("whatsapp");
    expect(campaignSource({ referrerHost: "blog.example.com" })).toBe("blog.example.com");
  });
  it("no touch is direct", () => {
    expect(campaignSource(null)).toBe(DIRECT_SOURCE);
    expect(campaignSource({})).toBe(DIRECT_SOURCE);
  });
});

describe("buildCampaignUrl", () => {
  it("adds slugified utm params and keeps other params", () => {
    const result = buildCampaignUrl("https://shop.tallaby.com/products/shoe?color=red&utm_source=old#x", {
      source: "Facebook",
      medium: "paid_social",
      campaign: "Eid Sale 2026!",
      content: "Video 1",
    });
    expect(result).toEqual({
      ok: true,
      url: "https://shop.tallaby.com/products/shoe?color=red&utm_source=facebook&utm_medium=paid_social&utm_campaign=eid-sale-2026&utm_content=video-1",
    });
  });
  it("keeps Arabic campaign names", () => {
    const result = buildCampaignUrl("https://shop.tallaby.com", { source: "whatsapp", campaign: "عرض العيد" });
    expect(result.ok && new URL(result.url).searchParams.get("utm_campaign")).toBe("عرض-العيد");
  });
  it("validates input", () => {
    expect(buildCampaignUrl("javascript:alert(1)", { source: "a", campaign: "b" })).toEqual({ ok: false, error: "invalidUrl" });
    expect(buildCampaignUrl("not a url", { source: "a", campaign: "b" })).toEqual({ ok: false, error: "invalidUrl" });
    expect(buildCampaignUrl("https://a.com", { source: " ", campaign: "b" })).toEqual({ ok: false, error: "missingSource" });
    expect(buildCampaignUrl("https://a.com", { source: "a", campaign: "!!" })).toEqual({ ok: false, error: "missingCampaign" });
  });
  it("slugifies", () => {
    expect(slugifyCampaignValue("  Black Friday / 50% ")).toBe("black-friday-50");
  });
});
