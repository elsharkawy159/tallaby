/**
 * Niche editions (ROADMAP F-90, plan §4): every registered pack passes
 * `validateEdition` on each of its looks, and `editionTemplate`,
 * `applyEdition` and `validateEdition` do what they say, shown with one
 * fixture pack (`tshirts.fixture.ts`: a t-shirt shop on `fashion-luxe`,
 * with that template's own Pexels photos).
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../../config/schema";
import { collectCatalogQueries } from "../../core/registry";
import { getDesign } from "../../designs";
import { L } from "../../designs/_kit";
import { storeSectionRegistry } from "../../sections";
import { fromLibrary } from "../_library";
import { CODE_TEMPLATES, getCodeTemplate } from "../catalog";
import { resolveDemoCatalog } from "../demo-catalog";
import { pexels } from "../library-template";
import { applyEdition, editionTemplate, isEditionReady, lookSlots, missingSlots } from "./apply";
import { TSHIRTS } from "./tshirts.fixture";
import { EDITIONS, editionReadyLooks, editionsForLook, editionsForNiche, getEdition } from "./index";
import type { Edition, LookSlot } from "./types";
import { EDITION_PHOTO_HOSTS, sharedPhotos, validateEdition } from "./validate";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);

// ── The registry ────────────────────────────────────────────────────────────

describe("registered editions", () => {
  it("has one pack per niche, each a real niche on real templates", async () => {
    const niches = EDITIONS.map((edition) => edition.niche);
    expect(niches.filter((niche, i) => niches.indexOf(niche) !== i)).toEqual([]);
    const { NICHES } = await import("./niches");
    const known = new Set(NICHES.map((niche) => niche.id));
    expect(niches.filter((niche) => !known.has(niche))).toEqual([]);
    for (const edition of EDITIONS) {
      expect(edition.looks.length, edition.niche).toBeGreaterThan(0);
      for (const look of edition.looks) expect(getCodeTemplate(look), `${edition.niche}: look "${look}"`).toBeDefined();
    }
  });

  it("shares no photo between two packs", () => {
    expect(sharedPhotos(EDITIONS)).toEqual([]);
  });

  // Every pack on every look it lists: a look that is not edition-ready yet is a problem too.
  const pairs: [name: string, edition: Edition | null, look: string][] = EDITIONS.flatMap((edition) => edition.looks.map((look): [string, Edition, string] => [`${edition.niche} on ${look}`, edition, look]));
  if (!pairs.length) pairs.push(["(no packs registered yet)", null, ""]);
  it.each(pairs)("%s is valid", (_name, edition, look) => {
    if (!edition) return;
    const problems = validateEdition(edition, getCodeTemplate(look)!);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("lists the edition-ready looks, and finds packs by niche and by look", () => {
    expect(editionReadyLooks()).toContain("fashion-luxe");
    expect(editionReadyLooks().every((key) => CODE_TEMPLATES.some((t) => t.key === key))).toBe(true);
    expect(getEdition("no-such-niche")).toBeUndefined();
    expect(getEdition(null)).toBeUndefined();
    expect(editionsForNiche("no-such-niche")).toEqual([]);
    expect(editionsForLook("kabl-not-converted")).toEqual([]);
    for (const edition of EDITIONS) {
      expect(getEdition(edition.niche)).toBe(edition);
      for (const { look } of editionsForNiche(edition.niche)) expect(editionsForLook(look)).toContain(edition);
    }
  });
});

// ── A fixture pack (tshirts.fixture.ts) ─────────────────────────────────────

/** The fixture with one thing changed. */
const withChange = (change: (edition: Edition) => Edition): Edition => change(structuredClone(TSHIRTS));
const LOOK = getCodeTemplate("fashion-luxe")!;
const problemsOf = (edition: Edition) => validateEdition(edition, LOOK);

// ── editionTemplate ─────────────────────────────────────────────────────────

