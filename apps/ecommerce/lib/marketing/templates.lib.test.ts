import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES, NICHES, getEdition, isRetiredTemplate, readyNicheTemplate } from "@workspace/store-sections/templates";
import { buildGallery, buildNicheTabs, categoryCode, galleryCards, localized, nicheEntries, pickEdition, tabEdition, templateFrameSrc, type CatalogTemplate, type GalleryNicheTab } from "./templates.lib";

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

  it("lists a template's niche editions in the page's language, and none by default", () => {
    const editions = [{ id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } }];
    expect(buildGallery([row({ editions })], "en")[0]!.editions).toEqual([{ id: "tshirts", name: "T-shirts" }]);
    expect(buildGallery([row({ editions })], "ar")[0]!.editions).toEqual([{ id: "tshirts", name: "تيشيرتات" }]);
    expect(buildGallery([row({})], "ar")[0]!.editions).toEqual([]);
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
    // A niche edition (ROADMAP F-90) rides as ?edition=.
    expect(templateFrameSrc("ar", "kasr", undefined, false, "dresses")).toBe("/template-preview/kasr?edition=dresses");
    expect(templateFrameSrc("en", "kasr", "about", true, "pants-jeans")).toBe("/en/template-preview/kasr/about?thumb=1&edition=pants-jeans");
    expect(templateFrameSrc("ar", "kasr", undefined, false, null)).toBe("/template-preview/kasr");
  });

  it("localizes JSON names with a fallback", () => {
    expect(localized({ ar: "أ", en: "A" }, "en")).toBe("A");
    expect(localized({ ar: "أ" }, "en")).toBe("أ");
    expect(localized(null, "ar")).toBeNull();
    expect(categoryCode("fashion")).toBe("fa");
    expect(categoryCode("other")).toBe("ge");
  });
});

// Niche editions (ROADMAP F-90): niches are gallery filters, like categories (owner request 2026-11-11).
describe("niche tabs", () => {
  const dresses = { id: "dresses", industry: "fashion", name: { ar: "فساتين", en: "Dresses" }, looks: ["fashion-luxe", "vella", "kasr"] };
  const sneakers = { id: "sneakers", industry: "shoes-bags", name: { ar: "سنيكرز", en: "Sneakers" }, looks: ["stride"] };
  const watches = { id: "watches", industry: "jewelry", name: { ar: "ساعات", en: "Watches" }, looks: ["gone"] };

  it("files each niche under its industry's category code, in the page's language", () => {
    const tabs = buildNicheTabs([dresses, sneakers], ["kasr", "vella", "fashion-luxe", "stride"], "en");
    expect(tabs).toEqual([
      { id: "dresses", category: "fa", name: "Dresses", looks: ["fashion-luxe", "vella", "kasr"] },
      { id: "sneakers", category: "fa", name: "Sneakers", looks: ["stride"] },
    ]);
    expect(buildNicheTabs([dresses], ["kasr"], "ar")[0]!.name).toBe("فساتين");
  });

  it("keeps only listed looks, and drops a niche left with none", () => {
    expect(buildNicheTabs([dresses, watches], ["kasr", "vella"], "en")).toEqual([{ id: "dresses", category: "fa", name: "Dresses", looks: ["vella", "kasr"] }]);
  });

  it("lists only a niche tab's templates, best look first; every card without a tab", () => {
    const entries = [{ id: "kasr" }, { id: "mode" }, { id: "vella" }];
    expect(nicheEntries(entries, { looks: ["vella", "kasr"] }).map((e) => e.id)).toEqual(["vella", "kasr"]);
    expect(nicheEntries(entries, null).map((e) => e.id)).toEqual(["kasr", "mode", "vella"]);
  });

  it("reads ?edition= only as one of the template's editions", () => {
    const editions = [{ id: "dresses" }];
    expect(pickEdition(editions, "dresses")).toBe("dresses");
    for (const value of [null, "", "tshirts", "<script>"]) expect(pickEdition(editions, value)).toBeNull();
    expect(pickEdition([], "dresses")).toBeNull();
  });
});

