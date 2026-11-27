import { describe, expect, it } from "vitest";
import { extractVerificationToken, isVerificationToken, searchConsoleUrls } from "./search-console.lib";

describe("Google Search Console app", () => {
  it("keeps only the content value of a pasted meta tag", () => {
    expect(extractVerificationToken('<meta name="google-site-verification" content="abc123XYZ_-" />')).toBe("abc123XYZ_-");
    expect(extractVerificationToken("  abc123XYZ_-  ")).toBe("abc123XYZ_-");
    expect(extractVerificationToken("")).toBe("");
  });

  it("accepts only a token, never HTML or script", () => {
    expect(isVerificationToken("abc123XYZ_-")).toBe(true);
    expect(isVerificationToken("short")).toBe(false);
    expect(isVerificationToken('"><script>x</script>')).toBe(false);
    expect(isVerificationToken(extractVerificationToken("<script>alert(1)</script>"))).toBe(false);
  });

  it("builds the property, sitemap and robots addresses from the store address", () => {
    expect(searchConsoleUrls("https://shop.tallaby.com")).toEqual({
      property: "https://shop.tallaby.com/",
      sitemap: "https://shop.tallaby.com/sitemap.xml",
      robots: "https://shop.tallaby.com/robots.txt",
    });
    expect(searchConsoleUrls("https://mystore.com/").sitemap).toBe("https://mystore.com/sitemap.xml");
  });
});
