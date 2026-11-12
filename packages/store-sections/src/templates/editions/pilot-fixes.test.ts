/**
 * The fixes the first niche packs asked of the looks (ROADMAP F-90):
 * category rows fitted to the pack's catalog, the reviews section optional
 * in every look, trade-fixed labels a pack can replace, and contact strings
 * that need no Arabic. Each look is built with a filler pack: the fixture
 * catalog with a placeholder for every slot the look declares, and no
 * reviews. The looks' own (default) output is guarded by `look-guard.test.ts`.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode, SiteConfig } from "../../config/schema";
import { L } from "../../designs/_kit";
import { getCodeTemplate } from "../catalog";
import { pexels } from "../library-template";
import type { TemplateDemo } from "../types";
import { applyEdition, categoryListFit, lookSlots } from "./apply";
import { editionReadyLooks } from "./index";
import { TSHIRTS } from "./tshirts.fixture";
import type { Edition, EditionCopy } from "./types";
import { isContactString, validateEdition } from "./validate";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
const T = (name: string) => L(`نص ${name}`, `Text ${name}`);
const link = (name: string) => ({ label: T(name), href: "/products" });

/** Every named slot group a look may read, except `reviews`. */
const FULL_COPY: EditionCopy = {
  ...TSHIRTS.copy,
  products: { primary: { title: T("primary"), line: T("primary line"), eyebrow: T("primary eyebrow"), cta: T("primary cta"), alt: T("primary alt") } },
  newsletter: { title: T("newsletter"), line: T("newsletter line"), eyebrow: T("newsletter eyebrow") },
  labels: { about: T("about"), search: T("search") },
  nav: [link("nav 1"), link("nav 2"), link("nav 3"), link("nav 4")],
  rows: [
    { title: T("row 1"), line: T("row 1 line") },
    { title: T("row 2"), line: T("row 2 line") },
  ],
  help: { title: T("help"), line: T("help line"), points: [T("point 1"), T("point 2"), T("point 3")] },
  finder: { title: T("finder"), line: T("finder line"), options: [link("option 1"), link("option 2"), link("option 3"), link("option 4")] },
  footer: { line: T("footer") },
};

/** The fixture pack on `look`, with a placeholder for every custom slot the look requires. `reviews` is left out. */
function fillerPack(look: string, demo: TemplateDemo = TSHIRTS.demo): Edition {
  const custom: Record<string, { ar: string; en: string }> = {};
  const photos: Record<string, string> = {};
  let photo = 900000;
  for (const slot of lookSlots(look)) {
    if (slot.startsWith("custom.")) custom[slot.slice(7)] = T(slot.slice(7));
    if (slot.startsWith("photos.custom.")) photos[slot.slice(14)] = pexels(photo++, 1200);
  }
  return { ...TSHIRTS, looks: [look], demo, copy: { ...FULL_COPY, custom }, photos: { ...TSHIRTS.photos, about: pexels(899999, 1200), custom: photos } };
}

const build = (look: string, pack: Edition = fillerPack(look)) => applyEdition(getCodeTemplate(look)!, pack).config();
const sections = (config: SiteConfig) => [config.header, config.footer, ...config.pages.flatMap((p) => p.content.sections)].filter((s) => s != null);
const sectionIds = (config: SiteConfig) => sections(config).map((s) => s.id);

/** The fixture catalog with `perCategory` products in each of its four categories. */
function catalog(perCategory: number): TemplateDemo {
  const products = TSHIRTS.demo.categories.flatMap((c) => TSHIRTS.demo.products.filter((p) => p.categoryId === c.id).slice(0, perCategory));
  // The fixture's own order (newest first).
  const kept = TSHIRTS.demo.products.filter((p) => products.includes(p));
  return { ...TSHIRTS.demo, products: kept, categories: TSHIRTS.demo.categories.map((c) => ({ ...c, productCount: perCategory })) };
}

/** Each category row of a built site: `[section id, limit]`. */
function rowLimits(config: SiteConfig): [string, unknown][] {
  return sections(config).flatMap((s) =>
    walk(s.componentTree)
      .filter((n) => n.type === "productList" && n.props.source === "category")
      .map((n): [string, unknown] => [s.id.replace(/^.*-category-row-/, "row "), n.props.limit]),
  );
}

// ── 1. Category rows ────────────────────────────────────────────────────────