describe("one template per niche (ROADMAP F-90)", () => {
  // These pass their own switched set (the real one holds every industry since 2026-11-12). Real rows: phone-cases → volt and
  // chargers-cables → kabl are ready; "old-cases" is a made-up template that serves no niche.
  const SWITCHED = new Set(["mobile-accessories"]);

  it("leaves out a switched industry's templates that serve no niche; nothing when none is switched", () => {
    const rows = [row({ key: "volt", category: "mobile-accessories" }), row({ key: "old-cases", category: "mobile-accessories" }), row({ key: "zaki", category: "electronics" })];
    expect(buildGallery(rows, "en", (r) => isRetiredTemplate(r, SWITCHED)).map((e) => e.id)).toEqual(["volt", "zaki"]);
    expect(buildGallery(rows, "en", (r) => isRetiredTemplate(r)).map((e) => e.id)).toEqual(["volt", "zaki"]);
    expect(buildGallery(rows, "en", (r) => isRetiredTemplate(r, new Set<string>())).map((e) => e.id)).toEqual(["volt", "old-cases", "zaki"]);
    expect(buildGallery(rows, "en").map((e) => e.id)).toEqual(["volt", "old-cases", "zaki"]);
  });

  it("files a switched niche with its one template and its edition", () => {
    const tabs = buildNicheTabs(
      [
        { id: "phone-cases", industry: "mobile-accessories", name: { ar: "جرابات", en: "Cases" }, looks: ["volt"], switched: true, edition: "phone-cases" },
        { id: "wearables", industry: "mobile-accessories", name: { ar: "ساعات", en: "Watches" }, looks: ["saa"], switched: true, edition: null },
      ],
      ["volt", "saa"],
      "en",
    );
    expect(tabs).toEqual([
      { id: "phone-cases", category: "ac", name: "Cases", looks: ["volt"], switched: true, edition: "phone-cases" },
      { id: "wearables", category: "ac", name: "Watches", looks: ["saa"], switched: true, edition: null },
    ]);
    expect(tabs.map(tabEdition)).toEqual(["phone-cases", null]);
    expect(tabEdition({ id: "dresses" })).toBe("dresses");
  });

  const entries = [
    { id: "kabl", category: "ac" },
    { id: "glow", category: "ac" },
    { id: "volt", category: "ac" },
    { id: "kasr", category: "fa" },
    { id: "vella", category: "fa" },
  ];
  const switchedTabs: GalleryNicheTab[] = [
    { id: "phone-cases", category: "ac", name: "Cases", looks: ["volt"], switched: true, edition: "phone-cases" },
    { id: "chargers-cables", category: "ac", name: "Chargers", looks: ["kabl"], switched: true, edition: "chargers-cables" },
  ];
  const dresses: GalleryNicheTab = { id: "dresses", category: "fa", name: "Dresses", looks: ["vella", "kasr"] };
  const tabs = [...switchedTabs, dresses];
  const ids = (cards: { entry: { id: string } }[]) => cards.map((c) => c.entry.id);

  it("a switched category lists its niche cards first, in niche order, each with its niche", () => {
    const all = galleryCards(entries, tabs, "ac", null);
    expect(ids(all)).toEqual(["volt", "kabl", "glow"]);
    expect(all.map((c) => [c.edition, c.tag])).toEqual([
      ["phone-cases", "Cases"],
      ["chargers-cables", "Chargers"],
      [null, null],
    ]);
    const one = galleryCards(entries, tabs, "ac", "chargers-cables");
    expect(one).toEqual([{ entry: entries[0], edition: "chargers-cables", tag: "Chargers" }]);
    // The "all" tab keeps its order; a switched niche's template still shows its niche.
    const everything = galleryCards(entries, tabs, "all", null);
    expect(ids(everything)).toEqual(entries.map((e) => e.id));
    expect(everything.find((c) => c.entry.id === "volt")).toMatchObject({ edition: "phone-cases", tag: "Cases" });
  });

  it("an unswitched category behaves as before", () => {
    expect(galleryCards(entries, tabs, "fa", null).map((c) => [c.entry.id, c.edition, c.tag])).toEqual([
      ["kasr", null, null],
      ["vella", null, null],
    ]);
    expect(galleryCards(entries, tabs, "fa", "dresses").map((c) => [c.entry.id, c.edition, c.tag])).toEqual([
      ["vella", "dresses", "Dresses"],
      ["kasr", "dresses", "Dresses"],
    ]);
    // Without switched tabs nothing changes anywhere.
    expect(ids(galleryCards(entries, [dresses], "ac", null))).toEqual(["kabl", "glow", "volt"]);
    expect(galleryCards(entries, [dresses], "all", null).every((c) => c.edition === null && c.tag === null)).toBe(true);
  });
});