describe("editionTemplate", () => {
  const base = {
    version: 1,
    name: L("اختبار", "Test"),
    description: L("اختبار", "Test"),
    category: "fashion",
    style: ["minimal"],
    sortOrder: 1,
    palette: [],
    colors: LOOK.config().designSystem.colors,
    fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
    radius: 0,
    demo: TSHIRTS.demo,
    journey: { primary: "newest", rows: [] },
  } as const;
  const lib = (key: string) => (id: string, patch = {}) => fromLibrary(key, getDesign(id)!, patch);

  it("refuses a look that reads a slot it did not declare", () => {
    expect(() =>
      editionTemplate({
        ...base,
        key: "test-undeclared",
        lib: lib("test-undeclared"),
        slots: ["hero.title"],
        defaultContent: { hero: { title: L("عنوان", "Title"), line: L("سطر", "Line") } },
        look: (c) => {
          void c.hero.title;
          void c.hero.line;
          throw new Error("unreachable");
        },
      }),
    ).toThrow('look "test-undeclared" reads slot "hero.line" that it does not declare');
    expect(isEditionReady("test-undeclared")).toBe(false);
  });

  it("refuses default content that lacks a declared slot", () => {
    expect(() =>
      editionTemplate({ ...base, key: "test-missing", lib: lib("test-missing"), slots: ["hero.title", "trust.1"], defaultContent: { hero: { title: L("عنوان", "Title") } }, look: () => ({ header: getDesign("header-topbar")!, footer: getDesign("footer-links")!, pages: [] }) }),
    ).toThrow('look "test-missing": its default content lacks slot "trust.1" for look "test-missing"');
  });

  it("gives a look the store, the tiles and optional slots without a declaration", () => {
    const seen: unknown[] = [];
    const template = editionTemplate({
      ...base,
      key: "test-implicit",
      lib: lib("test-implicit"),
      slots: [],
      optional: ["photos.hero.video"],
      defaultContent: {},
      look: (c) => {
        seen.push(c.store.name.en, c.photos.tiles.length, c.photos.hero?.video);
        return { header: lib("test-implicit")("header-topbar"), footer: lib("test-implicit")("footer-links"), pages: [{ slug: "home", name: L("الرئيسية", "Home"), sections: [] }] };
      },
    });
    expect(seen).toEqual(["Qotna", 4, undefined]);
    expect(template.key).toBe("test-implicit");
    expect(isEditionReady("test-implicit")).toBe(true);
    expect(() => editionTemplate({ ...base, key: "test-implicit", lib: lib("test-implicit"), slots: [], defaultContent: {}, look: () => ({ header: getDesign("header-topbar")!, footer: getDesign("footer-links")!, pages: [] }) })).toThrow("defined twice");
  });

  it("says which slots a content lacks", () => {
    expect(missingSlots({ hero: { title: L("أ", "A") }, trust: [{}], nav: [] }, ["hero", "hero.title", "hero.line", "trust.0", "trust.1", "nav", "photos.look.src"])).toEqual(["hero.line", "trust.1", "nav", "photos.look.src"]);
  });
});

// ── applyEdition ────────────────────────────────────────────────────────────

