import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES, NICHES, NICHE_TEMPLATES } from "@workspace/store-sections/templates";
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
  sortRelevantNewest,
  templatePreviewTabUrl,
  toTemplateCardViews,
} from "./templates.lib";

// `sortOrder`: a higher one is a newer template.
const rows = [
  { key: "classic", category: "general", sortOrder: 10 },
  { key: "mode", category: "fashion", sortOrder: 20 },
  { key: "techhub", category: "electronics", sortOrder: 50 },
  { key: "vogue", category: "fashion", sortOrder: 40 },
  { key: "spark", category: "electronics", sortOrder: 60 },
];

describe("sortRelevantNewest", () => {
  it("puts the industry's templates first, newest first inside each group", () => {
    expect(sortRelevantNewest(rows, { industryId: "electronics" }).map((r) => r.key)).toEqual(["spark", "techhub", "vogue", "mode", "classic"]);
  });

  it("is newest first when the store has no industry or none of its templates", () => {
    const newest = ["spark", "techhub", "vogue", "mode", "classic"];
    expect(sortRelevantNewest(rows).map((r) => r.key)).toEqual(newest);
    expect(sortRelevantNewest(rows, { industryId: "pets" }).map((r) => r.key)).toEqual(newest);
  });

  it("puts the store niche's own template first, even when it is older", () => {
    const list = [...rows, { key: "streetwear", category: "fashion", sortOrder: 1 }];
    expect(sortRelevantNewest(list, { industryId: "fashion", nicheId: "tshirts" }).map((r) => r.key)).toEqual(["streetwear", "vogue", "mode", "spark", "techhub", "classic"]);
  });
});

