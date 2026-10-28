import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance, SiteConfig } from "../config/schema";
import { validateSiteConfig } from "../config/validate";
import { STORE_FONTS } from "../core/fonts";
import { collectCatalogQueries } from "../core/registry";
import { DEMO_PRODUCT } from "../core/demo-product";
import type { RenderContext } from "../core/types";
import { STOCK_INDUSTRIES, peoplePhoto, stockPhoto } from "../designs/stock-photos";
import { MAX_ELEMENT_DEPTH, MAX_NODES_PER_SECTION } from "../elements/registry";
import { countNodes, treeDepth } from "../elements/tree";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { CODE_TEMPLATES, LIBRARY_TEMPLATES, TEMPLATE_JSON_END, TEMPLATE_JSON_START, getCodeTemplate, getTemplateDesign, templateConfigJson, templatesSeedSql } from "./catalog";
import { FROZEN_SEEDS, migrationSha256 } from "./frozen-seeds.test-utils";
import { prepareTemplateForStore, templateFormNeeds } from "./prepare";

/** Each batch's generated seed migration (regenerate with `template:sql <keys> <file>`). */
/** The product page's product, with content so its content section draws. */
const PAGE_PRODUCT = { ...DEMO_PRODUCT, contentHtml: "<h3>المواصفات</h3><p>بطارية تدوم ٣٠ ساعة وشحن سريع ومقاومة للماء والعرق.</p>" };

const SEEDS: Record<string, readonly string[]> = {
  // 0074–0083 seeded v1 by category; 0084 (v2, mobile header padding) also seeds Classic and Atelier first.
  "0084_mobile_header_padding.sql": [
    ...["mode", "streetwear", "kasr", "techhub", "volt", "arcade", "arena", "pure", "glow", "elixir", "botanica"],
    ...["nest", "daily", "hearth", "sizzle", "harvest", "loaf", "roast", "verdant", "loft", "oak", "sakan"],
    ...["lumiere", "karat", "fadda", "playroom", "bambino", "doodle", "hekaya", "pace", "stride", "core", "basecamp"],
    ...["garage", "drive", "moto"],
  ],
  // Templates 49–100 (v1), one migration for all ten store categories.
  "0090_library_templates_49_100.sql": [
    ...["kettan", "zay", "sitara", "shanta", "tasfya", "kabl", "sada", "zaki", "saa", "tany"],
    ...["nada", "kohl", "oud", "sabon", "barber", "matbakh", "fokhar", "tawla", "tanzim", "qahwa", "khodar"],
    ...["lahma", "halawa", "atara", "dokan", "bunn", "mobilia", "zarea", "nour", "mafrash", "rokn", "zahra"],
    ...["nuqra", "lulu", "saat", "mahr", "lego", "mama", "madrasa", "hikaya", "ahlam", "yoga", "koora"],
    ...["darraga", "sabaha", "boxing", "tyre", "zeina", "kahraba", "safar", "garagy"],
  ],
  // Templates 39–48 and 101–110 (v1; 101–110 open with the carousel hero).
  "0095_library_templates_39_48_101_110.sql": [
    ...["bashra", "sufra", "sabaho", "dar", "shabka", "hadaya", "rep", "pitstop", "ghorza"],
    ...["mawsem", "shasha", "ward", "beity", "souq", "salon", "kholkhal", "farha", "nashat", "tarik"],
  ],
};

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
const sections = (config: SiteConfig): SectionInstance[] => [config.header!, config.footer!, ...config.pages.flatMap((p) => p.content.sections)];

/** Library stock photos: never in a template (its photos are checked by eye). */
const STOCK = new Set([
  ...STOCK_INDUSTRIES.flatMap((industry) => Array.from({ length: 10 }, (_, i) => stockPhoto(industry, i))),
  ...Array.from({ length: 10 }, (_, i) => peoplePhoto(i)),
]);

/** Every product list of the section gets `product`. */
const productsFor = (section: SectionInstance, product: object) =>
  Object.fromEntries(
    Object.entries(collectCatalogQueries([section], storeSectionRegistry))
      .filter(([, query]) => query.kind === "products")
      .map(([key]) => [key, [product]]),
  ) as RenderContext["catalog"]["products"];

const ctx = (catalog: RenderContext["catalog"]): RenderContext => ({
  mode: "public",
  locale: "ar",
  dir: "rtl",
  store: { name: "متجر", url: "https://x.tallaby.com" },
  pages: [],
  catalog,
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => src ?? null,
  formatPrice: (n) => `${n} EGP`,
  renderAddToCart: (p) => <button data-add={p.id}>add</button>,
  renderWishlistButton: (p) => <button data-wish={p.id}>wish</button>,
  forms: { f1: { id: "f1", fields: [{ key: "email", type: "email", label: "البريد", required: true, width: "full" }], submitLabel: "اشترك", successMessage: "" } },
});

