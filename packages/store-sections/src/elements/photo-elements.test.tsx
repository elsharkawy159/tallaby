/**
 * The `beforeAfter` and `hotspot` elements as the server draws them (look-first
 * pilot L5): public and editor markup, both page directions, the product a
 * dot shows, and what the schema, the sanitizer and the tree rules accept.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sanitizeSiteConfig } from "../config/sanitize";
import { componentNodeSchema, type ComponentNode, type SectionInstance, type SiteConfig } from "../config/schema";
import { validatePageContent } from "../config/validate";
import { collectCatalogQueries } from "../core/registry";
import type { ProductSummary, RenderContext } from "../core/types";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { hotspotProduct, nodeCatalogQuery, treeDataNeeds } from "./data";
import { LINK_TYPES, PALETTE_TYPES, getElementDefinition } from "./registry";
import { canContain, createNode } from "./tree";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = [], style?: Record<string, unknown>): ComponentNode => ({
  id: `q${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
  ...(style && { style }),
});

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "ar",
  dir: "rtl",
  store: { name: "S", url: "https://s.test" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn/${src}` : null),
  formatPrice: (v) => `${v} EGP`,
  ...over,
});

const custom = (tree: ComponentNode[]): SectionInstance => ({ id: "c1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree });
const render = (tree: ComponentNode[], over: Partial<RenderContext> = {}) =>
  renderToStaticMarkup(<SectionRenderer instance={custom(tree)} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" />);
const english = { locale: "en", dir: "ltr" } as const;

const layer = (src: string, tag: string) => node("div", {}, [node("image", { src, alt: tag }), node("badge", { text: tag })]);
const slider = (props: Record<string, unknown> = {}, layers = [layer("before.jpg", "قبل"), layer("after.jpg", "بعد")]) => [
  node("section", {}, [node("heading", { level: "h2", text: "T" }), node("beforeAfter", props, layers)]),
];

describe("beforeAfter element", () => {
  it("draws both photos split at the start position, with no script needed", () => {
    const html = render(slider({ start: 30 }));
    expect(html).toContain('data-node-type="beforeAfter"');
    expect(html).toContain("--sf-ba:30%");
    // Both layers are in the markup, After first (it gives the frame its size), Before over it.
    expect(html.indexOf("after.jpg")).toBeGreaterThan(-1);
    expect(html.indexOf("after.jpg")).toBeLessThan(html.indexOf("before.jpg"));
    expect(html).toContain('data-sf-ba-layer="before"');
    expect(html).toContain("قبل");
    expect(html).toContain("بعد");
    // No script, no inline handlers, no animation of its own.
    expect(html).not.toMatch(/<script|onpointer|onclick|animate|transition/);
  });

  it("has a labelled, focusable slider handle", () => {
    const html = render(slider({ start: 30 }));
    expect(html).toMatch(/role="slider"[^>]*tabindex="0"|tabindex="0"[^>]*role="slider"/);
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="30"');
    expect(html).toContain('aria-orientation="horizontal"');
    expect(html).toContain('aria-label="حرّك الفاصل للمقارنة بين قبل وبعد"');
    expect(render(slider(), english)).toContain('aria-label="Move the handle to compare before and after"');
  });

  it("mirrors in Arabic: Before stays on the start side", () => {
    const rtl = render(slider({ start: 30 }));
    expect(rtl).toContain("clip-path:inset(0 0 0 calc(100% - var(--sf-ba)))");
    expect(rtl).toContain("transform:translateX(calc(var(--sf-ba) * -1))");
    const ltr = render(slider({ start: 30 }), english);
    expect(ltr).toContain("clip-path:inset(0 calc(100% - var(--sf-ba)) 0 0)");
    expect(ltr).toContain("transform:translateX(var(--sf-ba))");
  });

  it("clamps or drops a bad start position", () => {
    expect(render(slider({ start: 500 }))).toContain("--sf-ba:100%");
    expect(render(slider({ start: -3 }))).toContain("--sf-ba:0%");
    for (const start of [undefined, "70", "50%;background:url(javascript:1)", {}]) expect(render(slider({ start }))).toContain("--sf-ba:50%");
  });

  it("keeps the editor canvas still: same split, no drag hook", () => {
    const html = render(slider({ start: 40 }), { mode: "edit" });
    expect(html).toContain('data-node-type="beforeAfter"');
    expect(html).toContain("--sf-ba:40%");
    expect(html).not.toContain("data-sf-ba=");
    expect(html).not.toContain("select-none");
    // The live page is what the runtime looks for.
    expect(render(slider({ start: 40 }))).toContain('data-sf-ba=""');
  });

  it("draws one layer as a plain frame, and nothing publicly with none", () => {
    const one = render(slider({}, [layer("only.jpg", "قبل")]));
    expect(one).toContain("only.jpg");
    expect(one).not.toContain('role="slider"');
    expect(render(slider({}, []))).not.toContain('data-node-type="beforeAfter"');
    expect(render(slider({}, []), { mode: "edit" })).toContain("أضف صندوقين هنا");
  });

  it("ignores a third layer", () => {
    const html = render(slider({}, [layer("a.jpg", "A"), layer("b.jpg", "B"), layer("c.jpg", "C")]));
    expect(html).not.toContain("c.jpg");
  });
});

const PRODUCT: ProductSummary = { id: "p1", title: "حقيبة جلد", href: "/products/p1", image: "p1.jpg", price: 900 };
const SECOND: ProductSummary = { id: "p2", title: "حذاء", href: "/products/p2", image: null, price: 450 };
const photoBox = (...dots: ComponentNode[]) => [node("section", {}, [node("div", {}, [node("image", { src: "look.jpg", alt: "Look" }), ...dots])])];

describe("hotspot element", () => {
  it("draws a text note as a real button with a name, closed", () => {
    const dot = node("hotspot", { kind: "text", x: 30, y: 20, title: "الخامة", body: "خامة متينة" });
    const html = render(photoBox(dot));
    expect(html).toMatch(/<button[^>]*data-node-type="hotspot"/);
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('aria-label="الخامة"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(`aria-controls="sf-hs-${dot.id}"`);
    expect(html).toContain(`id="sf-hs-${dot.id}"`);
    expect(html).toContain('data-sf-hotspot="text"');
    // Closed in the markup; `data-hs-static` lets plain CSS open it before the script runs.
    expect(html).toContain('data-hs-static=""');
    expect(html).not.toContain("data-hs-open");
    expect(html).toContain("خامة متينة");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).not.toMatch(/<script|onclick|onmouse/);
  });

  it("places the dot by percent from the photo's left and top in both directions, inside a positioned box", () => {
    const tree = photoBox(node("hotspot", { kind: "text", x: 30, y: 20, title: "T" }));
    for (const over of [{}, english]) {
      const html = render(tree, over);
      expect(html).toContain("left:30%;top:20%");
      expect(html).toContain("left:clamp(8px, calc(30% - var(--sf-hs-w) / 2), calc(100% - var(--sf-hs-w) - 8px))");
      expect(html).toContain("top:calc(20% + 14px)");
      // The box that holds the dots is what they are placed in.
      expect(html).toMatch(/data-node-type="div" class="[^"]*relative/);
    }
    // A box without dots is drawn exactly as before.
    expect(render([node("section", {}, [node("div", {}, [node("image", { src: "look.jpg", alt: "" })])])])).toMatch(/data-node-type="div" class="min-w-0"/);
  });

  it("flips above the dot in the bottom half, and clamps a bad position", () => {
    expect(render(photoBox(node("hotspot", { kind: "text", x: 50, y: 80, title: "T" })))).toContain("bottom:calc(20% + 14px)");
    const html = render(photoBox(node("hotspot", { kind: "text", x: 900, y: "top", title: "T" })));
    expect(html).toContain("left:100%;top:50%");
  });

  it("prints seller text as text, capped, and treats an unknown kind as a note", () => {
    const html = render(photoBox(node("hotspot", { kind: "html", x: 10, y: 10, title: "<img src=x onerror=alert(1)>", body: "x".repeat(900) })));
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain('data-sf-hotspot="text"');
    expect(html).not.toContain("x".repeat(401));
    expect(html).toContain("x".repeat(400));
  });

  it("draws no empty note publicly; the editor says what to write", () => {
    const tree = photoBox(node("hotspot", { kind: "text", x: 10, y: 10, title: " ", body: "" }));
    expect(render(tree)).not.toContain("data-sf-hotspot");
    const edit = render(tree, { mode: "edit" });
    expect(edit).toContain('data-node-type="hotspot"');
    expect(edit).toContain("اكتب عنوان ونص النقطة");
  });

  it("shows the picked product with its photo, name, price, link and the host's cart button", () => {
    const dot = node("hotspot", { kind: "product", x: 40, y: 40, productId: "p1" });
    const tree = photoBox(dot);
    expect(collectCatalogQueries([custom(tree)], storeSectionRegistry)).toEqual({ [dot.id]: { kind: "products", source: "selected", productIds: ["p1"], sort: "default", limit: 1 } });
    const html = render(tree, {
      catalog: { products: { [dot.id]: [PRODUCT] }, categories: [] },
      renderAddToCart: (product) => <button data-cart={product.id}>أضف</button>,
    });
    expect(html).toContain('data-sf-hotspot="product"');
    expect(html).toContain('aria-label="اعرض المنتج: حقيبة جلد"');
    expect(html).toContain('href="/products/p1"');
    expect(html).toContain("https://cdn/p1.jpg");
    expect(html).toContain("حقيبة جلد");
    expect(html).toContain("900 EGP");
    expect(html).toContain('data-cart="p1"');
  });

  it("falls back to the store's Nth newest product until one is picked", () => {
    const dot = node("hotspot", { kind: "product", x: 40, y: 40, productIndex: 2 });
    expect(nodeCatalogQuery(dot)).toEqual({ kind: "products", source: "newest", sort: "default", limit: 2 });
    const data = ctx({ catalog: { products: { [dot.id]: [PRODUCT, SECOND] }, categories: [] } });
    expect(hotspotProduct(dot, data)?.id).toBe("p2");
    // Fewer products than its place: no product.
    expect(hotspotProduct(dot, ctx({ catalog: { products: { [dot.id]: [PRODUCT] }, categories: [] } }))).toBeNull();
    // Not set up: no query at all, and a text note never asks for products.
    expect(nodeCatalogQuery(node("hotspot", { kind: "product" }))).toBeNull();
    expect(nodeCatalogQuery(node("hotspot", { kind: "product", productId: "bad id!", productIndex: 99 }))).toBeNull();
    expect(nodeCatalogQuery(node("hotspot", { kind: "text", productId: "p1" }))).toBeNull();
  });

  it("draws no dot for a missing product, and hides a section whose every product dot is empty", () => {
    const first = node("hotspot", { kind: "product", x: 20, y: 20, productIndex: 1 });
    const second = node("hotspot", { kind: "product", x: 60, y: 60, productIndex: 2 });
    const tree = photoBox(first, second);
    const one = render(tree, { catalog: { products: { [first.id]: [PRODUCT], [second.id]: [PRODUCT] }, categories: [] } });
    expect(one.match(/data-sf-hotspot-dot/g)).toHaveLength(1);
    expect(one).toContain("look.jpg");
    expect(render(tree)).not.toContain("<section");
    // Text notes need no store data: the same photo with a note stays.
    expect(render(photoBox(node("hotspot", { kind: "text", x: 1, y: 1, title: "T" })))).toContain("<section");
  });

  it("asks for products in the editor when a product dot has none", () => {
    const tree = photoBox(node("hotspot", { kind: "product", x: 20, y: 20, productIndex: 1 }));
    expect(treeDataNeeds(tree)).toEqual(["products"]);
    expect(treeDataNeeds(photoBox(node("hotspot", { kind: "text", title: "T" })))).toEqual([]);
    const editorData = { state: "ready" as const, renderAction: (need: string, label: string) => <a data-action={need}>{label}</a>, renderRetry: () => null };
    const html = render(tree, { mode: "edit", editorData });
    expect(html).toContain('data-node-type="hotspot"');
    expect(html).toContain('data-action="products"');
  });
});

describe("new elements in the schema, sanitizer and tree rules", () => {
  it("are known element types, in the palette, and never nest in a link", () => {
    for (const type of ["beforeAfter", "hotspot"] as const) {
      expect(getElementDefinition(type)).toBeDefined();
      expect(PALETTE_TYPES).toContain(type);
      expect(LINK_TYPES).toContain(type);
    }
    expect(getElementDefinition("beforeAfter")!.childTypes).toEqual(["div"]);
    expect(getElementDefinition("hotspot")!.container).toBe(false);
  });

  it("the schema accepts both nodes and rejects a made-up type", () => {
    expect(componentNodeSchema.safeParse(node("beforeAfter", { start: 40 }, [node("div"), node("div")])).success).toBe(true);
    expect(componentNodeSchema.safeParse(node("hotspot", { kind: "text", x: 1, y: 2, title: "T" })).success).toBe(true);
    expect(componentNodeSchema.safeParse(node("beforeAfterHtml", {})).success).toBe(false);
    expect(componentNodeSchema.safeParse(node("customCode", { html: "<b>x</b>" })).success).toBe(false);
  });

  it("validates a page that holds them and cleans their props on save", () => {
    const dot = node("hotspot", { kind: "text", x: 10, y: 10, title: "<script>alert(1)</script>Material", body: "javascript:alert(1)" });
    const tree = [node("section", {}, [node("div", {}, [node("image", { src: "a.jpg", alt: "" }), dot]), node("beforeAfter", { start: 40 }, [layer("a.jpg", "A"), layer("b.jpg", "B")], { radius: 16, behavior: "url(x)" })])];
    const result = validatePageContent({ sections: [custom(tree)] });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const saved = JSON.stringify(result.data);
    expect(saved).not.toContain("<script>");
    expect(saved).not.toContain("javascript:");
    expect(saved).toContain("Material");
    // Styles keep only the whitelist.
    expect(saved).not.toContain("behavior");
    expect(saved).toContain('"start":40');
  });

  it("sanitizes a whole site config holding them without touching its input", () => {
    const dot = node("hotspot", { kind: "text", title: "<b onclick=x>Hi</b>" });
    const config = { schemaVersion: 1, designSystem: { colors: {}, typography: {}, spacing: {} }, header: null, footer: null, settings: { defaultLocale: "ar", locales: ["ar"] }, pages: [{ slug: "home", isHome: true, name: "Home", seo: {}, content: { sections: [custom([node("section", {}, [node("div", {}, [dot])])])] } }] } as unknown as SiteConfig;
    const clean = JSON.stringify(sanitizeSiteConfig(config));
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("<b>Hi</b>");
    expect(dot.props.title).toBe("<b onclick=x>Hi</b>");
  });

  it("lets a dot go only inside a box, and a slider take only boxes", () => {
    const makeId = () => `m${++n}`;
    const box = node("div");
    const stack = node("vFlex");
    const link = node("linkBlock", { href: "/" });
    const tree = [node("section", {}, [box, stack, link])];
    const dot = createNode("hotspot", makeId);
    expect(canContain(tree, box.id, dot)).toBe(true);
    expect(canContain(tree, stack.id, dot)).toBe(false);
    expect(canContain(tree, tree[0]!.id, dot)).toBe(false);
    expect(canContain([], null, dot)).toBe(false);
    const made = createNode("beforeAfter", makeId);
    expect(made.children.map((child) => child.type)).toEqual(["div", "div"]);
    expect(made.props.start).toBe(50);
    expect(canContain(tree, stack.id, made)).toBe(true);
    expect(canContain(tree, link.id, made)).toBe(false);
    const sliderTree = [node("section", {}, [made])];
    expect(canContain(sliderTree, made.id, node("div"))).toBe(true);
    expect(canContain(sliderTree, made.id, node("image", { src: "" }))).toBe(false);
  });
});