// Accessories switched on 2026-11-12: the real catalog and switched set, built as templates.server.ts builds them.
describe("accessories gallery, one template per niche (ROADMAP F-90)", () => {
  const gallery = buildGallery(
    CODE_TEMPLATES.map((t) => row({ key: t.key, category: t.category })),
    "en",
    (r) => isRetiredTemplate(r),
  );
  const niches = NICHES.filter((n) => n.industry === "jewelry").flatMap((niche) => {
    const found = readyNicheTemplate(niche.id);
    return found ? [{ id: niche.id, industry: niche.industry, name: niche.name, looks: [found.template], switched: true as const, edition: found.edition ?? null }] : [];
  });
  const tabs = buildNicheTabs(niches, gallery.map((e) => e.id), "en");

  it("shows seven niche cards on ?category=jw, each with its niche tag and edition; fadda native", () => {
    const cards = galleryCards(gallery, tabs, "jw", null);
    expect(cards.map((c) => [c.entry.id, c.edition])).toEqual([
      ["karat", "glasses"],
      ["saat", "watches"],
      ["jewelry-luxe", "gold-jewelry"],
      ["fadda", null],
      ["zahra", "fashion-jewelry"],
      ["kholkhal", "hair-accessories"],
      ["jewelry-warm", "belts-wallets"],
    ]);
    expect(cards.map((c) => c.tag)).toEqual(niches.map((n) => n.name.en));
    for (const card of cards) if (card.edition) expect(getEdition(card.edition)?.looks, card.entry.id).toEqual([card.entry.id]);
  });

  it("a niche tab holds its one card; the deleted templates are gone", () => {
    expect(galleryCards(gallery, tabs, "jw", "watches").map((c) => [c.entry.id, c.edition, c.tag])).toEqual([["saat", "watches", tabs.find((t) => t.id === "watches")!.name]]);
    for (const key of ["lulu", "mahr", "jewelry-bold"]) expect(gallery.some((e) => e.id === key), key).toBe(false);
  });
});

// Every industry switched on 2026-11-12 (owner: map all niches now, delete the rest).
describe("whole gallery, one template per niche (ROADMAP F-90, 2026-11-12)", () => {
  const gallery = buildGallery(
    CODE_TEMPLATES.map((t) => row({ key: t.key, category: t.category })),
    "en",
    (r) => isRetiredTemplate(r),
  );
  const niches = NICHES.flatMap((niche) => {
    const found = readyNicheTemplate(niche.id);
    return found ? [{ id: niche.id, industry: niche.industry, name: niche.name, looks: [found.template], switched: true as const, edition: found.edition ?? null }] : [];
  });
  const tabs = buildNicheTabs(niches, gallery.map((e) => e.id), "en");

  it("has one tab per niche (83) and 84 templates: one per niche and Tallaby Classic", () => {
    expect(tabs).toHaveLength(83);
    expect(gallery).toHaveLength(84);
    for (const key of ["kettan", "nour", "mobilia", "kohl", "pace", "drive", "gifts-bold"]) expect(gallery.some((e) => e.id === key), key).toBe(false);
  });

  it("every niche tab holds its one card, tagged with the niche", () => {
    for (const tab of tabs) {
      const cards = galleryCards(gallery, tabs, tab.category, tab.id);
      expect(cards.map((c) => [c.entry.id, c.tag]), tab.id).toEqual([[tab.looks[0], tab.name]]);
    }
  });
});