const LINK = /^(\/|\/(products|about|contact|faq|blog|cart|shipping|returns|privacy|terms)(\?.*)?|\/profile(\/wishlist|\/orders)?|tel:\+\d+|mailto:[^@\s]+@[^@\s]+|https:\/\/maps\.google\.com\/|https:\/\/(www\.instagram\.com|www\.facebook\.com|www\.youtube\.com|www\.tiktok\.com|wa\.me)\/.*)$/;

describe.each(LIBRARY_TEMPLATES.map((t) => [t.key, t] as const))("library template %s", (key, template) => {
  const config = template.config();

  it("is a valid SiteConfig of tree sections, each the template's own design", () => {
    const result = validateSiteConfig(config, { allowedSections: storeSectionRegistry.allowedSections() });
    expect(result.success, JSON.stringify(result.success ? "" : result.issues)).toBe(true);
    for (const section of sections(config)) {
      expect(section.sectionId).toBe("custom-section");
      expect(section.componentTree).toHaveLength(1);
      expect(section.componentTree![0]!.type).toBe("section");
      expect(section.source).toMatch(new RegExp(`^${key}-[a-z0-9-]+@\\d+$`));
      expect(getTemplateDesign(section.source!.split("@")[0]!), section.source).toBeTruthy();
      expect(countNodes(section.componentTree!)).toBeLessThanOrEqual(MAX_NODES_PER_SECTION);
      expect(treeDepth(section.componentTree!)).toBeLessThanOrEqual(MAX_ELEMENT_DEPTH);
    }
    expect(template.designs.every((d) => d.id.startsWith(`${key}-`))).toBe(true);
    expect(getCodeTemplate(key)).toBe(template);
  });

  it("has a home page first, named pages and unique node ids", () => {
    expect(config.pages[0]!.isHome).toBe(true);
    expect(config.pages.filter((p) => p.isHome)).toHaveLength(1);
    for (const page of config.pages) expect(template.pageNames[page.slug]?.ar).toBe(page.name);
    const ids = sections(config).flatMap((s) => walk(s.componentTree).map((n) => n.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses fonts the storefront loads", () => {
    const names = STORE_FONTS.map((f) => f.name) as string[];
    expect(names).toContain(config.designSystem.typography?.headingFont);
    expect(names).toContain(config.designSystem.typography?.bodyFont);
  });

  it("writes every text in Arabic with an English translation, and no library placeholder copy", () => {
    for (const node of sections(config).flatMap((s) => walk(s.componentTree))) {
      const props = node.props as Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };
      for (const prop of ["text", "title", "label", "alt"] as const) {
        const value = props[prop];
        if (typeof value === "string" && /[؀-ۿ]/.test(value) && !/^[٠-٩ ]+$/.test(value) && Array.from(value).length > 1) {
          expect(props.translations?.en?.[prop], `${node.id}.${prop} "${value}"`).toBeTruthy();
        }
      }
      expect(props.text, node.id).not.toBe("اسم متجرك");
    }
  });

  it("uses its own checked photos, never library stock photos", () => {
    for (const node of sections(config).flatMap((s) => walk(s.componentTree))) {
      if (node.type === "image" && !node.props.bind) {
        expect(node.props.src, node.id).toMatch(/^https:\/\/images\.pexels\.com\/photos\/\d+\//);
        expect(STOCK.has(node.props.src as string), `${node.id} is a stock photo`).toBe(false);
      }
    }
  });

  it("only links inside the store", () => {
    for (const node of sections(config).flatMap((s) => walk(s.componentTree))) {
      const href = (node.props as { href?: unknown }).href;
      if (typeof href === "string") expect(href, node.id).toMatch(LINK);
    }
  });

  it("binds its forms, the store's name and copyright for a store", () => {
    const needs = templateFormNeeds(config);
    expect(needs.length).toBeGreaterThan(0);
    const formIds = Object.fromEntries(needs.map((n) => [n, `f-${n}`]));
    const fitted = prepareTemplateForStore(config, { defaultLocale: "ar", storeName: "بيت الكتان", formIds, year: 2027 });
    const forms = sections(fitted).flatMap((s) => walk(s.componentTree)).filter((n) => n.type === "storeForm");
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((n) => typeof n.props.formId === "string" && !("formTemplate" in n.props))).toBe(true);
    expect(walk(fitted.header!.componentTree).some((n) => n.props.role === "storeName" && n.props.text === "بيت الكتان")).toBe(true);
    expect(walk(fitted.footer!.componentTree).find((n) => n.props.role === "copyright")?.props.text).toBe("© ٢٠٢٧ بيت الكتان. كل الحقوق محفوظة.");
    expect(validateSiteConfig(fitted).success).toBe(true);
    expect(validateSiteConfig(prepareTemplateForStore(config, { defaultLocale: "en" })).success).toBe(true);
  });

  it("renders every section with store data and cart buttons", () => {
    const product = { id: "p1", title: "منتج", href: "/products/p1", image: "https://cdn.test/p1.jpg", price: 900, compareAtPrice: 1200, rating: 4.6 };
    // Four categories, so a template's "products by category" rows (places 1–4) each have one.
    const categories = [1, 2, 3, 4].map((n) => ({ id: `c${n}`, key: `c${n}`, name: `قسم ${n}`, href: `/products?category=c${n}`, image: `https://cdn.test/c${n}.jpg`, productCount: 3 }));
    const fitted = prepareTemplateForStore(config, { defaultLocale: "ar", formIds: Object.fromEntries(templateFormNeeds(config).map((n) => [n, "f1"])) });
    // Only the product page's sections get the page's product; the other pages render without one.
    const productSections = new Set(fitted.pages.filter((p) => p.kind === "product").flatMap((p) => p.content.sections));
    for (const section of sections(fitted)) {
      const products = productsFor(section, product);
      const html = renderToStaticMarkup(<SectionRenderer instance={section} registry={storeSectionRegistry} ctx={productSections.has(section) ? { ...ctx({ products, categories }), product: PAGE_PRODUCT } : ctx({ products, categories })} defaultLocale="ar" />);
      expect(html.length, section.id).toBeGreaterThan(200);
      if (Object.keys(products).length) expect(html, section.id).toContain("/products/p1");
    }
  });

  it("has a demo store with photos for every product and category", () => {
    expect(template.demo.products.length).toBeGreaterThanOrEqual(8);
    expect(template.demo.categories.length).toBeGreaterThanOrEqual(3);
    for (const p of template.demo.products) {
      expect(p.image).toMatch(/^https:\/\/images\.pexels\.com\/photos\/\d+\//);
      expect(template.demo.categories.some((c) => c.id === p.categoryId), p.id).toBe(true);
    }
    for (const c of template.demo.categories) expect(c.productCount, c.id).toBeGreaterThan(0);
    expect(new Set(template.demo.products.map((p) => p.slug)).size).toBe(template.demo.products.length);
    expect(template.demo.products.some((p) => p.isFeatured)).toBe(true);
  });
});

describe("every code template's home page", () => {
  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s has at least one product grid", (_key, template) => {
    const home = template.config().pages.find((p) => p.isHome)!;
    const nodes = home.content.sections.flatMap((s) => walk(s.componentTree));
    expect(nodes.some((n) => n.type === "productList")).toBe(true);
  });
});

