import { describe, expect, it } from "vitest";
import {
  EMPTY_PLATFORM_BLOG_SEO,
  isPlatformBlogImage,
  platformBlogPostInputSchema,
  platformPostLocales,
  platformPostState,
  slugifyPlatformPost,
} from "./platform-blog.lib";

const base = {
  slug: "pricing-products",
  category: "guides",
  titleAr: "تسعير المنتجات",
  titleEn: "",
  excerptAr: "",
  excerptEn: "",
  bodyAr: "<p>نص</p>",
  bodyEn: "",
  coverImage: "2026/10/19/cover.webp",
  authorName: "",
  tags: ["Pricing"],
  readingMinutes: null,
  seo: EMPTY_PLATFORM_BLOG_SEO,
  status: "published",
  publishedAt: "2026-10-19T10:00:00.000Z",
};

describe("platformBlogPostInputSchema", () => {
  it("accepts an Arabic-only published post and lowercases tags", () => {
    const parsed = platformBlogPostInputSchema.parse(base);
    expect(parsed.tags).toEqual(["pricing"]);
  });

  it("rejects bad slugs", () => {
    for (const slug of ["Pricing", "a--b", "-a", "a b", "تسعير", ""]) {
      expect(platformBlogPostInputSchema.safeParse({ ...base, slug }).success).toBe(false);
    }
  });

  it("needs a title and a date to publish, but not for a draft", () => {
    expect(platformBlogPostInputSchema.safeParse({ ...base, titleAr: "" }).success).toBe(false);
    expect(platformBlogPostInputSchema.safeParse({ ...base, publishedAt: null }).success).toBe(false);
    expect(platformBlogPostInputSchema.safeParse({ ...base, status: "draft", titleAr: "", publishedAt: null }).success).toBe(true);
  });

  it("rejects unknown categories and unsafe images", () => {
    expect(platformBlogPostInputSchema.safeParse({ ...base, category: "news" }).success).toBe(false);
    expect(platformBlogPostInputSchema.safeParse({ ...base, coverImage: "javascript:alert(1)" }).success).toBe(false);
    expect(platformBlogPostInputSchema.safeParse({ ...base, coverImage: "../secret.png" }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("slugifies Latin titles and drops Arabic", () => {
    expect(slugifyPlatformPost("How to Price — Your Products!")).toBe("how-to-price-your-products");
    expect(slugifyPlatformPost("تسعير")).toBe("");
  });

  it("accepts bucket paths and https URLs only", () => {
    expect(isPlatformBlogImage("2026/10/19/a.webp")).toBe(true);
    expect(isPlatformBlogImage("https://x.supabase.co/a.png")).toBe(true);
    expect(isPlatformBlogImage("http://x.com/a.png")).toBe(false);
    expect(isPlatformBlogImage("/abs.png")).toBe(false);
  });

  it("derives the state from status and date", () => {
    const now = new Date("2026-10-19T12:00:00Z");
    expect(platformPostState("draft", null, now)).toBe("draft");
    expect(platformPostState("published", "2026-10-19T11:00:00Z", now)).toBe("published");
    expect(platformPostState("published", "2026-10-20T11:00:00Z", now)).toBe("scheduled");
  });

  it("lists the locales that have a title", () => {
    expect(platformPostLocales({ titleAr: "x", titleEn: " " })).toEqual(["ar"]);
    expect(platformPostLocales({ titleAr: "x", titleEn: "y" })).toEqual(["ar", "en"]);
  });
});
