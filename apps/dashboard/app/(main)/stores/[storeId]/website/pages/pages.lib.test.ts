import { describe, expect, it } from "vitest";
import { checkSlug, cleanSeo, moveItem, pageName, slugFromName } from "./pages.lib";

const pages = [
  { id: "home", slug: "home" },
  { id: "about", slug: "about" },
];

describe("website pages helpers", () => {
  it("builds slugs from Latin names only", () => {
    expect(slugFromName("About Us!")).toBe("about-us");
    expect(slugFromName("  Café  Menu ")).toBe("cafe-menu");
    expect(slugFromName("من نحن")).toBe("");
    expect(slugFromName("a".repeat(80))).toHaveLength(64);
  });

  it("flags invalid, reserved and taken slugs like the server", () => {
    expect(checkSlug("Bad Slug", pages)).toBe("invalidSlug");
    expect(checkSlug("-x", pages)).toBe("invalidSlug");
    expect(checkSlug("cart", pages)).toBe("reservedSlug");
    expect(checkSlug("products", pages)).toBe("reservedSlug");
    expect(checkSlug("about", pages)).toBe("slugTaken");
    expect(checkSlug("about", pages, "about")).toBeNull();
    expect(checkSlug("contact-us", pages)).toBeNull();
  });

  it("drops empty SEO fields", () => {
    expect(cleanSeo({ title: " ", description: "", ogImage: "", noindex: false })).toEqual({});
    expect(cleanSeo({ title: " Hi ", description: "d", ogImage: "https://x.test/a.png", noindex: true })).toEqual({
      title: "Hi",
      description: "d",
      ogImage: "https://x.test/a.png",
      noindex: true,
    });
  });

  it("moves items one step and ignores moves past the ends", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });

  it("picks the name in the UI language with a fallback", () => {
    expect(pageName({ ar: "عن", en: "About" }, "en")).toBe("About");
    expect(pageName({ ar: "عن" }, "en")).toBe("عن");
    expect(pageName({ en: "About" }, "ar")).toBe("About");
    expect(pageName({}, "ar")).toBe("");
  });
});