describe("library template seeds", () => {
  it("cover every library template once", () => {
    const seeded = Object.values(SEEDS).flat();
    expect(new Set(seeded).size).toBe(seeded.length);
    for (const key of seeded) expect(getCodeTemplate(key), key).toBeTruthy();
  });

  // frozen: applied on staging and production 2026-10-20; DB is the master copy (admin website builder).
  it.each(Object.keys(SEEDS))("%s is unchanged (frozen)", (file) => {
    expect(FROZEN_SEEDS[file], file).toBeTruthy();
    expect(migrationSha256(file)).toBe(FROZEN_SEEDS[file]);
  });

  it.each(Object.entries(SEEDS))("%s: the current generator output still passes validateSiteConfig", (file, keys) => {
    const templates = keys.map((k) => getCodeTemplate(k)!);
    const seed = templatesSeedSql(templates, file);
    const blocks = seed.split(TEMPLATE_JSON_START).slice(1);
    expect(blocks).toHaveLength(templates.length);
    blocks.forEach((block, i) => {
      const json = block.split(TEMPLATE_JSON_END)[0]!.trim().replace(/^'|'::jsonb,$/g, "").replace(/''/g, "'");
      expect(JSON.parse(json)).toEqual(JSON.parse(templateConfigJson(templates[i]!)));
      const validated = validateSiteConfig(JSON.parse(json));
      expect(validated.success, `${keys[i]}: ${JSON.stringify(validated.success ? "" : validated.issues)}`).toBe(true);
    });
    // Building every template config takes a while once the list is long.
  }, 60_000);
});
