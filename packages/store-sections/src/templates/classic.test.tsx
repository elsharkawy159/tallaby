import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { validateSiteConfig } from "../config/validate";
import { collectCatalogQueries } from "../core/registry";
import { DEMO_PRODUCT } from "../core/demo-product";
import type { RenderContext } from "../core/types";
import { MAX_ELEMENT_DEPTH, MAX_NODES_PER_SECTION } from "../elements/registry";
import { countNodes, treeDepth } from "../elements/tree";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { CLASSIC, CLASSIC_DESIGNS, classicConfig } from "./classic";
import { DEFAULT_TEMPLATE, TEMPLATE_JSON_END, TEMPLATE_JSON_START, getCodeTemplate, templateConfigJson, templateSeedSql } from "./catalog";
import { FROZEN_SEEDS, migrationSha256 } from "./frozen-seeds.test-utils";
import { prepareTemplateForStore, templateFormNeeds } from "./prepare";

/** The product page's product, with content so its content section draws. */
const PAGE_PRODUCT = { ...DEMO_PRODUCT, contentHtml: "<h3>المواصفات</h3><p>بطارية تدوم ٣٠ ساعة وشحن سريع ومقاومة للماء والعرق.</p>" };

const SEED = "0084_mobile_header_padding.sql";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
const sections = (config = classicConfig()): SectionInstance[] => [config.header!, config.footer!, ...config.pages.flatMap((p) => p.content.sections)];

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
  posts: [{ id: "b1", title: "مقال", excerpt: "سطر", href: "/blog/b1", image: null, date: "2026-10-02" }],
} as RenderContext);

