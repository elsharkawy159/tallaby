import { describe, expect, it } from "vitest";
import { htmlReadingMinutes, isOptimizableImage, isPostForLocale, postCategory, postMatchesLocale, toMarketingPost } from "./blog.lib";

describe("marketing blog helpers", () => {
  it("limits posts to a locale with lang tags", () => {
    expect(postMatchesLocale([], "ar")).toBe(true);
    expect(postMatchesLocale(["growth"], "en")).toBe(true);
    expect(postMatchesLocale(["lang:en"], "en")).toBe(true);
    expect(postMatchesLocale(["lang:en"], "ar")).toBe(false);
    expect(postMatchesLocale(["lang:en", "lang:ar"], "ar")).toBe(true);
  });

  it("checks a mapped post's locale", () => {
    expect(isPostForLocale({}, "ar")).toBe(true);
    expect(isPostForLocale({ langs: ["en"] }, "ar")).toBe(false);
  });

  it("files a post under the first category tag", () => {
    expect(postCategory(["tips", "payments", "growth"])).toBe("payments");
    expect(postCategory(["tips"])).toBe("guides");
  });

  it("counts reading minutes from HTML", () => {
    expect(htmlReadingMinutes("")).toBe(1);
    expect(htmlReadingMinutes(`<p>${"word ".repeat(1000)}</p>`)).toBe(5);
  });

  it("maps a CMS item", () => {
    const post = toMarketingPost(
      {
        slug: "cod-tips",
        data: { title: "COD tips", excerpt: "Short", coverImage: "a/b.jpg", body: "<p>Hi</p>", tags: ["lang:en", "payments", "cod"], authorName: "Team" },
        seo: { description: "SEO" },
        publishedAt: "2026-10-18T10:00:00.000Z",
        updatedAt: "2026-10-18T11:00:00.000Z",
      },
      (src) => (src ? `https://x.supabase.co/${src}` : null),
    );
    expect(post).toMatchObject({
      id: "cod-tips",
      source: "cms",
      category: "payments",
      image: "https://x.supabase.co/a/b.jpg",
      title: "COD tips",
      excerpt: "Short",
      hasArticle: true,
      minutes: 1,
      tags: ["cod"],
      langs: ["en"],
      authorName: "Team",
    });
  });

  it("falls back for a bare item", () => {
    const post = toMarketingPost({ slug: "x", data: {}, seo: { description: "Desc" }, publishedAt: "2026-10-18", updatedAt: "2026-10-18" }, () => null);
    expect(post).toMatchObject({ title: "x", excerpt: "Desc", image: "/banner.jpg", hasArticle: false });
  });

  it("only optimizes local and Supabase images", () => {
    expect(isOptimizableImage("/banner.jpg")).toBe(true);
    expect(isOptimizableImage("https://sakwqwocbccpyrmwjowq.supabase.co/storage/v1/object/public/x.png")).toBe(true);
    expect(isOptimizableImage("https://evil.example.com/x.png")).toBe(false);
  });
});