describe("category rows fit the pack's catalog", () => {
  const demo = (counts: number[]): TemplateDemo => ({
    store: TSHIRTS.demo.store,
    categories: counts.map((n, i) => ({ id: `c${i + 1}`, name: T(`c${i + 1}`), image: null, productCount: n })),
    products: counts.flatMap((n, i) => Array.from({ length: n }, (_, j) => ({ ...TSHIRTS.demo.products[0]!, id: `p${i}-${j}`, slug: `p${i}-${j}`, categoryId: `c${i + 1}` }))),
  });
  const list = (limit: number | undefined, columns: number | undefined, props: Record<string, unknown> = {}) => ({
    type: "productList",
    props: { source: "category", categoryIndex: 1, ...(limit !== undefined && { limit }), ...props },
    style: columns === undefined ? {} : { columns },
  });

  it("shows full rows of the list's columns, never more than the look's limit", () => {
    const shown = (count: number, limit: number | undefined, columns?: number) => categoryListFit(list(limit, columns), demo([count]))!.shown;
    expect(shown(4, 4, 4)).toBe(4);
    expect(shown(4, 8, 4)).toBe(4);
    expect(shown(7, 8, 4)).toBe(4);
    expect(shown(8, 8, 4)).toBe(8);
    expect(shown(12, 8, 4)).toBe(8);
    expect(shown(6, 4, 4)).toBe(4);
    // No limit on the node is the element's default, 8.
    expect(shown(5, undefined, 4)).toBe(4);
    // A list with no columns (a plain rail) shows what the category holds.
    expect(shown(5, 8)).toBe(5);
    expect(shown(9, 8)).toBe(8);
    // Less than one full row: all it has (the validator refuses the pack).
    expect(shown(3, 8, 4)).toBe(3);
    expect(categoryListFit(list(8, 4), demo([3]))).toEqual({ categoryId: "c1", count: 3, limit: 8, columns: 4, shown: 3 });
  });

  it("leaves every other list alone", () => {
    const store = demo([4, 4]);
    expect(categoryListFit({ type: "productList", props: { source: "best-sellers", limit: 8 }, style: { columns: 4 } }, store)).toBeNull();
    expect(categoryListFit({ type: "productList", props: { source: "newest" } }, store)).toBeNull();
    expect(categoryListFit({ type: "productList", props: { source: "featured", limit: 4 } }, store)).toBeNull();
    expect(categoryListFit({ type: "productList", props: { source: "related", limit: 4 } }, store)).toBeNull();
    expect(categoryListFit({ type: "categoryList", props: { limit: 8 } }, store)).toBeNull();
    expect(categoryListFit(list(8, 4, { categoryId: "c2" }), store)).toBeNull();
    expect(categoryListFit(list(8, 4, { paginate: true }), store)).toBeNull();
    expect(categoryListFit(list(8, 4, { categoryIndex: 2 }), store)!.categoryId).toBe("c2");
  });

  it("keeps each look's own limits in its own build", () => {
    const own = (key: string) => rowLimits(getCodeTemplate(key)!.config()).map(([, limit]) => limit);
    expect(own("fashion-luxe")).toEqual([4, 4]);
    expect(own("vella")).toEqual([4, 8, 4, 4]);
    // `categoryRows` keeps the design's own limit.
    expect(own("jewelry-luxe")).toEqual([8, 8, 8, 8]);
  });

  it("a pack of 16 (4 × 4) gets rows of four on every look with category rows", () => {
    for (const key of ["fashion-luxe", "vella", "jewelry-luxe"]) {
      const limits = rowLimits(build(key, fillerPack(key, catalog(4))));
      expect(limits.length, key).toBe(key === "fashion-luxe" ? 2 : 4);
      expect(limits.map(([, limit]) => limit), key).toEqual(limits.map(() => 4));
    }
  });

  it("stores the fitted limit in the section's library ref too", () => {
    const applied = applyEdition(getCodeTemplate("vella")!, fillerPack("vella", catalog(4)));
    const row = applied.designs.find((d) => d.id === "vella-category-row-2")!;
    expect(row.libraryRef!.patch!.lists).toEqual([{ offset: 1 }, { categoryIndex: 2, limit: 4 }]);
    const own = getCodeTemplate("vella")!.designs.find((d) => d.id === "vella-category-row-2")!;
    expect(own.libraryRef!.patch!.lists).toEqual([{ offset: 1 }, { categoryIndex: 2, limit: 8 }]);
    // jewelry-luxe's rows carry no limit in their patch (the design's is 8): the fitted one is added.
    const jewel = applyEdition(getCodeTemplate("jewelry-luxe")!, fillerPack("jewelry-luxe", catalog(4)));
    expect(jewel.designs.find((d) => d.id === "jewelry-luxe-category-row-3")!.libraryRef!.patch!.lists).toEqual([{ offset: 2 }, { categoryIndex: 3, limit: 4 }]);
  });

  it("a pack of 16 passes the list check on fashion-luxe; a pack of 12 (4 × 3) fails with the category and the row named", () => {
    const look = getCodeTemplate("fashion-luxe")!;
    expect(validateEdition({ ...TSHIRTS, demo: catalog(4) }, look)).toEqual([]);
    const twelve = validateEdition({ ...TSHIRTS, demo: catalog(3) }, look);
    expect(twelve).toEqual([
      'on look "fashion-luxe", category demo-sweats has 3 products, and its row (fashion-luxe-category-row-3) shows 4 across: it needs at least 4 for one full row',
      'on look "fashion-luxe", category demo-totes has 3 products, and its row (fashion-luxe-category-row-4) shows 4 across: it needs at least 4 for one full row',
    ]);
    // It still builds (the gallery shows it): the short rows show the three products they have.
    expect(rowLimits(build("fashion-luxe", { ...TSHIRTS, demo: catalog(3) })).map(([, limit]) => limit)).toEqual([3, 3]);
  });

  it("names every short row of a pack of 12 on vella and jewelry-luxe, and nothing else about its lists", () => {
    for (const key of ["vella", "jewelry-luxe"]) {
      const problems = validateEdition(fillerPack(key, catalog(3)), getCodeTemplate(key)!).filter((p) => p.includes("row") || p.includes("does not fill"));
      const rows = problems.filter((p) => /shows 4 across: it needs at least 4 for one full row$/.test(p));
      expect(rows.length, problems.join("\n")).toBe(4);
      // jewelry-luxe's spotlight shows featured products: that list is the pack's to fill, not a category row.
      expect(problems.filter((p) => !rows.includes(p)).every((p) => p.includes("products-spotlight")), problems.join("\n")).toBe(true);
    }
    const sixteen = validateEdition(fillerPack("vella", catalog(4)), getCodeTemplate("vella")!).filter((p) => p.includes("row") || p.includes("does not fill"));
    expect(sixteen).toEqual([]);
  });

  it("a category of eight fills a row that asks for eight", () => {
    // 8 + 4 + 4 + 4 = 20 products: the fixture's 16 and four more in its first category.
    const extra = [1, 2, 3, 4].map((n) => ({ ...TSHIRTS.demo.products[0]!, id: `demo-extra-${n}`, slug: `extra-${n}` }));
    const demo: TemplateDemo = { ...TSHIRTS.demo, products: [...TSHIRTS.demo.products, ...extra], categories: TSHIRTS.demo.categories.map((c, i) => (i === 0 ? { ...c, productCount: 8 } : c)) };
    // vella's second row asks for 8; put the big category second.
    const pack = { ...fillerPack("vella", demo), journey: { rows: [2, 1, 3, 4] } };
    expect(rowLimits(build("vella", pack))).toEqual([
      ["row 2", 4],
      ["row 1", 8],
      ["row 3", 4],
      ["row 4", 4],
    ]);
  });
});

