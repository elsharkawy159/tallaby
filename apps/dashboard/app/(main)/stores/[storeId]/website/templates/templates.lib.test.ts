import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES } from "@workspace/store-sections/templates";
import {
  cardEdition,
  categoryOrder,
  galleryNiches,
  galleryTemplates,
  nicheCards,
  pageTemplates,
  parseTemplatesCategory,
  parseTemplatesNiche,
  parseTemplatesPage,
  resolveNicheFilter,
  servedCategory,
  sortByIndustry,
  templatePreviewTabUrl,
} from "./templates.lib";

// `sortOrder`: a higher one is a newer template.
const rows = [
  { key: "classic", category: "general", sortOrder: 10 },
  { key: "mode", category: "fashion", sortOrder: 20 },
  { key: "techhub", category: "electronics", sortOrder: 50 },
  { key: "kasr", category: "fashion", sortOrder: 40 },
  { key: "volt", category: "electronics", sortOrder: 60 },
];

describe("sortByIndustry", () => {
  it("puts the industry's templates first and keeps each group's order", () => {
    expect(sortByIndustry(rows, "electronics").map((r) => r.key)).toEqual(["techhub", "volt", "classic", "mode", "kasr"]);
  });

  it("keeps the order when the store has no industry or none of its templates", () => {
    expect(sortByIndustry(rows, null).map((r) => r.key)).toEqual(rows.map((r) => r.key));
    expect(sortByIndustry(rows, "pets").map((r) => r.key)).toEqual(rows.map((r) => r.key));
  });
});

describe("pageTemplates", () => {
  it("lists All by relevance then newest, pages, with the industry's tab first", () => {
    const first = pageTemplates(rows, { page: 1, category: "all", industryId: "electronics", pageSize: 2 });
    expect(first.items.map((r) => r.key)).toEqual(["volt", "techhub"]);
    expect(first).toMatchObject({ page: 1, pageCount: 3, total: 5, categories: ["electronics", "general", "fashion"] });
    expect(pageTemplates(rows, { page: 3, category: "all", industryId: "electronics", pageSize: 2 }).items.map((r) => r.key)).toEqual(["classic"]);
    // The store's industry leads even when other templates are newer; a store seed no longer shuffles.
    expect(pageTemplates(rows, { page: 1, category: "all", industryId: "fashion", seed: "store-1" }).items.map((r) => r.key)).toEqual(["kasr", "mode", "volt", "techhub", "classic"]);
    // No industry: newest first.
    expect(pageTemplates(rows, { page: 1, category: "all" }).items.map((r) => r.key)).toEqual(["volt", "techhub", "kasr", "mode", "classic"]);
  });

  it("filters by category before paging", () => {
    const fashion = pageTemplates(rows, { page: 1, category: "fashion", pageSize: 1 });
    expect(fashion.items.map((r) => r.key)).toEqual(["kasr"]);
    expect(fashion).toMatchObject({ pageCount: 2, total: 2 });
    expect(fashion.categories).toEqual(["general", "fashion", "electronics"]);
  });

  it("clamps the page to the last one and handles an empty filter", () => {
    expect(pageTemplates(rows, { page: 9, category: "all", pageSize: 2 })).toMatchObject({ page: 3, pageCount: 3 });
    expect(pageTemplates(rows, { page: 2, category: "pets", pageSize: 2 })).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0 });
  });

  it("defaults to the store's industry tab when it has templates, else all", () => {
    const fashion = pageTemplates(rows, { page: 1, category: null, industryId: "fashion" });
    expect(fashion.category).toBe("fashion");
    expect(fashion.items.map((r) => r.key)).toEqual(["kasr", "mode"]);
    expect(pageTemplates(rows, { page: 1, category: null, industryId: "pets" })).toMatchObject({ category: "all", total: 5 });
    expect(pageTemplates(rows, { page: 1, category: null })).toMatchObject({ category: "all", total: 5 });
    expect(pageTemplates(rows, { page: 1, category: "all", industryId: "fashion" })).toMatchObject({ category: "all", total: 5 });
  });
});

describe("URL parsing", () => {
  it("reads ?page= as a 1-based page", () => {
    expect(parseTemplatesPage("3")).toBe(3);
    for (const value of [null, "", "0", "-1", "1.5", "abc", "1e400"]) expect(parseTemplatesPage(value)).toBe(1);
  });

  it("reads ?category= as an id or all", () => {
    expect(parseTemplatesCategory("fashion")).toBe("fashion");
    for (const value of [null, "", "<script>", "a".repeat(65)]) expect(parseTemplatesCategory(value)).toBe("all");
  });
});

