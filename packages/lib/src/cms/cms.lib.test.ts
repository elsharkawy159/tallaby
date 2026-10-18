import { describe, expect, it } from "vitest";
import { RESERVED_PAGE_SLUGS } from "@workspace/store-sections";
import {
  BLOG_FIELDS,
  RESERVED_COLLECTION_SLUGS,
  cmsCollectionInputSchema,
  cmsItemInputSchema,
  cmsItemState,
  cmsItemSummaryFields,
  isCmsItemPublic,
  parseCmsItemData,
  readingMinutes,
  slugifyCms,
} from "./cms.lib";

const NOW = new Date("2026-10-18T12:00:00Z");

describe("cms item state", () => {
  it("draft and scheduled items are never public", () => {
    expect(cmsItemState("draft", null, NOW)).toBe("draft");
    expect(cmsItemState("draft", "2026-10-01T00:00:00Z", NOW)).toBe("draft");
    expect(cmsItemState("archived", "2026-10-01T00:00:00Z", NOW)).toBe("draft");
    expect(cmsItemState("published", null, NOW)).toBe("draft");
    expect(cmsItemState("published", "2026-10-19T00:00:00Z", NOW)).toBe("scheduled");
    expect(cmsItemState("published", "2026-10-18T11:59:59Z", NOW)).toBe("published");
    expect(isCmsItemPublic("published", "2026-10-19T00:00:00Z", NOW)).toBe(false);
    expect(isCmsItemPublic("draft", "2026-10-01T00:00:00Z", NOW)).toBe(false);
    expect(isCmsItemPublic("published", "2026-10-01T00:00:00Z", NOW)).toBe(true);
  });
});

describe("collection slugs", () => {
  it("reserve every builder page slug, the blog and the store-host pass-through paths", () => {
    for (const slug of RESERVED_PAGE_SLUGS) expect(RESERVED_COLLECTION_SLUGS, slug).toContain(slug);
    for (const slug of ["blog", "auth", "orders", "privacy", "pages"]) expect(RESERVED_COLLECTION_SLUGS).toContain(slug);
  });

  it("validates new collections", () => {
    const fields = [{ key: "name", label: "Name", type: "text" as const, required: true }];
    expect(cmsCollectionInputSchema.safeParse({ name: "Lookbook", slug: "Lookbook", fields }).success).toBe(true);
    const reserved = cmsCollectionInputSchema.safeParse({ name: "Blog", slug: "blog", fields });
    expect(reserved.success).toBe(false);
    expect(reserved.error?.issues.map((i) => i.message)).toContain("reserved_slug");
    expect(cmsCollectionInputSchema.safeParse({ name: "X", slug: "a/b", fields }).success).toBe(false);
    // Needs a text (title) field, unique keys, options for selects; strict objects.
    expect(cmsCollectionInputSchema.safeParse({ name: "X", slug: "x", fields: [{ key: "n", label: "N", type: "number" }] }).success).toBe(false);
    expect(cmsCollectionInputSchema.safeParse({ name: "X", slug: "x", fields: [...fields, ...fields] }).success).toBe(false);
    expect(cmsCollectionInputSchema.safeParse({ name: "X", slug: "x", fields: [...fields, { key: "s", label: "S", type: "select" }] }).success).toBe(false);
    expect(cmsCollectionInputSchema.safeParse({ name: "X", slug: "x", fields, storeId: "evil" }).success).toBe(false);
  });
});

describe("item input", () => {
  it("is strict and needs a lowercase one-segment slug", () => {
    expect(cmsItemInputSchema.safeParse({ slug: "Hello-World", status: "draft", data: {} }).data?.slug).toBe("hello-world");
    expect(cmsItemInputSchema.safeParse({ slug: "a/b", status: "draft", data: {} }).success).toBe(false);
    expect(cmsItemInputSchema.safeParse({ slug: "a", status: "archived", data: {} }).success).toBe(false);
    expect(cmsItemInputSchema.safeParse({ slug: "a", status: "draft", data: {}, storeId: "x" }).success).toBe(false);
    expect(cmsItemInputSchema.safeParse({ slug: "a", status: "published", publishedAt: "not a date", data: {} }).success).toBe(false);
  });
});

describe("parseCmsItemData", () => {
  it("checks blog post data and drops unknown keys", () => {
    const parsed = parseCmsItemData(BLOG_FIELDS, {
      title: "  عنوان  ",
      excerpt: "ملخص",
      tags: ["News", "news", " Size  Guide "],
      coverImage: "seller/blog/a.png",
      readingMinutes: 99,
      evil: "<script>",
    });
    expect(parsed).toEqual({ success: true, data: { title: "عنوان", excerpt: "ملخص", tags: ["news", "size guide"], coverImage: "seller/blog/a.png" } });
  });

  it("reports required and invalid fields", () => {
    const parsed = parseCmsItemData(BLOG_FIELDS, { title: "", coverImage: "javascript:alert(1)", tags: "x" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.issues).toEqual([
        { key: "title", code: "required" },
        { key: "coverImage", code: "invalid" },
        { key: "tags", code: "invalid" },
      ]);
    }
  });

  it("validates each field type", () => {
    const fields = [
      { key: "name", label: "N", type: "text" as const },
      { key: "price", label: "P", type: "number" as const },
      { key: "on", label: "O", type: "boolean" as const },
      { key: "day", label: "D", type: "date" as const },
      { key: "link", label: "L", type: "url" as const },
      { key: "mail", label: "M", type: "email" as const },
      { key: "size", label: "S", type: "select" as const, options: [{ value: "m", label: "M" }] },
    ];
    expect(parseCmsItemData(fields, { name: "a", price: "12.5", on: true, day: "2026-10-18", link: "https://x.test", mail: "a@b.co", size: "m" })).toEqual({
      success: true,
      data: { name: "a", price: 12.5, on: true, day: "2026-10-18", link: "https://x.test", mail: "a@b.co", size: "m" },
    });
    const bad = parseCmsItemData(fields, { price: "x", on: "yes", day: "tomorrow", link: "javascript:alert(1)", mail: "nope", size: "xl" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.issues.map((i) => i.key)).toEqual(["price", "on", "day", "link", "mail", "size"]);
    expect(parseCmsItemData([{ key: "img", label: "I", type: "image" }], { img: "../../other-bucket/x.png" }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("reading time, slug suggestion and summary fields", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(Array(1000).fill("word").join(" "))).toBe(5);
    expect(slugifyCms("Hello, World! Ça va")).toBe("hello-world-ca-va");
    expect(slugifyCms("مرحبا")).toBe("");
    expect(cmsItemSummaryFields(BLOG_FIELDS, { title: "T", excerpt: "E", coverImage: "x.png", tags: ["a"] })).toEqual({
      title: "T",
      excerpt: "E",
      image: "x.png",
      tags: ["a"],
    });
  });
});
