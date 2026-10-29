import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionInstanceSchema, type ComponentNode } from "../config/schema";
import type { RenderContext } from "../core/types";
import { MAX_ELEMENT_DEPTH, MAX_NODES_PER_SECTION, getElementDefinition } from "../elements/registry";
import { countNodes, treeDepth } from "../elements/tree";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { collectCatalogQueries, collectContentQueries } from "../core/registry";
import { treeDataNeeds } from "../elements/data";
import { LIBRARY_CATEGORY_IDS } from "../library/types";
import { DEMO_PRODUCT } from "../core/demo-product";
import { DESIGNS, STOCK_INDUSTRIES, getDesign, instantiateDesign, type Design } from ".";

/** Designs this test expects to exist; each later design adds its id here. */
const EXPECTED = [
  ...["header-classic", "header-line", "header-centered", "header-announcement", "header-search", "header-pill", "header-ruled", "header-chips", "header-brand-bar", "header-departments", "header-centered-ticker", "header-inline", "header-topbar", "header-icons"],
  ...["hero-carousel", "hero-carousel-images", "hero-carousel-panel", "hero-classic", "hero-ticket", "hero-poster", "hero-inline", "hero-product", "hero-collage", "hero-bento", "hero-halves", "hero-big-word", "hero-search", "hero-fullbleed", "hero-video", "hero-split", "hero-thumbs", "hero-banner"],
  ...["categories-classic", "categories-tiles", "categories-stories", "categories-rail", "categories-bento", "categories-index", "categories-ruled", "categories-chips", "categories-feature-list", "categories-big-type", "categories-showcase", "categories-photo-tiles", "categories-circles", "categories-captioned", "categories-panels", "categories-counts"],
  ...["products-classic", "products-grid", "products-rail", "products-feature", "products-shelf", "products-list", "products-tabbed", "products-bento", "products-rows", "products-panel-rail", "products-tabs-grid", "products-carousel", "products-category-carousel", "products-spotlight", "products-minimal", "products-boxed", "products-campaign", "products-deal", "products-category-tabs", "products-centered-row"],
  ...["bundle-plus", "bundle-builder", "bundle-poster", "bundle-tabs", "bundle-list", "bundle-box", "bundle-quantity", "bundle-rail", "bundle-price-drop", "bundle-gifts", "bundle-together"],
  ...["finder-use", "finder-budget", "finder-quiz", "finder-versus", "finder-matrix", "finder-price-bands", "finder-sentence", "finder-pick", "finder-features", "finder-this-or-that", "finder-guides"],
  ...["promo-pair", "promo-ticker", "promo-deal", "promo-coupon", "promo-bento", "promo-twin", "promo-shipping", "promo-percent", "promo-tiers", "promo-sticker", "promo-banner-fullbleed", "promo-campaign-tiles", "promo-marquee", "promo-countdown"],
  ...["features-classic", "features-icon-cards", "features-checklist", "features-steps", "features-ruled", "features-bento", "features-side-title", "features-ticker", "features-compare", "features-orbit", "features-trust-band", "features-columns"],
  ...["pay-methods", "pay-installments", "pay-zones", "pay-promise", "pay-open-box", "pay-pickup", "pay-secure", "pay-installment-table", "pay-days", "pay-receipt", "pay-faq"],
  ...["stats-classic", "stats-big-numbers", "stats-photo", "stats-progress", "stats-strip", "stats-ruled", "stats-band", "stats-sentence", "stats-rating", "stats-milestones"],
  ...["about-classic", "about-panel", "about-overlap", "about-rows", "about-values", "about-list", "about-wide", "about-inset", "about-stories", "about-circle", "about-fullbleed", "about-split-story", "about-before-after", "about-shop-look"],
  ...["video-wide", "video-split", "video-cinema", "video-playlist", "video-reels", "video-vertical", "video-grid", "video-chapters", "video-film", "video-shop"],
  ...["gallery-feed", "gallery-mosaic", "gallery-polaroids", "gallery-shoppable", "gallery-strip", "gallery-captioned", "gallery-slider", "gallery-prints", "gallery-bento", "gallery-side", "gallery-social-strip"],
  ...["brands-row", "brands-wall", "brands-tiles", "brands-press", "brands-featured", "brands-ruled", "brands-cards", "brands-az", "brands-quotes", "brands-bubbles"],
  ...["testimonials-classic", "testimonials-spotlight", "testimonials-rating", "testimonials-wall", "testimonials-photos", "testimonials-ruled", "testimonials-chat", "testimonials-bento", "testimonials-products", "testimonials-videos", "testimonials-carousel", "testimonials-photo-cards", "testimonials-quote", "testimonials-summary"],
  ...["faq-classic", "faq-simple", "faq-side", "faq-cards", "faq-help", "faq-columns", "faq-panel", "faq-numbered", "faq-chat", "faq-topics"],
  ...["blog-classic", "blog-lead", "blog-index", "blog-tiles", "blog-feature", "blog-dated", "blog-bento", "blog-rail", "blog-tabbed", "blog-headline"],
  ...["newsletter-classic", "newsletter-centered", "newsletter-photo", "newsletter-channels", "newsletter-coupon", "newsletter-ruled", "newsletter-big", "newsletter-interests", "newsletter-sticker", "newsletter-letter", "newsletter-banner", "newsletter-strip", "newsletter-offer"],
  ...["popup-welcome", "popup-exit", "popup-app", "popup-whatsapp", "popup-restock", "popup-sale-end", "popup-reward"],
  ...["rewards-gift", "rewards-birthday"],
  ...["service-cards", "service-trade-in", "service-booking", "service-warranty", "service-price-menu", "service-plans", "service-journey", "service-areas", "service-repair-request", "service-fast-fix", "service-support"],
  ...["team-story", "team-timeline", "team-grid", "team-values", "team-founder", "team-branches", "team-press", "team-careers", "team-numbers", "team-scenes"],
  ...["contact-classic", "contact-form", "contact-visit", "contact-branches", "contact-whatsapp", "contact-strip", "contact-hours", "contact-bento", "contact-big", "contact-router", "contact-team"],
  ...["track-ask", "track-steps", "track-returns", "track-reschedule", "track-rate", "track-problem"],
  ...["text-policy", "text-centered", "text-callout", "text-columns", "text-quote", "text-steps", "text-lead", "text-statement", "text-terms", "text-note", "text-brand-statement"],
  ...["page-header", "page-banner", "page-image", "page-subcategories", "page-promo", "page-toolbar", "page-brand", "page-split", "page-centered", "page-count"],
  ...["product-main", "product-content", "product-reviews", "product-related", "product-perks", "product-shipping"],
  ...["cart-extras", "cart-empty", "cart-free-delivery", "cart-coupon"],
  ...["footer-classic", "footer-line", "footer-wordmark", "footer-signup", "footer-centered", "footer-ruled", "footer-signoff", "footer-panel", "footer-help", "footer-links", "footer-columns-signup", "footer-centered-light", "footer-dark-bar"],
];

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "ar",
  dir: "rtl",
  store: { name: "متجر", url: "https://x.tallaby.com" },
  pages: [{ name: "الرئيسية", href: "/", isHome: true }],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn.test/${src}` : null),
  formatPrice: (n) => `${n} EGP`,
  ...over,
});

const walk = (nodes: readonly ComponentNode[]): ComponentNode[] => nodes.flatMap((n) => [n, ...walk(n.children)]);

const PRODUCT = { id: "p1", title: "سماعة لاسلكية", href: "/products/p1", image: "https://cdn.test/p1.jpg", price: 900, compareAtPrice: 1200, rating: 4.6 };
const POST = { id: "b1", title: "إزاي تختار سماعة", href: "/blog/b1", excerpt: "سطر من المقال", image: "https://cdn.test/b1.jpg", publishedAt: "2026-10-02" };
const FORM = {
  id: "f1",
  fields: [{ key: "email", type: "email" as const, label: "البريد", required: true, width: "full" as const }],
  submitLabel: "اشترك",
  successMessage: "",
};

/** A design's instance with its form picked, and store data for every data node it has. */
function withStoreData(instance: ReturnType<typeof instantiateDesign>) {
  const tree = instance.componentTree!.map(function pick(node: ComponentNode): ComponentNode {
    return { ...node, props: node.type === "storeForm" ? { ...node.props, formId: "f1" } : node.props, children: node.children.map(pick) };
  });
  const filled = { ...instance, componentTree: tree };
  const products = Object.fromEntries(
    Object.keys(collectCatalogQueries([filled], storeSectionRegistry)).map((key) => [key, [PRODUCT, { ...PRODUCT, id: "p2", compareAtPrice: null }]]),
  );
  const items = Object.fromEntries(
    Object.keys(collectContentQueries([filled], storeSectionRegistry)).map((key) => [key, [POST, { ...POST, id: "b2" }, { ...POST, id: "b3" }]]),
  );
  const data: Partial<RenderContext> = {
    catalog: {
      products,
      categories: [{ id: "c1", key: "audio", name: "سماعات", href: "/products?category=c1", image: "https://cdn.test/c1.jpg", productCount: 12 }],
    },
    content: { items },
    forms: { f1: FORM },
  };
  return { instance: filled, data };
}

/** Product page designs render on a product page, with its product (and its rich content). */
const PAGE_PRODUCT = { ...DEMO_PRODUCT, contentHtml: "<h2>عن السماعة</h2><p>صوت نقي طول اليوم.</p>" };
const pageData = (design: Design): Partial<RenderContext> => (design.category === "product-page" ? { product: PAGE_PRODUCT } : {});

describe("section designs", () => {
  it.each(EXPECTED)("%s is registered", (id) => {
    expect(getDesign(id)).toBeDefined();
  });

  it.each(DESIGNS.map((d) => [d.id, d] as const))("%s follows the design rules", (_id, design) => {
    const instance = instantiateDesign(design, { id: "d1" });
    expect(sectionInstanceSchema.safeParse(instance).success).toBe(true);
    const tree = instance.componentTree!;
    expect(tree).toHaveLength(1);
    expect(tree[0]!.type).toBe("section");
    expect(countNodes(tree)).toBeLessThanOrEqual(MAX_NODES_PER_SECTION);
    expect(treeDepth(tree)).toBeLessThanOrEqual(MAX_ELEMENT_DEPTH);
    for (const node of walk(tree)) {
      const definition = getElementDefinition(node.type);
      expect(definition, node.type).toBeDefined();
      // Rule 2: every container (except repeated items) has a Layers label.
      if (definition!.container && node.type !== "accordionItem") expect(node.props.label, `${node.type} ${node.id}`).toBeTruthy();
      // Rule 5: every text the visitor reads has an English version.
      const key = definition!.textProp;
      if (key && node.props[key]) expect((node.props.translations as { en?: Record<string, unknown> })?.en?.[key], `${node.type} ${node.id}`).toBeTruthy();
    }
  });

  it.each(DESIGNS.map((d) => [d.id, d] as const))("%s renders in both locales and modes", (_id, design) => {
    const { instance, data } = withStoreData(instantiateDesign(design, { id: "d1" }));
    for (const locale of ["ar", "en"] as const) {
      for (const mode of ["edit", "public"] as const) {
        const html = renderToStaticMarkup(
          <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx({ ...data, ...pageData(design), locale, mode, dir: locale === "ar" ? "rtl" : "ltr" })} />,
        );
        expect(html).toContain("<section data-node-id=");
      }
    }
  });

  it.each(DESIGNS.map((d) => [d.id, d] as const))("%s matches its snapshot (ar, public)", (_id, design) => {
    const { instance, data } = withStoreData(instantiateDesign(design, { id: "d1" }));
    expect(renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx({ ...data, ...pageData(design) })} />)).toMatchSnapshot();
  });

  it.each(DESIGNS.map((d) => [d.id, d] as const))("%s keeps image frames sized without a photo", (_id, design) => {
    // An empty image draws nothing publicly; the frame around it must keep its size.
    for (const node of walk(instantiateDesign(design, { id: "d1" }).componentTree!)) {
      // Bound images take the record's photo; only authored empty images need a sized frame.
      if (!node.children.some((c) => c.type === "image" && !c.props.src && !c.props.bind)) continue;
      expect(node.style?.minHeight, `${node.props.label}`).toBeGreaterThan(0);
      expect(node.breakpointStyles?.mobile?.minHeight, `${node.props.label} (mobile)`).toBeGreaterThan(0);
    }
  });

  it("lists every design once, in its library category and in library order", () => {
    expect(DESIGNS.map((d) => d.id)).toEqual(EXPECTED);
    const order = DESIGNS.map((d) => LIBRARY_CATEGORY_IDS.indexOf(d.category));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const design of DESIGNS) expect(LIBRARY_CATEGORY_IDS, design.id).toContain(design.category);
  });

  it("fills photos for the store's industry, falling back to general ones", () => {
    const photos = (industry?: string) =>
      walk(instantiateDesign(getDesign("hero-classic")!, { id: "d1", industry }).componentTree!)
        .filter((n) => n.type === "image")
        .map((n) => n.props.src as string);
    expect(photos("beauty")).not.toEqual(photos("pets"));
    expect(photos("nope")).toEqual(photos());
    for (const industry of [undefined, ...STOCK_INDUSTRIES]) {
      for (const src of photos(industry)) expect(src).toMatch(/^https:\/\/images\.pexels\.com\/photos\/\d+\//);
    }
  });

  const dataDesigns = DESIGNS.filter((d) => treeDataNeeds(instantiateDesign(d, { id: "d1" }).componentTree).length > 0);

  it("covers the store-data categories", () => {
    expect(new Set(dataDesigns.map((d) => d.category))).toEqual(new Set(["headers", "hero", "categories", "products", "bundles", "finder", "promotions", "payment", "image-text", "video", "gallery", "blog", "newsletter", "popups", "loyalty", "services", "contact", "tracking", "page-header", "product-page", "cart", "footers"]));
  });

  it.each(dataDesigns.map((d) => [d.id, d] as const))("%s draws real records, and nothing publicly without them", (_id, design) => {
    const { instance, data } = withStoreData(instantiateDesign(design, { id: "d1" }));
    const html = renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(data)} />);
    if (design.category === "products") expect(html).toContain("سماعة لاسلكية");
    if (design.category === "blog") expect(html).toContain("إزاي تختار سماعة");
    if (design.category === "newsletter" || design.id === "footer-signup" || design.id === "contact-form") expect(html).toContain('type="email"');
    // The authored placeholders never reach shoppers once data is there.
    expect(html).not.toContain("اسم المنتج");
    expect(html).not.toContain("عنوان المقال");

    const empty = instantiateDesign(design, { id: "d1" });
    expect(renderToStaticMarkup(<SectionRenderer instance={empty} registry={storeSectionRegistry} ctx={ctx()} />)).not.toContain("<section");
  });

  it.each(dataDesigns.map((d) => [d.id, d] as const))("%s shows the add-records action in the editor when empty", (_id, design) => {
    const empty = instantiateDesign(design, { id: "d1" });
    const editorData = {
      state: "ready" as const,
      renderAction: (need: string, label: string) => <a data-action={need}>{label}</a>,
      renderRetry: () => null,
    };
    const html = renderToStaticMarkup(<SectionRenderer instance={empty} registry={storeSectionRegistry} ctx={ctx({ mode: "edit", editorData })} />);
    for (const need of treeDataNeeds(empty.componentTree)) expect(html).toContain(`data-action="${need}"`);
  });

  it("gives every header no padding-y on mobile (owner: the header is flush on phones)", () => {
    for (const design of DESIGNS.filter((d) => d.category === "headers")) {
      const [root] = instantiateDesign(design, { id: "d1" }).componentTree!;
      expect(root!.breakpointStyles?.mobile, design.id).toMatchObject({ paddingTop: 0, paddingBottom: 0 });
    }
  });

  it("gives two inserted copies of a design no shared node ids", () => {
    for (const design of DESIGNS) {
      const a = new Set(walk(instantiateDesign(design, { id: "a" }).componentTree!).map((n) => n.id));
      const b = walk(instantiateDesign(design, { id: "b" }).componentTree!).map((n) => n.id);
      expect(
        b.some((id) => a.has(id)),
        design.id,
      ).toBe(false);
    }
  });
});