describe("sortByIndustry with a store seed", () => {
  const many = [
    { key: "classic", category: "general" },
    ...["a", "b", "c", "d", "e", "f"].map((k) => ({ key: `fashion-${k}`, category: "fashion" })),
    ...["a", "b", "c"].map((k) => ({ key: `jewel-${k}`, category: "jewelry" })),
    ...["a", "b", "c"].map((k) => ({ key: `tech-${k}`, category: "electronics" })),
  ];

  it("puts the store's industry, then related industries, first", () => {
    const sorted = sortByIndustry(many, "fashion", "store-1");
    expect(sorted.slice(0, 6).every((r) => r.category === "fashion")).toBe(true);
    expect(sorted.slice(6, 9).every((r) => r.category === "jewelry")).toBe(true);
    expect(categoryOrder(many.map((r) => r.category), "fashion")).toEqual(["fashion", "jewelry", "general", "electronics"]);
  });

  it("is stable for one store and keeps every template", () => {
    const a = sortByIndustry(many, "fashion", "store-1").map((r) => r.key);
    expect(sortByIndustry(many, "fashion", "store-1").map((r) => r.key)).toEqual(a);
    expect([...a].sort()).toEqual(many.map((r) => r.key).sort());
  });

  it("gives different stores different orders inside a category", () => {
    const firsts = new Set(Array.from({ length: 20 }, (_, i) => sortByIndustry(many, "fashion", `store-${i}`)[0]!.key));
    expect(firsts.size).toBeGreaterThan(2);
  });

  it("pages without repeats", () => {
    const seen = [1, 2, 3, 4].flatMap((page) => pageTemplates(many, { page, category: "all", industryId: "fashion", seed: "s", pageSize: 4 }).items.map((r) => r.key));
    expect(new Set(seen).size).toBe(many.length);
  });
});

// Niche editions (ROADMAP F-90): industry → niche → looks.
describe("the niche filter", () => {
  const tshirts = { id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } };
  const dresses = { id: "dresses", name: { ar: "فساتين", en: "Dresses" } };
  const teeShop = { category: { en: "T-shirts", ar: "تيشيرتات" }, name: "Qotna tees", industryId: "fashion" };

  it("serves the tab asked for, else the store's industry when it has templates, else all", () => {
    expect(servedCategory(["fashion", "electronics"], null, "fashion")).toBe("fashion");
    expect(servedCategory(["fashion", "electronics"], null, "pets")).toBe("all");
    expect(servedCategory(["fashion", "electronics"], null, null)).toBe("all");
    expect(servedCategory(["fashion", "electronics"], "electronics", "fashion")).toBe("electronics");
  });

  it("offers no niche when the tab has no edition: no filter, whatever is asked", () => {
    expect(resolveNicheFilter([], null, teeShop)).toBeNull();
    expect(resolveNicheFilter([], "tshirts", teeShop)).toBeNull();
  });

  it("defaults to the store's own niche when the tab offers it", () => {
    expect(resolveNicheFilter([dresses, tshirts], null, teeShop)).toBe("tshirts");
    // The store's niche has no edition yet: all.
    expect(resolveNicheFilter([dresses], null, teeShop)).toBeNull();
    // The words say nothing: all.
    expect(resolveNicheFilter([dresses, tshirts], null, { category: { en: "Fashion", ar: "أزياء وملابس" }, name: "Nour" })).toBeNull();
  });

  it("keeps a niche the seller chose, and treats all, an unknown id and another tab's niche as no filter", () => {
    expect(resolveNicheFilter([dresses, tshirts], "dresses", teeShop)).toBe("dresses");
    expect(resolveNicheFilter([dresses, tshirts], "all", teeShop)).toBeNull();
    expect(resolveNicheFilter([dresses, tshirts], "mobiles", teeShop)).toBeNull();
    expect(resolveNicheFilter([dresses, tshirts], "no-such-niche", teeShop)).toBeNull();
  });

  it("reads ?niche= as an id or all", () => {
    expect(parseTemplatesNiche("pants-jeans")).toBe("pants-jeans");
    for (const value of [null, "", "<script>", "T-Shirts", "-x", "a".repeat(64)]) expect(parseTemplatesNiche(value)).toBe("all");
  });

  it("lists only the niche's looks on a niche tab, best look first, like a category filter", () => {
    const withNiche = pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: ["mode", "kasr"] });
    expect(withNiche.items.map((r) => r.key)).toEqual(["mode", "kasr"]);
    // Only the niche's looks: the rest of the tab is not listed.
    const one = pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: ["mode"] });
    expect(one.items.map((r) => r.key)).toEqual(["mode"]);
    expect(one.total).toBe(1);
    expect(one.category).toBe("fashion");
    // A look filed under another industry is still in its niche.
    const across = pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: ["volt", "mode"] });
    expect(across.items.map((r) => r.key)).toEqual(["volt", "mode"]);
    expect(across.total).toBe(2);
    // Looks that are not in the gallery are skipped; no repeats across pages.
    const paged = [1, 2].flatMap((page) => pageTemplates(rows, { page, category: "fashion", nicheLooks: ["gone", "mode", "kasr", "mode"], pageSize: 1 }).items.map((r) => r.key));
    expect(paged).toEqual(["mode", "kasr"]);
  });

  it("leaves the list as it is with no niche, and on All", () => {
    expect(pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: [] }).items.map((r) => r.key)).toEqual(["kasr", "mode"]);
    expect(pageTemplates(rows, { page: 1, category: "all", nicheLooks: ["mode"] }).items.map((r) => r.key)).toEqual(
      pageTemplates(rows, { page: 1, category: "all" }).items.map((r) => r.key),
    );
  });
});