// ── 2. Reviews are optional ─────────────────────────────────────────────────

describe("a look builds without reviews", () => {
  const reviews: NonNullable<EditionCopy["reviews"]> = {
    title: T("reviews"),
    items: [1, 2, 3, 4].map((n) => ({ quote: L(`«رأي ${n}»`, `«Quote ${n}»`), name: L(`اسم ${n}`, `Name ${n}`) })),
  };
  const withReviews = (look: string, extra: Record<string, { ar: string; en: string }> = {}): Edition => {
    const pack = fillerPack(look);
    const photos = Object.fromEntries([1, 2, 3, 4].map((n) => [`reviews-${n}`, pexels(800000 + n, 800)]));
    return { ...pack, copy: { ...pack.copy, reviews, custom: { ...pack.copy.custom, "reviews-reply": T("reply"), ...extra } }, photos: { ...pack.photos, custom: { ...pack.photos.custom, ...photos } } };
  };

  it("no edition-ready look requires reviews or a companion of its reviews section", () => {
    for (const key of editionReadyLooks()) {
      expect(lookSlots(key).filter((slot) => /^reviews\b|^custom\.reviews-|^photos\.custom\.reviews-/.test(slot)), key).toEqual([]);
    }
  });

  it.each(["fashion-luxe", "vella", "streetwear", "zay", "jewelry-luxe", "karat", "saat", "kabl", "volt", "zaki", "arena"])("%s: no testimonials section, and nothing of one left behind", (key) => {
    const config = build(key);
    expect(sectionIds(config).filter((id) => id.includes("testimonials"))).toEqual([]);
    const json = JSON.stringify(config);
    for (const left of ["اشترت من المتجر", "اشترى من المتجر", "The product she bought", "المنتج اللي اشترته", "Verified buyer", "آراء العملاء", "من عملائنا", "رسايل بتفرّحنا"]) {
      expect(json.includes(left), `${key}: "${left}"`).toBe(false);
    }
  });

  it("the page around the dropped section still reads well", () => {
    const home = (key: string) => build(key).pages.find((p) => p.isHome)!.content.sections.map((s) => s.id.replace(`${key}-`, ""));
    // karat: the shelf is followed by the Instagram bento (not by another product section).
    expect(home("karat")).toEqual(["hero-poster", "categories-stories", "products-shelf", "gallery-bento"]);
    // zay: the home page ends on the best-seller carousel, with the comparison between it and the shelf.
    expect(home("zay")).toEqual(["hero-collage", "categories-big-type", "products-shelf", "features-compare", "products-carousel"]);
    // streetwear: the about page is its header and the story.
    const about = build("streetwear").pages.find((p) => p.slug === "about")!.content.sections.map((s) => s.id);
    expect(about).toEqual(["streetwear-about-header", "streetwear-about-classic"]);
  });

  it.each([
    ["karat", "karat-testimonials-photos"],
    ["zay", "zay-testimonials-chat"],
    ["streetwear", "streetwear-testimonials-classic"],
    ["kabl", "kabl-testimonials-classic"],
    ["volt", "volt-testimonials-chat"],
  ])("%s builds its reviews section when the pack has reviews", (key, id) => {
    const config = build(key, withReviews(key));
    expect(sectionIds(config)).toContain(id);
    const json = JSON.stringify(sections(config).find((s) => s.id === id));
    expect(json).toContain("Text reviews");
    expect(json).toContain("«Quote 1»");
  });

  it("karat needs all four review photos, and zay the store's reply, for the section", () => {
    const karat = withReviews("karat");
    const { "reviews-4": _photo, ...three } = karat.photos.custom!;
    expect(sectionIds(build("karat", { ...karat, photos: { ...karat.photos, custom: three } }))).not.toContain("karat-testimonials-photos");
    const zay = withReviews("zay");
    const { "reviews-reply": _reply, ...noReply } = zay.copy.custom!;
    expect(sectionIds(build("zay", { ...zay, copy: { ...zay.copy, custom: noReply } }))).not.toContain("zay-testimonials-chat");
  });
});

