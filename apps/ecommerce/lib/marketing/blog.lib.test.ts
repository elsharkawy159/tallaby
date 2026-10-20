import { describe, expect, it } from "vitest";
import type { PublicPlatformPost } from "@workspace/lib/platform-blog/server";
import { htmlReadingMinutes, isOptimizableImage, isPostForLocale, platformPostToMarketing, postCategory } from "./blog.lib";

const post: PublicPlatformPost = {
  slug: "cod-tips",
  category: "payments",
  titleAr: "نصائح الدفع عند الاستلام",
  titleEn: "COD tips",
  excerptAr: "",
  excerptEn: "Short",
  bodyAr: "<p>مرحبا</p>",
  bodyEn: "<p>Hi</p>",
  coverImage: "2026/10/19/cover.jpg",
  authorName: " Team ",
  tags: ["cod"],
  readingMinutes: null,
  seo: { descriptionAr: "وصف", titleEn: "COD tips | Tallaby", ogImage: "2026/10/19/og.jpg" },
  publishedAt: "2026-10-18T10:00:00.000Z",
  updatedAt: "2026-10-18T11:00:00.000Z",
};

const resolve = (src: string) => (src ? `https://x.supabase.co/${src}` : null);

describe("marketing blog helpers", () => {
  it("checks a mapped post's locale", () => {
    expect(isPostForLocale({}, "ar")).toBe(true);
    expect(isPostForLocale({ langs: ["en"] }, "ar")).toBe(false);
  });

  it("files unknown categories under guides", () => {
    expect(postCategory("payments")).toBe("payments");
    expect(postCategory("news")).toBe("guides");
  });

  it("counts reading minutes from HTML", () => {
    expect(htmlReadingMinutes("")).toBe(1);
    expect(htmlReadingMinutes(`<p>${"word ".repeat(1000)}</p>`)).toBe(5);
  });

  it("maps the English side of a post", () => {
    expect(platformPostToMarketing(post, "en", resolve)).toMatchObject({
      id: "cod-tips",
      source: "cms",
      category: "payments",
      image: "https://x.supabase.co/2026/10/19/cover.jpg",
      title: "COD tips",
      excerpt: "Short",
      html: "<p>Hi</p>",
      hasArticle: true,
      minutes: 1,
      tags: ["cod"],
      langs: ["ar", "en"],
      authorName: "Team",
      seo: { title: "COD tips | Tallaby", ogImage: "https://x.supabase.co/2026/10/19/og.jpg" },
    });
  });

  it("maps the Arabic side and falls back to the SEO description", () => {
    expect(platformPostToMarketing(post, "ar", resolve)).toMatchObject({
      title: "نصائح الدفع عند الاستلام",
      excerpt: "وصف",
      html: "<p>مرحبا</p>",
      seo: { description: "وصف" },
    });
  });

  it("hides a post in a locale without a title", () => {
    const arOnly = { ...post, titleEn: " " };
    expect(platformPostToMarketing(arOnly, "en", resolve)).toBeNull();
    expect(platformPostToMarketing(arOnly, "ar", resolve)?.langs).toEqual(["ar"]);
  });

  it("falls back for a bare post", () => {
    const bare = { ...post, coverImage: null, bodyEn: "", excerptEn: "", seo: {}, authorName: null, readingMinutes: 4 };
    expect(platformPostToMarketing(bare, "en", () => null)).toMatchObject({ image: "/banner.jpg", hasArticle: false, minutes: 4, excerpt: "", authorName: null });
  });

  it("only optimizes local and Supabase images", () => {
    expect(isOptimizableImage("/banner.jpg")).toBe(true);
    expect(isOptimizableImage("https://sakwqwocbccpyrmwjowq.supabase.co/storage/v1/object/public/x.png")).toBe(true);
    expect(isOptimizableImage("https://evil.example.com/x.png")).toBe(false);
  });
});