describe("cardEdition", () => {
  const card = { key: "kasr", editions: [{ id: "dresses" }, { id: "tshirts" }] };

  it("is none for a template with no editions, whatever the tab", () => {
    expect(cardEdition({}, "tshirts")).toBeNull();
    expect(cardEdition({ editions: [] }, "tshirts")).toBeNull();
  });

  it("is the niche tab's edition when the card has it, else the template's own content", () => {
    expect(cardEdition(card, "tshirts")).toBe("tshirts");
    expect(cardEdition(card, "dresses")).toBe("dresses");
    expect(cardEdition(card, "mobiles")).toBeNull();
    expect(cardEdition(card, null)).toBeNull();
  });
});

describe("one template per niche (ROADMAP F-90)", () => {
  // These pass their own switched set (the real one holds accessories). Real rows: phone-cases → volt and chargers-cables → kabl are ready, earbuds → wasla is pending.
  const SWITCHED = new Set(["mobile-accessories"]);
  const gallery = [
    { key: "volt", category: "mobile-accessories", sortOrder: 60 },
    { key: "kabl", category: "mobile-accessories", sortOrder: 70 },
    { key: "wasla", category: "mobile-accessories", sortOrder: 80 },
    { key: "zaki", category: "electronics", sortOrder: 50 },
    { key: "arena", category: "electronics", sortOrder: 40 },
    { key: "nour", category: "home", sortOrder: 30 },
    { key: "tallaby-classic", category: "general", sortOrder: 1 },
  ];
  const keys = new Set(gallery.map((tpl) => tpl.key));

  it("a switched industry lists one card per ready niche, in niche order, and hides its other templates", () => {
    const visible = galleryTemplates(gallery, SWITCHED);
    expect(visible.map((tpl) => tpl.key)).toEqual(["volt", "kabl", "zaki", "arena", "nour", "tallaby-classic"]);
    const filter = galleryNiches("mobile-accessories", keys, SWITCHED);
    expect(filter.switched).toBe(true);
    expect(filter.niches.map((n) => n.id)).toEqual(["phone-cases", "chargers-cables"]);
    expect(filter.tabLooks).toEqual(["volt", "kabl"]);
    // "All <industry>": every niche card, in niche order (not newest first).
    const all = pageTemplates(visible, { page: 1, category: "mobile-accessories", nicheLooks: filter.looksOf(null), tabLooks: filter.tabLooks });
    expect(all.items.map((tpl) => tpl.key)).toEqual(["volt", "kabl"]);
    // A niche tab: its one card.
    const one = pageTemplates(visible, { page: 1, category: "mobile-accessories", nicheLooks: filter.looksOf("chargers-cables"), tabLooks: filter.tabLooks });
    expect(one.items.map((tpl) => tpl.key)).toEqual(["kabl"]);
    expect(one.total).toBe(1);
  });

  it("a switched industry's cards carry their niche and edition on every tab", () => {
    expect(nicheCards(["volt", "kabl", "zaki"], SWITCHED)).toEqual({
      volt: { niche: "phone-cases", name: expect.objectContaining({ en: expect.any(String) }), edition: "phone-cases" },
      kabl: { niche: "chargers-cables", name: expect.objectContaining({ en: expect.any(String) }), edition: "chargers-cables" },
    });
    const card = nicheCards(["volt"], SWITCHED).volt!;
    expect(cardEdition({ editions: [{ id: "phone-cases" }, { id: "pc-gaming" }] }, "pc-gaming", card)).toBe("phone-cases");
    // A native card (no pack) shows the template's own content.
    expect(cardEdition({ editions: [{ id: "x" }] }, "x", { niche: "wearables", name: { ar: "", en: "" }, edition: null })).toBeNull();
  });

  it("an unswitched industry behaves as before, with the ready niche template first on its niche tab", () => {
    expect(galleryTemplates(gallery).map((tpl) => tpl.key)).toEqual(gallery.map((tpl) => tpl.key));
    expect(nicheCards(["volt", "kabl"])).toEqual({});
    const filter = galleryNiches("electronics", keys);
    expect(filter.switched).toBe(false);
    expect(filter.tabLooks).toBeNull();
    expect(filter.niches.map((n) => n.id)).toEqual(expect.arrayContaining(["pc-gaming", "lighting-smart-home"]));
    // lighting-smart-home: the pack lists nour first; its niche template (zaki, ready) leads.
    expect(filter.looksOf("lighting-smart-home")).toEqual(["zaki", "nour"]);
    expect(filter.looksOf(null)).toEqual([]);
    expect(galleryNiches("all", keys).niches).toEqual([]);
    // The same tab, switched: its ready niche cards in the gallery, in niche order (pc-gaming, then lighting).
    expect(galleryNiches("electronics", keys, new Set(["electronics"])).tabLooks).toEqual(["arena", "zaki"]);
  });
});