describe("applyEdition", () => {
  const applied = applyEdition(LOOK, TSHIRTS);
  const config = applied.config();
  const home = config.pages.find((p) => p.isHome)!.content.sections;
  // The built site and its preview store (the definition keeps the look's own name and description).
  const json = JSON.stringify({ config, demo: applied.demo, pageNames: applied.pageNames });
  const section = (id: string) => home.find((s) => s.id === id)!;

  it("keeps the look: its key, version, design system and section list", () => {
    const own = LOOK.config();
    expect(applied.key).toBe("fashion-luxe");
    expect(applied.version).toBe(LOOK.version);
    expect(applied.edition).toBe("tshirts");
    expect(LOOK.edition).toBeUndefined();
    expect(config.designSystem.colors).toEqual(own.designSystem.colors);
    expect(config.designSystem.typography).toEqual(own.designSystem.typography);
    expect(config.pages.map((p) => [p.slug, p.content.sections.map((s) => s.source)])).toEqual(own.pages.map((p) => [p.slug, p.content.sections.map((s) => s.source)]));
    // Every section is still a library ref of the same design: nothing is forked.
    expect(applied.designs.map((d) => d.libraryRef?.key)).toEqual(LOOK.designs.map((d) => d.libraryRef?.key));
  });

  it("changes the catalog, with each category's tile as its photo", () => {
    expect(applied.demo.store.name).toEqual(L("قطنة", "Qotna"));
    expect(applied.demo.products).toEqual(TSHIRTS.demo.products);
    expect(applied.demo.categories.map((c) => c.name.en)).toEqual(["Plain tees", "Shirts & polos", "Sweatshirts & knits", "Bags & extras"]);
    expect(applied.demo.categories.map((c) => c.image)).toEqual(TSHIRTS.photos.tiles);
    expect(LOOK.demo.categories.map((c) => c.image)).not.toEqual(TSHIRTS.photos.tiles);
  });

  it("changes the hero copy, the photos and the product stage", () => {
    const hero = JSON.stringify(section("fashion-luxe-hero-video"));
    expect(hero).toContain("Tees that last for years");
    expect(hero).toContain("تيشيرت يعيش معاك سنين");
    expect(hero).toContain("Shop the tees");
    expect(hero).not.toContain("Quiet pieces, made to last");
    expect(JSON.stringify(section("fashion-luxe-about-two-tone"))).toContain(TSHIRTS.photos.banner);
    const dots = walk(section("fashion-luxe-gallery-shop-look").componentTree).filter((n) => n.type === "hotspot");
    expect(dots.map((n) => ({ x: n.props.x, y: n.props.y }))).toEqual(TSHIRTS.photos.look!.dots);
    expect(config.designSystem.spacing.productStage).toEqual({ ratio: "4:5", fit: "contain" });
    expect(LOOK.config().designSystem.spacing.productStage).toEqual({ ratio: "1:1", fit: "cover" });
  });

  it("changes the product row titles: the main grid's copy, and the category rows read the pack's categories", () => {
    const grid = JSON.stringify(section("fashion-luxe-products-grid"));
    expect(grid).toContain("Best-selling tees");
    expect(grid).not.toContain("Most-loved pieces");
    // Rows 3 and 4 are bound to category places, so their titles and products are the pack's 3rd and 4th categories.
    const rows = [section("fashion-luxe-category-row-3"), section("fashion-luxe-category-row-4")];
    const catalog = resolveDemoCatalog(collectCatalogQueries(rows, storeSectionRegistry), applied.demo, "en");
    const lists = rows.map((row) => walk(row.componentTree).find((n) => n.type === "productList")!);
    expect(lists.map((list) => list.props.categoryIndex)).toEqual([3, 4]);
    expect(lists.map((list) => catalog.products[list.id]!.map((p) => p.title))).toEqual([
      ["Cable Crew Sweatshirt", "Navy Stripe Crew", "Soft Cardigan", "Ribbed Cardigan"],
      ["Beige Tote", "Pink Tote", "Burgundy Tote", "Floral Embroidered Bag"],
    ]);
    expect(catalog.categories.slice(2).map((c) => c.name)).toEqual(["Sweatshirts & knits", "Bags & extras"]);
  });

  it("leaves none of the look's own store in the built site", () => {
    for (const word of ["Hareer", "حرير", "telier", "أتيليه", "Garden City", "جاردن سيتي"]) expect(json.includes(word), word).toBe(false);
    expect(applied.pageNames.about).toEqual(L("عن قطنة", "About"));
  });

  it("merges the pack's product page copy over the look's", () => {
    expect(applied.productPageSpec?.copy).toEqual({ reviews: L("رأي اللي لبسوه", "From people who wear it"), related: LOOK.productPageSpec!.copy!.related });
    expect(applied.productPageSpec?.surface).toBe("flat");
  });

  it("follows the pack's journey and adds its extras in their fixed places", () => {
    const other = applyEdition(
      LOOK,
      withChange((e) => ({
        ...e,
        journey: { primary: "newest", rows: [1, 2] },
        extras: [
          { slot: "before-newsletter", design: "testimonials-classic" },
          { slot: "after-products", design: "text-statement" },
        ],
      })),
    );
    const sections = other.config().pages[0]!.content.sections;
    const ids = sections.map((s) => s.id);
    expect(ids.indexOf("fashion-luxe-edition-text-statement")).toBe(ids.indexOf("fashion-luxe-products-grid") + 1);
    expect(ids.indexOf("fashion-luxe-edition-testimonials-classic")).toBe(ids.indexOf("fashion-luxe-newsletter-ruled") - 1);
    expect(ids).toContain("fashion-luxe-category-row-1");
    expect(ids).toContain("fashion-luxe-category-row-2");
    const grid = sections.find((s) => s.id === "fashion-luxe-products-grid")!;
    const nodes = walk(grid.componentTree);
    expect(nodes.find((n) => n.type === "productList")!.props.source).toBe("newest");
    expect(nodes.some((n) => n.props.href === "/products?sort=newest")).toBe(true);
  });

  it("shows the poster alone when the pack has no hero video", () => {
    const still = applyEdition(
      LOOK,
      withChange((e) => ({ ...e, photos: { ...e.photos, hero: { wide: e.photos.hero.wide, tall: e.photos.hero.tall } } })),
    );
    const video = walk(still.config().pages[0]!.content.sections[0]!.componentTree).find((n) => n.props.role === "video")!;
    expect(video.props.poster ?? video.props.src ?? JSON.stringify(video.props)).toContain("8580858");
    expect(JSON.stringify(video.props)).not.toContain(".mp4");
  });

  it("throws a clear error for a template that is not edition-ready, a pack not approved on the look, a missing slot and a wrong journey", () => {
    const notReady = CODE_TEMPLATES.find((t) => !isEditionReady(t.key))!;
    expect(() => applyEdition(notReady, TSHIRTS)).toThrow(`applyEdition: template "${notReady.key}" is not edition-ready`);
    expect(() => applyEdition(LOOK, { ...TSHIRTS, looks: ["vella"] })).toThrow('applyEdition: edition "tshirts" is not approved on look "fashion-luxe"');
    const noLook = withChange((e) => {
      const { look: _photo, ...photos } = e.photos;
      const { look: _copy, labels: _labels, ...copy } = e.copy;
      return { ...e, photos, copy };
    });
    expect(() => applyEdition(LOOK, noLook)).toThrow(
      'edition "tshirts" lacks slots "labels.about", "look", "photos.look.src", "photos.look.dots.0", "photos.look.dots.1", "photos.look.dots.2" for look "fashion-luxe"',
    );
    expect(() => applyEdition(LOOK, withChange((e) => ({ ...e, journey: { rows: [1] } })))).toThrow('journey.rows has 1 places, look "fashion-luxe" has 2 category rows');
    expect(() => applyEdition(LOOK, withChange((e) => ({ ...e, journey: { rows: [1, 5] } })))).toThrow("journey.rows 5 is outside its 4 categories");
    expect(() => applyEdition(LOOK, withChange((e) => ({ ...e, extras: [{ slot: "after-products", design: "no-such-design" }] })))).toThrow('extra "no-such-design" is not a section library design');
  });

  it("declares every slot fashion-luxe needs", () => {
    expect(lookSlots("fashion-luxe")).toContain("photos.look.src");
    expect(lookSlots("kabl-not-converted")).toEqual([]);
  });
});