describe("Tallaby Classic template", () => {
  it("is the default template, under the key stores already point at", () => {
    expect(DEFAULT_TEMPLATE).toBe(CLASSIC);
    expect(CLASSIC.key).toBe("tallaby-classic");
    expect(CLASSIC.isDefault).toBe(true);
    expect(getCodeTemplate("tallaby-classic")).toBe(CLASSIC);
  });

  it("is a valid SiteConfig made of tree sections only", () => {
    const result = validateSiteConfig(classicConfig(), { allowedSections: storeSectionRegistry.allowedSections() });
    expect(result.success).toBe(true);
    for (const section of sections()) {
      expect(section.sectionId).toBe("custom-section");
      expect(section.componentTree).toHaveLength(1);
      expect(section.componentTree![0]!.type).toBe("section");
      expect(section.source).toMatch(/^tallaby-[a-z-]+@1$/);
      expect(countNodes(section.componentTree!)).toBeLessThanOrEqual(MAX_NODES_PER_SECTION);
      expect(treeDepth(section.componentTree!)).toBeLessThanOrEqual(MAX_ELEMENT_DEPTH);
    }
  });

  it("has home, about, contact, faq, privacy, terms and product pages with unique node ids", () => {
    const config = classicConfig();
    expect(config.pages.map((p) => [p.slug, p.isHome])).toEqual([
      ["home", true],
      ["about", false],
      ["contact", false],
      ["faq", false],
      ["privacy", false],
      ["terms", false],
      ["product", false],
    ]);
    for (const page of config.pages) expect(CLASSIC.pageNames[page.slug]?.ar).toBe(page.name);
    const ids = sections().flatMap((s) => walk(s.componentTree).map((n) => n.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("writes every text in Arabic with an English translation", () => {
    for (const node of sections().flatMap((s) => walk(s.componentTree))) {
      const props = node.props as Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };
      for (const key of ["text", "title", "label", "alt"] as const) {
        const value = props[key];
        if (typeof value === "string" && /[؀-ۿ]/.test(value) && !/^[٠-٩ ]+$/.test(value)) {
          expect(props.translations?.en?.[key], `${node.id}.${key}`).toBeTruthy();
        }
      }
    }
  });

  it("only links inside the store (system pages and its own pages)", () => {
    const allowed =
      /^(\/|\/(products|about|contact|faq|blog|cart|shipping|returns|privacy|terms)(\?.*)?|\/profile(\/wishlist|\/orders)?|https:\/\/(www\.instagram\.com|www\.facebook\.com|wa\.me)\/\d*|tel:\+\d+|mailto:[^\s]+)$/;
    for (const node of sections().flatMap((s) => walk(s.componentTree))) {
      const href = (node.props as { href?: unknown }).href;
      if (typeof href === "string") expect(href, node.id).toMatch(allowed);
    }
  });

  it("binds its forms and fills in the store's name and first letter", () => {
    const config = classicConfig();
    expect(templateFormNeeds(config)).toEqual(["newsletter", "contact"]);
    const fitted = prepareTemplateForStore(config, { defaultLocale: "ar", storeName: "nour shop", formIds: { newsletter: "f-news", contact: "f-contact" }, year: 2027 });
    const forms = sections(fitted).flatMap((s) => walk(s.componentTree)).filter((n) => n.type === "storeForm");
    expect(forms.map((n) => n.props.formId)).toEqual(["f-news", "f-contact"]);
    const header = walk(fitted.header!.componentTree);
    expect(header.find((n) => n.props.role === "storeName")!.props.text).toBe("nour shop");
    expect(header.find((n) => n.props.role === "storeInitial")!.props.text).toBe("N");
    expect(walk(fitted.footer!.componentTree).find((n) => n.props.role === "copyright")!.props.text).toBe("© ٢٠٢٧ nour shop. كل الحقوق محفوظة.");
    expect(validateSiteConfig(fitted).success).toBe(true);
  });

  it("renders every section with store data, wishlist and cart buttons included", () => {
    const product = { id: "p1", title: "سماعة", href: "/products/p1", image: "https://cdn.test/p1.jpg", price: 900, compareAtPrice: 1200, rating: 4.6 };
    const fitted = prepareTemplateForStore(classicConfig(), { defaultLocale: "ar", formIds: { newsletter: "f1", contact: "f1" } });
    // Only the product page's sections get the page's product; the other pages render without one.
    const productSections = new Set(fitted.pages.filter((p) => p.kind === "product").flatMap((p) => p.content.sections));
    for (const section of sections(fitted)) {
      const products = productsFor(section, product);
      const categories = [{ id: "c1", key: "c1", name: "سماعات", href: "/products?category=c1", image: "https://cdn.test/c1.jpg", productCount: 3 }];
      const html = renderToStaticMarkup(<SectionRenderer instance={section} registry={storeSectionRegistry} ctx={productSections.has(section) ? { ...ctx({ products, categories }), product: PAGE_PRODUCT } : ctx({ products, categories })} defaultLocale="ar" />);
      if (section.id === "tallaby-blog") continue; // Posts come from the blog loader, not the catalog.
      expect(html.length, section.id).toBeGreaterThan(200);
      if (Object.keys(products).length) {
        expect(html).toContain('data-add="p1"');
        expect(html).toContain('data-wish="p1"');
        expect(html).toContain("/products/p1");
      }
    }
  });

  it("hides product sections for a store with no products", () => {
    const section = sections().find((s) => s.id === "tallaby-top-picks")!;
    const html = renderToStaticMarkup(<SectionRenderer instance={section} registry={storeSectionRegistry} ctx={ctx({ products: {}, categories: [] })} defaultLocale="ar" />);
    expect(html).not.toContain("اختياراتنا ليك");
  });

  it("has a demo catalog with photos for every product and category", () => {
    expect(CLASSIC.demo.products.length).toBeGreaterThanOrEqual(8);
    for (const p of CLASSIC.demo.products) {
      expect(p.image).toMatch(/^https:\/\/images\.pexels\.com\/photos\/\d+\//);
      expect(CLASSIC.demo.categories.some((c) => c.id === p.categoryId)).toBe(true);
    }
    expect(CLASSIC_DESIGNS.every((d) => d.id.startsWith("tallaby-"))).toBe(true);
  });

  // frozen: applied on staging and production 2026-10-20; DB is the master copy (admin website builder).
  it("keeps the applied 0084 seed unchanged (frozen)", () => {
    expect(migrationSha256(SEED)).toBe(FROZEN_SEEDS[SEED]);
  });

  it("still generates a seed whose config passes validateSiteConfig", () => {
    const seed = templateSeedSql(CLASSIC, SEED);
    expect(seed).not.toContain("DO UPDATE");
    expect(seed).toMatch(/true,\s+true,\s+false,\s+ids\.version_id/); // is_default, is_active, is_premium
    const json = seed.split(TEMPLATE_JSON_START)[1]!.split(TEMPLATE_JSON_END)[0]!.trim().replace(/^'|'::jsonb,$/g, "").replace(/''/g, "'");
    expect(JSON.parse(json)).toEqual(JSON.parse(templateConfigJson(CLASSIC)));
    const validated = validateSiteConfig(JSON.parse(json));
    expect(validated.success, JSON.stringify(validated.success ? "" : validated.issues)).toBe(true);
  });
});