// ── 3. Labels a pack can replace ────────────────────────────────────────────

describe("trade-fixed labels are optional slots", () => {
  const json = (key: string, custom: Record<string, { ar: string; en: string }> = {}) => {
    const pack = fillerPack(key);
    return JSON.stringify(build(key, { ...pack, copy: { ...pack.copy, custom: { ...pack.copy.custom, ...custom } } }));
  };
  const own = (key: string) => JSON.stringify(getCodeTemplate(key)!.config());

  it("fashion-luxe: custom.shop-all and custom.products-noun", () => {
    // `"pieces"` is also the role of the shop-the-look list, once.
    const nouns = (site: string) => site.split('"pieces"').length - 2;
    for (const site of [own("fashion-luxe"), json("fashion-luxe")]) {
      expect(site).toContain("كل القطع");
      expect(site).toContain("All pieces");
      expect(nouns(site)).toBeGreaterThan(0);
    }
    const site = json("fashion-luxe", { "shop-all": L("كل التيشيرتات", "All tees"), "products-noun": L("تيشيرت", "tees") });
    for (const gone of ["كل القطع", "All pieces", "Shop all", '"قطع"']) expect(site.includes(gone), gone).toBe(false);
    expect(nouns(site)).toBe(0);
    expect(site.split("All tees").length - 1).toBe(2);
    expect(site).toContain('"tees"');
  });

  it("jewelry-luxe: custom.shop-all", () => {
    for (const site of [own("jewelry-luxe"), json("jewelry-luxe")]) expect(site.split("Shop all").length - 1).toBe(3);
    const site = json("jewelry-luxe", { "shop-all": L("كل النظارات", "All frames") });
    expect(site.includes("كل القطع") || site.includes("Shop all")).toBe(false);
    expect(site.split("All frames").length - 1).toBe(3);
  });

  it("vella: custom.categories-cta and custom.footer-offers", () => {
    const footerOf = (site: string) => JSON.stringify((JSON.parse(site) as SiteConfig).footer);
    for (const site of [own("vella"), json("vella")]) {
      expect(site).toContain("تسوّقي الآن");
      expect(footerOf(site)).toContain('"text":"العروض"');
      expect(footerOf(site)).toContain("Offers");
    }
    const site = json("vella", { "categories-cta": L("شوف القسم", "See the range"), "footer-offers": L("كل المنتجات", "All products") });
    expect(site.includes("تسوّقي الآن")).toBe(false);
    expect(site).toContain("See the range");
    expect(footerOf(site).includes("العروض") || footerOf(site).includes("Offers")).toBe(false);
    expect(footerOf(site)).toContain("All products");
  });

  it("karat: custom.reviews-photo-alt and custom.reviews-verified, with its reviews section", () => {
    const pack = fillerPack("karat");
    const reviews = { title: T("reviews"), items: [1, 2, 3, 4].map((n) => ({ quote: T(`quote ${n}`), name: L(`اسم ${n}`, `Name ${n}`) })) };
    const photos = Object.fromEntries([1, 2, 3, 4].map((n) => [`reviews-${n}`, pexels(800000 + n, 800)]));
    const site = (custom: Record<string, { ar: string; en: string }>) =>
      JSON.stringify(build("karat", { ...pack, copy: { ...pack.copy, reviews, custom: { ...pack.copy.custom, ...custom } }, photos: { ...pack.photos, custom: { ...pack.photos.custom, ...photos } } }));
    expect(site({})).toContain("اشترت من المتجر");
    expect(site({})).toContain("The product she bought");
    const neutral = site({ "reviews-photo-alt": L("المنتج اللي في الطلب", "The product in the order"), "reviews-verified": L("طلب مؤكد", "Confirmed order") });
    for (const gone of ["اشترت من المتجر", "The product she bought", "المنتج اللي اشترته", "Verified buyer"]) expect(neutral.includes(gone), gone).toBe(false);
    expect(neutral).toContain("Confirmed order");
    expect(neutral).toContain("The product in the order");
  });
});

