import { describe, expect, it } from "vitest";
import { normalizeProductUrl, parseProductUrlList, shortProductUrl } from "./product-url-list.lib";

describe("parseProductUrlList", () => {
  it("reads one link per line and keeps the order", () => {
    const list = parseProductUrlList("https://shop.com/a\n\n  https://shop.com/b  \r\nhttps://shop.com/c");
    expect(list.urls).toEqual(["https://shop.com/a", "https://shop.com/b", "https://shop.com/c"]);
    expect(list).toMatchObject({ invalid: [], duplicates: 0, overLimit: 0 });
  });

  it("splits links pasted on one line with spaces or commas, keeping commas inside a query", () => {
    const list = parseProductUrlList("https://shop.com/a, https://shop.com/b https://shop.com/c?size=1,2");
    expect(list.urls).toEqual(["https://shop.com/a", "https://shop.com/b", "https://shop.com/c?size=1,2"]);
  });

  it("drops repeats, also when only the #fragment differs", () => {
    const list = parseProductUrlList("https://shop.com/a\nhttps://shop.com/a#reviews\nhttps://shop.com/a");
    expect(list.urls).toEqual(["https://shop.com/a"]);
    expect(list.duplicates).toBe(2);
  });

  it("finds links inside a message and ignores other words", () => {
    const list = parseProductUrlList("شوف المنتج ده (https://shop.com/p/1). وكمان www.noon.com/egypt-ar/x/p/");
    expect(list.urls).toEqual(["https://shop.com/p/1", "https://www.noon.com/egypt-ar/x/p/"]);
    expect(list.invalid).toEqual([]);
  });

  it("reports what looks like a link but isn't one", () => {
    const list = parseProductUrlList("https://\nhttp://localhost/a\nftp://shop.com/a\nhttps://user:pw@shop.com/a\nhttps://shop.com/ok");
    expect(list.urls).toEqual(["https://shop.com/ok"]);
    expect(list.invalid).toEqual(["https://", "http://localhost/a", "https://user:pw@shop.com/a"]);
  });

  it("keeps only the first `max` links and counts the rest", () => {
    const input = Array.from({ length: 30 }, (_, i) => `https://shop.com/p/${i}`).join("\n");
    const list = parseProductUrlList(input, 25);
    expect(list.urls).toHaveLength(25);
    expect(list.urls[24]).toBe("https://shop.com/p/24");
    expect(list.overLimit).toBe(5);
  });

  it("returns nothing for empty input", () => {
    expect(parseProductUrlList("   \n ")).toEqual({ urls: [], invalid: [], duplicates: 0, overLimit: 0 });
  });
});

describe("normalizeProductUrl", () => {
  it("adds https to a bare host and strips the fragment", () => {
    expect(normalizeProductUrl("shop.com/p/1#top")).toBe("https://shop.com/p/1");
    expect(normalizeProductUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("shortProductUrl", () => {
  it("shows the host and the end of the path on one short line", () => {
    expect(shortProductUrl("https://www.amazon.eg/-/en/Some-Very-Long-Product-Name-With-Many-Words/dp/B0ABCDEF12?th=1"))
      .toBe("amazon.eg/…/B0ABCDEF12");
    expect(shortProductUrl("https://shop.com/")).toBe("shop.com");
    expect(shortProductUrl("https://shop.com/%D9%85%D9%86%D8%AA%D8%AC")).toBe("shop.com/منتج");
    expect(shortProductUrl(`https://shop.com/${"a".repeat(60)}`)).toHaveLength("shop.com/".length + 28);
  });
});
