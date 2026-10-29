import { describe, expect, it } from "vitest";
import { buildGallery, categoryCode, categoryShowcase, localized, templateFrameSrc, type CatalogTemplate } from "./templates.lib";

const row = (over: Partial<CatalogTemplate>): CatalogTemplate => ({
  key: "x",
  name: { ar: "س", en: "X" },
  description: { ar: "وصف", en: "Desc" },
  category: "general",
  thumbnailUrl: null,
  previewUrl: null,
  isDefault: false,
  isPremium: false,
  price: null,
  sortOrder: 0,
  palette: [],
  pages: [{ slug: "home", isHome: true, name: "الرئيسية" }],
  ...over,
});

describe("template gallery", () => {
  it("lists the database templates, default first, then by sort order", () => {
    const gallery = buildGallery(
      [row({ key: "atelier", sortOrder: 10 }), row({ key: "bazaar", sortOrder: 5 }), row({ key: "tallaby-classic", sortOrder: 20, isDefault: true })],
      "ar",
    );
    expect(gallery.map((e) => e.id)).toEqual(["tallaby-classic", "bazaar", "atelier"]);
  });

  it("is empty without database rows", () => {
    expect(buildGallery([], "ar")).toEqual([]);
  });

  it("maps a row to a card: localized copy, category code, premium price", () => {
    const [entry] = buildGallery(
      [row({ key: "bazaar", category: "home", thumbnailUrl: "https://x.supabase.co/t.png", isPremium: true, price: "250.00", palette: ["#000"] })],
      "en",
    );
    expect(entry).toEqual(
      expect.objectContaining({ id: "bazaar", category: "ho", name: "X", description: "Desc", price: 250, thumbnailUrl: "https://x.supabase.co/t.png", palette: ["#000"] }),
    );
  });

  it("drops unsafe thumbnail and preview URLs (the card then draws the live preview)", () => {
    const [entry] = buildGallery([row({ thumbnailUrl: "javascript:alert(1)", previewUrl: "http://x.test" })], "ar");
    expect(entry?.thumbnailUrl).toBeNull();
    expect(entry?.previewUrl).toBeNull();
  });

  it("puts the home page first and names pages in the locale", () => {
    const [entry] = buildGallery(
      [
        row({
          pages: [
            { slug: "about", isHome: false, name: "من نحن", names: { ar: "من نحن", en: "About" } },
            { slug: "home", isHome: true, name: "الرئيسية" },
          ],
        }),
      ],
      "en",
    );
    expect(entry?.pages).toEqual([
      { slug: "home", isHome: true, name: "الرئيسية" },
      { slug: "about", isHome: false, name: "About" },
    ]);
  });

  it("builds preview frame URLs", () => {
    expect(templateFrameSrc("ar", "atelier")).toBe("/template-preview/atelier");
    expect(templateFrameSrc("en", "atelier", "about", true)).toBe("/en/template-preview/atelier/about?thumb=1");
  });

  it("localizes JSON names with a fallback", () => {
    expect(localized({ ar: "أ", en: "A" }, "en")).toBe("A");
    expect(localized({ ar: "أ" }, "en")).toBe("أ");
    expect(localized(null, "ar")).toBeNull();
    expect(categoryCode("fashion")).toBe("fa");
    expect(categoryCode("other")).toBe("ge");
  });
});

describe("home category cards", () => {
  const gallery = buildGallery(
    [
      row({ key: "mode", category: "fashion", sortOrder: 20 }),
      row({ key: "fashion-warm", category: "fashion", sortOrder: 1250 }),
      row({ key: "shanta", category: "shoes-bags", sortOrder: 520 }),
      row({ key: "volt", category: "electronics", sortOrder: 60 }),
      row({ key: "lumiere", category: "jewelry", sortOrder: 250 }),
      row({ key: "sports-warm", category: "sports", sortOrder: 1490 }),
    ],
    "en",
  );

  const ids = (covers: { id: string }[]) => covers.map((c) => c.id).sort();

  it("offers each featured category's templates but the newest as covers, skipping empty ones", () => {
    const { cards } = categoryShowcase(gallery, ["fa", "el", "be"]);
    expect(cards.map((c) => [c.category, c.count, ids(c.covers)])).toEqual([
      ["fa", 3, ["mode", "shanta"]],
      ["el", 1, ["volt"]],
    ]);
  });

  it("puts every other template behind the More card, without the newest as a cover", () => {
    const more = categoryShowcase(gallery, ["fa", "el"]).more;
    expect(more && [more.count, ids(more.covers)]).toEqual([2, ["lumiere"]]);
    expect(categoryShowcase(gallery, ["fa", "el", "jw", "sp"]).more).toBeNull();
  });
});