// ── Custom slots ────────────────────────────────────────────────────────────

describe("custom slots", () => {
  const spec = {
    version: 1,
    name: L("اختبار", "Test"),
    description: L("اختبار", "Test"),
    category: "fashion",
    style: ["minimal"],
    sortOrder: 1,
    palette: [],
    colors: LOOK.config().designSystem.colors,
    fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
    radius: 0,
    demo: TSHIRTS.demo,
    journey: { primary: "newest", rows: [] },
  } as const;
  const lib = (id: string, patch = {}) => fromLibrary("test-custom", getDesign(id)!, patch);
  const seen: unknown[] = [];
  const template = editionTemplate({
    ...spec,
    key: "test-custom",
    lib,
    dark: true,
    slots: ["custom.finder-title", "photos.custom.banner-2"],
    optional: ["custom.finder-note"],
    defaultContent: { custom: { "finder-title": L("بتدور على إيه؟", "What are you after?") }, photos: { custom: { "banner-2": pexels(1, 800) } } },
    look: (c) => {
      seen.push(c.custom["finder-title"]!.en, c.custom["finder-note"]?.en, c.photos.custom["banner-2"]);
      return { header: lib("header-topbar"), footer: lib("footer-links"), pages: [{ slug: "home", name: L("الرئيسية", "Home"), sections: [] }] };
    },
  });
  const pack = (change: (e: Edition) => Edition = (e) => e) =>
    change(withChange((e) => ({ ...e, looks: ["test-custom"], copy: { ...e.copy, custom: { "finder-title": L("عايز أنهي قَصّة؟", "Which fit do you want?") } }, photos: { ...e.photos, custom: { "banner-2": pexels(15557045, 1600) } } })));

  it("gives a look its declared custom copy and photos, from its defaults and from a pack", () => {
    expect(seen).toEqual(["What are you after?", undefined, pexels(1, 800)]);
    applyEdition(template, pack());
    expect(seen.slice(3)).toEqual(["Which fit do you want?", undefined, pexels(15557045, 1600)]);
    // A dark look reads the pack's dark custom photo over its light one, key by key.
    applyEdition(template, pack((e) => ({ ...e, photos: { ...e.photos, dark: { custom: { other: pexels(2, 800) } } } })));
    expect(seen.at(-1)).toBe(pexels(15557045, 1600));
    applyEdition(template, pack((e) => ({ ...e, photos: { ...e.photos, dark: { custom: { "banner-2": pexels(2, 800) } } } })));
    expect(seen.at(-1)).toBe(pexels(2, 800));
  });

  it("names a custom slot a pack lacks, and refuses an undeclared custom read", () => {
    expect(() => applyEdition(template, { ...TSHIRTS, looks: ["test-custom"] })).toThrow('edition "tshirts" lacks slots "custom.finder-title", "photos.custom.banner-2" for look "test-custom"');
    expect(() =>
      editionTemplate({ ...spec, key: "test-custom-undeclared", lib, slots: ["custom.a"], defaultContent: { custom: { a: L("أ", "A"), b: L("ب", "B") } }, look: (c) => (void c.custom.b, { header: lib("header-topbar"), footer: lib("footer-links"), pages: [] }) }),
    ).toThrow('look "test-custom-undeclared" reads slot "custom.b" that it does not declare');
  });

  it("keeps slot paths typed: a custom key is free, a misspelt named slot is not", () => {
    const ok: LookSlot[] = ["custom.anything-here", "photos.custom.banner-2", "hero.title"];
    // @ts-expect-error "hero.titel" is not a slot
    const bad: LookSlot = "hero.titel";
    expect([...ok, bad]).toHaveLength(4);
  });

  it("validates custom copy and photos like the rest", () => {
    const check = (e: Edition) => validateEdition(e, LOOK);
    const onLook = (e: Edition): Edition => ({ ...e, looks: ["fashion-luxe"] });
    expect(check(onLook(pack()))).toEqual([]);
    expect(check(onLook(pack((e) => ((e.copy.custom!["finder-title"]!.en = ""), e))))).toContain("copy.custom.finder-title: the English is empty");
    expect(check(onLook(pack((e) => ({ ...e, copy: { ...e.copy, custom: { deal: L("كوبون للكل", "A coupon for all") } } }))))).toContain('copy.custom.deal: reads as an offer or discount ("كوبون للكل")');
    expect(check(onLook(pack((e) => ({ ...e, photos: { ...e.photos, custom: { "banner-2": "https://cdn.example.com/a.jpg" } } }))))).toContain("photos.custom.banner-2: the photo is on cdn.example.com, not on images.pexels.com");
    expect(check(onLook(pack((e) => ({ ...e, photos: { ...e.photos, custom: { "banner-2": e.photos.banner } } }))))[0]).toMatch(/^photos.custom.banner-2 uses the same photo as photos.banner/);
    expect(check(onLook(pack((e) => ({ ...e, photos: { ...e.photos, dark: { custom: { "banner-2": "http://images.pexels.com/x.jpg" } } } }))))).toContain("photos.dark.custom.banner-2: the photo is not https");
  });
});