describe("accessories, switched to one template per niche (ROADMAP F-90, 2026-11-12)", () => {
  // The real catalog and the real switched set.
  const gallery = galleryTemplates(CODE_TEMPLATES.map((t) => ({ key: t.key, category: t.category })));
  const keys = new Set(gallery.map((tpl) => tpl.key));
  const NICHE_ORDER = ["glasses", "watches", "gold-jewelry", "silver-jewelry", "fashion-jewelry", "hair-accessories", "belts-wallets"];
  const LOOKS = ["karat", "saat", "jewelry-luxe", "fadda", "zahra", "kholkhal", "jewelry-warm"];

  it("shows seven niche cards, one per niche, in niche order", () => {
    const filter = galleryNiches("jewelry", keys);
    expect(filter.switched).toBe(true);
    expect(filter.niches.map((n) => n.id)).toEqual(NICHE_ORDER);
    expect(filter.tabLooks).toEqual(LOOKS);
    const all = pageTemplates(gallery, { page: 1, category: "jewelry", nicheLooks: filter.looksOf(null), tabLooks: filter.tabLooks });
    expect(all.items.map((tpl) => tpl.key)).toEqual(LOOKS);
    expect(all.total).toBe(7);
    for (const [i, niche] of NICHE_ORDER.entries()) expect(filter.looksOf(niche), niche).toEqual([LOOKS[i]]);
  });

  it("names each card's niche and applies its edition; fadda is native", () => {
    const cards = nicheCards(LOOKS);
    expect(Object.keys(cards)).toEqual(LOOKS);
    for (const [i, key] of LOOKS.entries()) expect(cards[key]!.niche, key).toBe(NICHE_ORDER[i]);
    expect(cards.fadda!.edition).toBeNull();
    expect(cards.zahra!.edition).toBe("fashion-jewelry");
    expect(cards.karat!.name.en).toEqual(expect.any(String));
    // The deleted templates are not in the gallery.
    for (const key of ["lulu", "mahr", "jewelry-bold"]) expect(keys.has(key), key).toBe(false);
    expect(gallery.filter((tpl) => tpl.category === "jewelry").map((tpl) => tpl.key).sort()).toEqual([...LOOKS].sort());
  });
});

describe("templatePreviewTabUrl", () => {
  const origin = "https://tallaby.com";
  it("opens the full-page preview in the dialog's language, home page without a slug", () => {
    expect(templatePreviewTabUrl(origin, "ar", "kasr", { slug: "home", isHome: true }, null)).toBe("https://tallaby.com/template-preview/kasr");
    expect(templatePreviewTabUrl(origin, "en", "kasr", null, null)).toBe("https://tallaby.com/en/template-preview/kasr");
  });

  it("keeps the page shown and the niche edition", () => {
    expect(templatePreviewTabUrl(origin, "ar", "vella", { slug: "about", isHome: false }, "dresses")).toBe("https://tallaby.com/template-preview/vella/about?edition=dresses");
    expect(templatePreviewTabUrl(origin, "en", "vella", { slug: "product", isHome: false }, null)).toBe("https://tallaby.com/en/template-preview/vella/product");
  });
});