describe("pageTemplates", () => {
  it("lists All by relevance then newest, pages, with the industry's tab first", () => {
    const first = pageTemplates(rows, { page: 1, category: "all", industryId: "electronics", pageSize: 2 });
    expect(first.items.map((r) => r.key)).toEqual(["spark", "techhub"]);
    expect(first).toMatchObject({ page: 1, pageCount: 3, total: 5, categories: ["electronics", "general", "fashion"] });
    expect(pageTemplates(rows, { page: 3, category: "all", industryId: "electronics", pageSize: 2 }).items.map((r) => r.key)).toEqual(["classic"]);
    // The store's industry leads even when other templates are newer.
    expect(pageTemplates(rows, { page: 1, category: "all", industryId: "fashion" }).items.map((r) => r.key)).toEqual(["vogue", "mode", "spark", "techhub", "classic"]);
    // No industry: newest first.
    expect(pageTemplates(rows, { page: 1, category: "all" }).items.map((r) => r.key)).toEqual(["spark", "techhub", "vogue", "mode", "classic"]);
  });

  it("filters by category before paging", () => {
    const fashion = pageTemplates(rows, { page: 1, category: "fashion", pageSize: 1 });
    expect(fashion.items.map((r) => r.key)).toEqual(["vogue"]);
    expect(fashion).toMatchObject({ pageCount: 2, total: 2 });
    expect(fashion.categories).toEqual(["general", "fashion", "electronics"]);
  });

  it("clamps the page to the last one and handles an empty filter", () => {
    expect(pageTemplates(rows, { page: 9, category: "all", pageSize: 2 })).toMatchObject({ page: 3, pageCount: 3 });
    expect(pageTemplates(rows, { page: 2, category: "pets", pageSize: 2 })).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0 });
  });

  it("opens on All, most relevant first, whatever the store's industry (owner, 2026-11-15)", () => {
    const fashion = pageTemplates(rows, { page: 1, category: null, industryId: "fashion" });
    expect(fashion).toMatchObject({ category: "all", total: 5 });
    expect(fashion.items.map((r) => r.key)).toEqual(["vogue", "mode", "spark", "techhub", "classic"]);
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

describe("relevance across categories and tabs", () => {
  const many = [
    { key: "classic", category: "general" },
    ...["a", "b", "c", "d", "e", "f"].map((k) => ({ key: `fashion-${k}`, category: "fashion" })),
    ...["a", "b", "c"].map((k) => ({ key: `jewel-${k}`, category: "jewelry" })),
    ...["a", "b", "c"].map((k) => ({ key: `tech-${k}`, category: "electronics" })),
  ];

  it("puts the store's industry, then related industries, first, in tabs and cards", () => {
    const sorted = pageTemplates(many, { page: 1, category: "all", industryId: "fashion", pageSize: 100 }).items;
    expect(sorted.slice(0, 6).every((r) => r.category === "fashion")).toBe(true);
    expect(sorted.slice(6, 9).every((r) => r.category === "jewelry")).toBe(true);
    expect(categoryOrder(many.map((r) => r.category), "fashion")).toEqual(["fashion", "jewelry", "general", "electronics"]);
    expect(pageTemplates(many, { page: 1, category: "all", industryId: "fashion" }).categories).toEqual(["fashion", "jewelry", "general", "electronics"]);
  });

  it("puts the niche's template first on its category tab and on a switched tab's list", () => {
    const list = [...many, { key: "streetwear", category: "fashion" }];
    const tab = pageTemplates(list, { page: 1, category: "fashion", industryId: "fashion", nicheId: "tshirts" });
    expect(tab.items[0]!.key).toBe("streetwear");
    const switched = pageTemplates(list, { page: 1, category: "fashion", industryId: "fashion", nicheId: "tshirts", tabLooks: ["fashion-a", "streetwear", "fashion-b"] });
    expect(switched.items.map((r) => r.key)).toEqual(["streetwear", "fashion-a", "fashion-b"]);
  });

  it("pages without repeats", () => {
    const seen = [1, 2, 3, 4].flatMap((page) => pageTemplates(many, { page, category: "all", industryId: "fashion", nicheId: "tshirts", pageSize: 4 }).items.map((r) => r.key));
    expect(new Set(seen).size).toBe(many.length);
  });
});

// Niche editions (ROADMAP F-90): industry → niche → looks.
describe("the niche filter", () => {
  const tshirts = { id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } };
  const dresses = { id: "dresses", name: { ar: "فساتين", en: "Dresses" } };

  it("serves the tab asked for, else all", () => {
    expect(servedCategory(null)).toBe("all");
    expect(servedCategory("electronics")).toBe("electronics");
    expect(servedCategory("all")).toBe("all");
  });

  it("offers no niche when the tab has no edition: no filter, whatever is asked", () => {
    expect(resolveNicheFilter([], null)).toBeNull();
    expect(resolveNicheFilter([], "tshirts")).toBeNull();
  });

  it("never preselects a niche: none asked for is no filter (owner, 2026-11-15)", () => {
    expect(resolveNicheFilter([dresses, tshirts], null)).toBeNull();
    expect(resolveNicheFilter([dresses, tshirts], undefined)).toBeNull();
  });

  it("keeps a niche the seller chose, and treats all, an unknown id and another tab's niche as no filter", () => {
    expect(resolveNicheFilter([dresses, tshirts], "dresses")).toBe("dresses");
    expect(resolveNicheFilter([dresses, tshirts], "all")).toBeNull();
    expect(resolveNicheFilter([dresses, tshirts], "mobiles")).toBeNull();
    expect(resolveNicheFilter([dresses, tshirts], "no-such-niche")).toBeNull();
  });

  it("reads ?niche= as an id or all", () => {
    expect(parseTemplatesNiche("pants-jeans")).toBe("pants-jeans");
    for (const value of [null, "", "<script>", "T-Shirts", "-x", "a".repeat(64)]) expect(parseTemplatesNiche(value)).toBe("all");
  });

  it("lists only the niche's looks on a niche tab, best look first, like a category filter", () => {
    const withNiche = pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: ["mode", "vogue"] });
    expect(withNiche.items.map((r) => r.key)).toEqual(["mode", "vogue"]);
    // Only the niche's looks: the rest of the tab is not listed.
    const one = pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: ["mode"] });
    expect(one.items.map((r) => r.key)).toEqual(["mode"]);
    expect(one.total).toBe(1);
    expect(one.category).toBe("fashion");
    // A look filed under another industry is still in its niche.
    const across = pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: ["spark", "mode"] });
    expect(across.items.map((r) => r.key)).toEqual(["spark", "mode"]);
    expect(across.total).toBe(2);
    // Looks that are not in the gallery are skipped; no repeats across pages.
    const paged = [1, 2].flatMap((page) => pageTemplates(rows, { page, category: "fashion", nicheLooks: ["gone", "mode", "vogue", "mode"], pageSize: 1 }).items.map((r) => r.key));
    expect(paged).toEqual(["mode", "vogue"]);
  });

  it("leaves the list as it is with no niche, and on All", () => {
    expect(pageTemplates(rows, { page: 1, category: "fashion", nicheLooks: [] }).items.map((r) => r.key)).toEqual(["vogue", "mode"]);
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
  // These pass their own switched set (the real one holds every industry since 2026-11-12). Real rows: phone-cases → volt and
  // chargers-cables → kabl are ready, earbuds → wasla shows its own content; "old-cases" is a made-up template that serves no niche.
  const SWITCHED = new Set(["mobile-accessories"]);
  const gallery = [
    { key: "volt", category: "mobile-accessories", sortOrder: 60 },
    { key: "kabl", category: "mobile-accessories", sortOrder: 70 },
    { key: "old-cases", category: "mobile-accessories", sortOrder: 80 },
    { key: "zaki", category: "electronics", sortOrder: 50 },
    { key: "arena", category: "electronics", sortOrder: 40 },
    { key: "rokn", category: "home", sortOrder: 30 },
    { key: "tallaby-classic", category: "general", sortOrder: 1 },
  ];
  const keys = new Set(gallery.map((tpl) => tpl.key));

  it("a switched industry lists one card per ready niche, in niche order, and hides its other templates", () => {
    const visible = galleryTemplates(gallery, SWITCHED);
    expect(visible.map((tpl) => tpl.key)).toEqual(["volt", "kabl", "zaki", "arena", "rokn", "tallaby-classic"]);
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
    const NONE = new Set<string>();
    // Every industry is switched for real: only the made-up template is hidden.
    expect(galleryTemplates(gallery).map((tpl) => tpl.key)).toEqual(gallery.map((tpl) => tpl.key).filter((key) => key !== "old-cases"));
    expect(galleryTemplates(gallery, NONE).map((tpl) => tpl.key)).toEqual(gallery.map((tpl) => tpl.key));
    expect(nicheCards(["volt", "kabl"], NONE)).toEqual({});
    const filter = galleryNiches("electronics", keys, NONE);
    expect(filter.switched).toBe(false);
    expect(filter.tabLooks).toBeNull();
    expect(filter.niches.map((n) => n.id)).toEqual(expect.arrayContaining(["pc-gaming", "lighting-smart-home"]));
    // lighting-smart-home: one pack, one template (nour was deleted on 2026-11-12).
    expect(filter.looksOf("lighting-smart-home")).toEqual(["zaki"]);
    expect(filter.looksOf(null)).toEqual([]);
    expect(galleryNiches("all", keys).niches).toEqual([]);
    // The same tab, switched: its niche cards in the gallery, in niche order (pc-gaming, then lighting).
    expect(galleryNiches("electronics", keys).tabLooks).toEqual(["arena", "zaki"]);
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

describe("every industry switched to one template per niche (ROADMAP F-90, 2026-11-12)", () => {
  // The real catalog and the real switched set.
  const gallery = galleryTemplates(CODE_TEMPLATES.map((t) => ({ key: t.key, category: t.category })));
  const keys = new Set(gallery.map((tpl) => tpl.key));

  it("shows 83 niche cards and Tallaby Classic, nothing else", () => {
    expect(gallery).toHaveLength(84);
    expect(gallery.filter((tpl) => tpl.key !== "tallaby-classic").map((tpl) => tpl.key).sort()).toEqual(NICHE_TEMPLATES.map((row) => row.template).sort());
    for (const key of ["kettan", "nour", "mobilia", "kohl", "pace", "drive", "gifts-bold"]) expect(keys.has(key), key).toBe(false);
  });

  it("every industry tab lists one card per niche, in niche order, with the niche's name", () => {
    for (const industry of new Set(NICHES.map((niche) => niche.industry))) {
      const niches = NICHES.filter((niche) => niche.industry === industry);
      const filter = galleryNiches(industry, keys);
      expect(filter.switched, industry).toBe(true);
      expect(filter.niches.map((n) => n.id), industry).toEqual(niches.map((n) => n.id));
      const looks = niches.map((niche) => NICHE_TEMPLATES.find((row) => row.niche === niche.id)!.template);
      expect(filter.tabLooks, industry).toEqual(looks);
      const all = pageTemplates(gallery, { page: 1, category: industry, nicheLooks: filter.looksOf(null), tabLooks: filter.tabLooks, pageSize: 100 });
      expect(all.items.map((tpl) => tpl.key), industry).toEqual(looks);
      const cards = nicheCards(looks);
      for (const [i, key] of looks.entries()) expect(cards[key]?.niche, key).toBe(niches[i]!.id);
    }
  });

  it("a card with no pack yet shows its template's own content (no edition)", () => {
    // Pure became the skincare edition (5e882698); botanica (haircare) has no pack yet.
    expect(nicheCards(["botanica", "wasla"])).toEqual({
      botanica: { niche: "haircare", name: expect.objectContaining({ en: expect.any(String) }), edition: null },
      wasla: { niche: "earbuds", name: expect.objectContaining({ en: expect.any(String) }), edition: null },
    });
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

describe("toTemplateCardViews", () => {
  const card = (key: string, category: string, sortOrder: number) =>
    ({ key, category, sortOrder, name: { en: key }, description: {}, outline: [], palette: [], formKinds: [], pageNames: {} }) as never;

  it("orders the cards by relevance, newest first inside a group", () => {
    const views = toTemplateCardViews([card("classic", "general", 1), card("vogue", "fashion", 2), card("streetwear", "fashion", 1), card("volt", "electronics", 9)], {
      industryId: "fashion",
      nicheId: "tshirts",
    });
    expect(views.map((view) => view.key)).toEqual(["streetwear", "vogue", "volt", "classic"]);
    expect(toTemplateCardViews([card("a", "general", 1), card("b", "fashion", 2)]).map((view) => view.key)).toEqual(["b", "a"]);
  });
});