// ── validateEdition ─────────────────────────────────────────────────────────

describe("validateEdition", () => {
  it("passes the fixture pack on fashion-luxe", () => {
    expect(problemsOf(TSHIRTS)).toEqual([]);
    expect(EDITION_PHOTO_HOSTS).toContain("images.pexels.com");
  });

  const product = (e: Edition, slug: string) => e.demo.products.find((p) => p.slug === slug)!;
  const broken: [name: string, edition: Edition, problem: string | RegExp][] = [
    ["too few categories", withChange((e) => ({ ...e, demo: { ...e.demo, categories: e.demo.categories.slice(0, 3) } })), "has 3 categories (4–8)"],
    ["too few products", withChange((e) => ({ ...e, demo: { ...e.demo, products: e.demo.products.slice(0, 11) } })), "has 11 products (12–24)"],
    ["a product in no real category", withChange((e) => ((product(e, "zip-polo").categoryId = "demo-hats"), e)), 'product zip-polo is in "demo-hats", which is not one of its categories'],
    [
      "a category with two products",
      withChange((e) => {
        for (const slug of ["pink-tote", "burgundy-tote"]) product(e, slug).categoryId = "demo-plain";
        return e;
      }),
      "category demo-totes has 2 products (at least 3)",
    ],
    ["a stale product count", withChange((e) => ((e.demo.categories[0]!.productCount = 9), e)), "category demo-plain says 9 products, it has 4"],
    ["a price outside the band", withChange((e) => ((product(e, "floral-bag").price = 90000), e)), "product floral-bag costs 90000 EGP, outside 200–6000"],
    ["a compare-at price below the price", withChange((e) => ((product(e, "floral-bag").compareAtPrice = 100), e)), "product floral-bag has a compare-at price that is not above its price"],
    ["empty English", withChange((e) => ((e.copy.story.title.en = " "), e)), "copy.story.title: the English is empty"],
    ["English on the Arabic side", withChange((e) => ((e.copy.trust[2]!.line.ar = "Pre-washed"), e)), 'copy.trust[2].line: the Arabic side has no Arabic ("Pre-washed")'],
    ["Arabic on the English side", withChange((e) => ((product(e, "zip-polo").title.en = "بولو"), e)), 'product zip-polo: the English side has Arabic ("بولو")'],
    ["a hero title of seven words", withChange((e) => ((e.copy.hero.title.en = "Tees that last for years and years"), e)), "copy.hero.title.en has 7 words (at most 6)"],
    ["a discount in the copy", withChange((e) => ((e.copy.newsletter.title.en = "Get 10% off your first order"), e)), 'copy.newsletter.title: reads as an offer or discount ("Get 10% off your first order")'],
    ["a coupon in Arabic", withChange((e) => ((e.copy.announcement[1]!.ar = "كوبون لأول طلب"), e)), /copy\.announcement\[1\]: reads as an offer or discount/],
    ["two announcement lines", withChange((e) => ({ ...e, copy: { ...e.copy, announcement: e.copy.announcement.slice(0, 2) } })), "copy.announcement has 2 lines (exactly 3)"],
    ["three promises", withChange((e) => ({ ...e, copy: { ...e.copy, trust: e.copy.trust.slice(0, 3) } })), "copy.trust has 3 promises (exactly 4)"],
    ["a photo over http", withChange((e) => ((e.photos.banner = e.photos.banner.replace("https:", "http:")), e)), "photos.banner: the photo is not https"],
    ["a photo on another host", withChange((e) => ((product(e, "zip-polo").image = "https://cdn.example.com/polo.jpg"), e)), "product zip-polo: the photo is on cdn.example.com, not on images.pexels.com"],
    ["a product with no photo", withChange((e) => ((product(e, "zip-polo").image = null), e)), "product zip-polo has no photo"],
    ["a photo used twice", withChange((e) => ((e.photos.story = pexels(12025472, 1600)), e)), /^photos\.story uses the same photo as product white-heavy-tee/],
    ["tiles that do not match the categories", withChange((e) => ({ ...e, photos: { ...e.photos, tiles: e.photos.tiles.slice(0, 3) } })), "photos.tiles has 3 photos for 4 categories"],
    ["a category with its own image", withChange((e) => ((e.demo.categories[1]!.image = pexels(1, 800)), e)), "category demo-shirts has its own image: its photo is photos.tiles[1], leave image null"],
    ["variants of an unknown product", withChange((e) => ({ ...e, variants: { "demo-hat": [{ name: L("المقاس", "Size"), values: [L("وسط", "M")] }] } })), 'variants: "demo-hat" is not one of its product ids'],
    ["three extras", withChange((e) => ({ ...e, extras: [1, 2, 3].map(() => ({ slot: "after-products" as const, design: "text-statement" })) })), "has 3 extras (at most 2)"],
    ["a discount section as an extra", withChange((e) => ({ ...e, extras: [{ slot: "after-products", design: "promo-coupon" }] })), 'extra "promo-coupon" is a promotion or discount section'],
    ["a missing slot", withChange((e) => ({ ...e, copy: { ...e.copy, labels: undefined } })), 'does not build on look "fashion-luxe": edition "tshirts" lacks slot "labels.about" for look "fashion-luxe"'],
    [
      "a link to a page the look does not have",
      withChange((e) => ({ ...e, extras: [{ slot: "after-products", design: "about-two-tone", patch: { photo: [undefined, undefined, pexels(27609337, 1600)], links: { "/products": "/size-guide" } } }] })),
      'on look "fashion-luxe", a link goes to no page or catalog route: fashion-luxe-edition-about-two-tone: "/size-guide"',
    ],
    [
      "a copy the section does not hold",
      withChange((e) => ({ ...e, extras: [{ slot: "after-products", design: "text-statement", patch: { text: { "نص غير موجود": L("نص", "Text") } } }] })),
      /^does not build on look "fashion-luxe": /,
    ],
    ["a main grid its catalog cannot fill", withChange((e) => ({ ...e, journey: { primary: "featured" } })), 'on look "fashion-luxe", its catalog does not fill a list: fashion-luxe-products-grid > productList: 1/8 (4 columns)'],
  ];

  it.each(broken)("reports %s", (_name, edition, problem) => {
    const problems = problemsOf(edition);
    expect(problems.some((p) => (typeof problem === "string" ? p === problem : problem.test(p))), problems.join("\n") || "(no problems)").toBe(true);
  });

  it("reports a look that is not edition-ready", () => {
    const notReady = CODE_TEMPLATES.find((t) => !isEditionReady(t.key))!;
    expect(validateEdition(TSHIRTS, notReady)).toEqual([`look "${notReady.key}" is not edition-ready`]);
  });

  it("reports photos two packs share", () => {
    const other = withChange((e) => ({ ...e, niche: "pants-jeans" }));
    expect(sharedPhotos([TSHIRTS])).toEqual([]);
    expect(sharedPhotos([TSHIRTS, other])[0]).toMatch(/^pants-jeans: product white-heavy-tee is also used by the "tshirts" pack/);
  });
});