// ── 4. Contact strings ──────────────────────────────────────────────────────

describe("an email, a phone number or a handle is valid in both languages", () => {
  const LOOK = getCodeTemplate("fashion-luxe")!;
  const withCustom = (custom: Record<string, { ar: string; en: string }>) => validateEdition({ ...TSHIRTS, copy: { ...TSHIRTS.copy, custom } }, LOOK);

  it("knows a contact string", () => {
    for (const yes of ["vella@vella.eg", "‏vella@vella.eg", "+20 123 456 7890", "01234567890", "(02) 2735-1234", "@zeina.shop", "⁦@zeina.shop⁩", "⁦+20‎ 123‎ 456⁩"]) {
      expect(isContactString(yes), yes).toBe(true);
    }
    for (const no of ["Pre-washed", "Call us", "vella@", "@", "12", "Email: a@b.eg", "a@b.eg or WhatsApp", ""]) expect(isContactString(no), no).toBe(false);
  });

  it("accepts the same contact string on both sides, direction marks aside", () => {
    expect(
      withCustom({
        "contact-email": L("vella@vella.eg", "vella@vella.eg"),
        "contact-email-rtl": L("‏vella@vella.eg", "vella@vella.eg"),
        "contact-phone": L("+20 123 456 7890", "+20 123 456 7890"),
        "contact-phone-ar": L("٠١٢٣ ٤٥٦ ٧٨٩٠", "+20 123 456 7890"),
        "lookbook-handle": L("⁦@qotna.shop⁩", "⁦@qotna.shop⁩"),
      }),
    ).toEqual([]);
  });

  it("still refuses Latin copy on the Arabic side, and a contact string that differs between the sides", () => {
    expect(withCustom({ note: L("Pre-washed", "Pre-washed") })).toEqual(['copy.custom.note: the Arabic side has no Arabic ("Pre-washed")']);
    expect(withCustom({ "contact-email": L("a@qotna.eg", "b@qotna.eg") })).toEqual(['copy.custom.contact-email: the Arabic side has no Arabic ("a@qotna.eg")']);
    expect(withCustom({ "contact-email": L("a@qotna.eg", "Email us") })).toEqual(['copy.custom.contact-email: the Arabic side has no Arabic ("a@qotna.eg")']);
    expect(withCustom({ "contact-phone": L("+20 123 456 7890", "٠١٢٣ ٤٥٦ ٧٨٩٠") })).toContain('copy.custom.contact-phone: the English side has Arabic ("٠١٢٣ ٤٥٦ ٧٨٩٠")');
  });
});
