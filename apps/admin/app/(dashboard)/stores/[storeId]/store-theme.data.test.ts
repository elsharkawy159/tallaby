import { describe, expect, it } from "vitest";
import type { StoreTemplateCard } from "@workspace/lib/store-sites/server";
import { buildThemeGallery } from "./store-theme.data";

const row = (key: string, category: string, editions: StoreTemplateCard["editions"] = []): StoreTemplateCard => ({
  id: key,
  key,
  name: { en: key, ar: key },
  description: { en: "", ar: "" },
  category,
  thumbnailUrl: null,
  isDefault: false,
  isPremium: false,
  version: 1,
  sortOrder: 1,
  palette: ["#000000"],
  pageNames: {},
  formKinds: [],
  outline: [{ slug: "home", isHome: true, name: "Home", sections: [] }],
  editions,
});

const tshirts = { id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } };

describe("buildThemeGallery", () => {
  // Every industry is niche-only since 2026-11-12: a template that serves no niche ("nest", deleted 2026-11-04) is left out.
  it("maps the rows, gives an industry tab its niches and opens on the store's industry", () => {
    const gallery = buildThemeGallery([row("streetwear", "fashion", [tshirts]), row("rokn", "home"), row("nest", "home")], {
      name: "Cotton Tees",
      storeCategory: "Fashion",
      storeCategoryAr: null,
    });
    expect(gallery.themes.map((theme) => [theme.key, theme.editions.map((edition) => edition.id), theme.pageCount])).toEqual([
      ["streetwear", ["tshirts"], 1],
      ["rokn", [], 1],
    ]);
    expect(gallery.tabs.fashion?.niches.map((niche) => niche.id)).toEqual(["tshirts"]);
    expect(gallery.tabs.fashion?.looks.tshirts).toEqual(["streetwear"]);
    expect(gallery.tabs.home?.looks.decor).toEqual(["rokn"]);
    expect(gallery.themes.find((theme) => theme.key === "rokn")?.nicheCard?.niche).toBe("decor");
    expect(gallery.initial.category).toBe("fashion");
  });

  it("opens on All when the store's industry has no theme", () => {
    const gallery = buildThemeGallery([row("rokn", "home")], { name: "Shop", storeCategory: "Fashion", storeCategoryAr: null });
    expect(gallery.initial).toEqual({ category: null, niche: null });
  });
});

describe("buildThemeGallery relevance (owner, 2026-11-15)", () => {
  it("lists the store's industry first and opens on its saved niche", () => {
    const gallery = buildThemeGallery([row("rokn", "home"), row("streetwear", "fashion", [tshirts])], {
      name: "Shop",
      storeCategory: "Fashion",
      storeCategoryAr: null,
      nicheSetting: "tshirts",
    });
    expect(gallery.themes.map((theme) => theme.key)).toEqual(["streetwear", "rokn"]);
    expect(gallery.initial).toEqual({ category: "fashion", niche: "tshirts" });
  });

  it("ignores a saved niche of another industry", () => {
    const gallery = buildThemeGallery([row("streetwear", "fashion", [tshirts])], { name: "Shop", storeCategory: "Fashion", storeCategoryAr: null, nicheSetting: "watches" });
    expect(gallery.initial).toEqual({ category: "fashion", niche: null });
  });
});
