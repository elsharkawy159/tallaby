import { describe, expect, it } from "vitest";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_KEYS, formatPhone, normalizeSocialLink, phoneDigits, whatsappDigits } from "./platforms";

describe("social platforms (P4-15)", () => {
  it("lists every platform once, each with an icon and AR/EN labels", () => {
    expect(SOCIAL_PLATFORMS.map((p) => p.key)).toEqual([...SOCIAL_PLATFORM_KEYS]);
    for (const p of SOCIAL_PLATFORMS) {
      expect(p.icon).toMatch(/^M[\d.\-\s,A-Za-z]+$/);
      expect(p.label.ar).toBeTruthy();
      expect(p.label.en).toBeTruthy();
    }
  });

  it.each([
    ["facebook", "facebook.com/mystore", "https://facebook.com/mystore"],
    ["facebook", "https://www.facebook.com/mystore/", "https://www.facebook.com/mystore"],
    ["facebook", "my.store", "https://www.facebook.com/my.store"],
    ["instagram", "@sara_shop", "https://www.instagram.com/sara_shop"],
    ["instagram", "http://instagram.com/sara", "https://instagram.com/sara"],
    ["tiktok", "@sara.shop", "https://www.tiktok.com/@sara.shop"],
    ["tiktok", "https://www.tiktok.com/@sara", "https://www.tiktok.com/@sara"],
    ["x", "@sara", "https://x.com/sara"],
    ["x", "twitter.com/sara", "https://twitter.com/sara"],
    ["youtube", "@SaraShop", "https://www.youtube.com/@SaraShop"],
    ["youtube", "https://youtu.be/abc123", "https://youtu.be/abc123"],
    ["youtube", "https://www.youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=abc"],
    ["snapchat", "sara.shop", "https://www.snapchat.com/add/sara.shop"],
    ["telegram", "@sara_shop", "https://t.me/sara_shop"],
    ["linkedin", "linkedin.com/company/sara", "https://linkedin.com/company/sara"],
    ["pinterest", "sara_shop", "https://www.pinterest.com/sara_shop"],
    ["threads", "@sara", "https://www.threads.net/@sara"],
  ])("%s accepts %s", (platform, input, expected) => {
    expect(normalizeSocialLink(platform, input)).toBe(expected);
  });

  it.each([
    ["facebook", "https://evil.com/facebook.com"],
    ["facebook", "https://facebook.com.evil.com/x"],
    ["facebook", "javascript:alert(1)"],
    ["facebook", "https://user:pw@facebook.com/x"],
    ["facebook", "https://facebook.com:8443/x"],
    ["facebook", "https://facebook.com/"],
    ["instagram", "ftp://instagram.com/sara"],
    ["instagram", "has space"],
    ["x", "@this_handle_is_way_too_long"],
    ["linkedin", "@sara"],
    ["telegram", "@abc"],
    ["tiktok", "https://www.instagram.com/sara"],
    ["myspace", "https://myspace.com/sara"],
    ["facebook", ""],
    ["facebook", `https://facebook.com/${"a".repeat(400)}`],
  ])("%s refuses %s", (platform, input) => {
    expect(normalizeSocialLink(platform, input)).toBeNull();
  });

  it("turns WhatsApp numbers and links into https://wa.me/<digits>", () => {
    expect(normalizeSocialLink("whatsapp", "01012345678")).toBe("https://wa.me/201012345678");
    expect(normalizeSocialLink("whatsapp", "+20 101 234 5678")).toBe("https://wa.me/201012345678");
    expect(normalizeSocialLink("whatsapp", "00971501234567")).toBe("https://wa.me/971501234567");
    expect(normalizeSocialLink("whatsapp", "https://wa.me/201012345678")).toBe("https://wa.me/201012345678");
    expect(normalizeSocialLink("whatsapp", "https://api.whatsapp.com/send?phone=201012345678")).toBe("https://wa.me/201012345678");
    expect(normalizeSocialLink("whatsapp", "https://wa.me/abc")).toBeNull();
    expect(normalizeSocialLink("whatsapp", "12")).toBeNull();
    expect(normalizeSocialLink("whatsapp", "https://evil.com/201012345678")).toBeNull();
    expect(whatsappDigits("0101-234-5678")).toBe("201012345678");
  });

  it.each([
    "201207341113",
    "+201207341113",
    "+20 120 734 1113",
    "00201207341113",
    "2001207341113",
    "01207341113",
    "1207341113",
    "٠١٢٠٧٣٤١١١٣",
    "٢٠١٢٠٧٣٤١١١٣",
    "‎+20 120 734 1113‏",
  ])("reads the Egyptian mobile %j", (input) => {
    expect(phoneDigits(input)).toBe("201207341113");
    expect(formatPhone(input)).toBe("01207341113");
    expect(normalizeSocialLink("whatsapp", input)).toBe("https://wa.me/201207341113");
  });

  it("keeps landlines and other countries, refuses junk", () => {
    expect(formatPhone("0223456789")).toBe("0223456789");
    expect(formatPhone("+971 50 123 4567")).toBe("+971501234567");
    expect(phoneDigits("0123")).toBeNull();
    expect(phoneDigits("abc")).toBeNull();
    expect(formatPhone("")).toBeNull();
  });
});
