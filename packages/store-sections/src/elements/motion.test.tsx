import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { PageRenderer, SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { MOTION_CSS, siteMotionAttrs } from "./motion";
import { collectPageCss, fallbackTabletColumns } from "./style";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = [], style?: Record<string, unknown>): ComponentNode => ({
  id: `m${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
  ...(style && { style }),
});

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  reveal: true,
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
  formatPrice: (v) => `${v}`,
  ...over,
});

const custom = (tree: ComponentNode[], style?: SectionInstance["style"]): SectionInstance => ({
  id: "c1",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: tree,
  ...(style && { style }),
});
const render = (instance: SectionInstance, over: Partial<RenderContext> = {}) =>
  renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" />);

const reveals = (html: string) => [...html.matchAll(/data-node-type="(\w+)"[^>]*?data-reveal="([\w-]+)"(?: data-reveal-step="(\d)")?/g)].map((m) => [m[1], m[2], m[3] ?? "0"]);

describe("reveal on scroll (docs/section-rules.md §6)", () => {
  const cards = Array.from({ length: 8 }, (_, i) => node("vFlex", {}, [node("heading", { level: "h3", text: `Card ${i}` })]));
  const tree = () => [
    node("section", {}, [
      node("container", {}, [
        node("vFlex", { role: "intro" }, [node("heading", { level: "h2", text: "Title" }), node("paragraph", { text: "Line" })]),
        node("grid", {}, cards),
        node("image", { src: "a.jpg", alt: "" }),
        node("button", { label: "Shop", href: "/products" }),
      ]),
    ]),
  ];

  it("fades the head up as one unit, staggers grid items (capped at step 5) and zooms photos in", () => {
    const html = render(custom(tree()));
    const found = reveals(html);
    expect(found[0]).toEqual(["vFlex", "fade-up", "0"]);
    // Nothing inside a revealed node gets its own reveal.
    expect(found.filter(([type]) => type === "heading")).toEqual([]);
    const steps = found.filter(([type]) => type === "vFlex").slice(1).map(([, , step]) => step);
    expect(steps).toEqual(["0", "1", "2", "3", "4", "5", "5", "5"]);
    expect(found).toContainEqual(["image", "zoom-in", "0"]);
    expect(found).toContainEqual(["button", "fade-up", "0"]);
  });

  it("never hides the hero heading, forms, carousels or the buy box", () => {
    const html = render(
      custom([
        node("section", {}, [
          node("heading", { level: "h1", text: "Hero" }),
          node("carousel", {}, [node("slide", {}, [node("heading", { level: "h2", text: "Slide" })])]),
          node("productBuyBox"),
        ]),
      ]),
    );
    expect(html).not.toContain("data-reveal");
  });

  it("is off without ctx.reveal (the editor canvas) and when the section's Animation is off", () => {
    expect(render(custom(tree()), { reveal: false })).not.toContain("data-reveal");
    expect(render(custom(tree(), { shell: { animation: "none" } }))).not.toContain("data-reveal");
    // Old "rise"/"fade" values mean on.
    expect(render(custom(tree(), { shell: { animation: "rise" } }))).toContain("data-reveal");
  });

  it("honours an element's Reveal override", () => {
    const html = render(custom([node("section", {}, [node("paragraph", { text: "A", reveal: "slide-start" }), node("paragraph", { text: "B", reveal: "none" })])]));
    expect(reveals(html)).toEqual([["paragraph", "slide-start", "0"]]);
  });

  it("never reveals the header or footer", () => {
    const header = { ...custom([node("section", {}, [node("paragraph", { text: "Header" })])]), id: "h1" };
    const page = { ...custom([node("section", {}, [node("paragraph", { text: "Body" })])]), id: "p1" };
    const html = renderToStaticMarkup(<PageRenderer content={{ sections: [page] }} header={header} footer={null} registry={storeSectionRegistry} ctx={ctx()} />);
    expect(reveals(html)).toHaveLength(1);
    expect(html.indexOf("data-reveal")).toBeGreaterThan(html.indexOf("Header"));
  });

  it("zooms photos inside a clipped link on hover", () => {
    const html = render(custom([node("section", {}, [node("linkBlock", { href: "/products" }, [node("image", { src: "a.jpg" })], { overflow: "hidden" })])]));
    expect(html).toContain("sf-zoom");
    const plain = render(custom([node("section", {}, [node("linkBlock", { href: "/products" }, [node("image", { src: "a.jpg" })])])]));
    expect(plain).not.toContain("sf-zoom");
  });
});

describe("motion CSS", () => {
  it("hides only under sf-motion, moves only opacity and transform, and respects reduced motion", () => {
    expect(MOTION_CSS.startsWith("@media (prefers-reduced-motion:no-preference){")).toBe(true);
    expect(MOTION_CSS).toContain(".sf-motion [data-reveal]:not(.is-inview){opacity:0;");
    expect(MOTION_CSS).not.toMatch(/transition:[^;}]*(?:width|height|top|margin)/);
    expect(MOTION_CSS).toContain('[data-reveal-step="5"].is-inview{transition-delay:450ms}');
    expect(MOTION_CSS).not.toContain('data-reveal-step="6"');
  });

  it("maps the theme switches to root attributes", () => {
    expect(siteMotionAttrs(undefined)).toEqual({});
    expect(siteMotionAttrs({ reveal: false, hoverZoom: false })).toEqual({ "data-sf-motion": "off", "data-sf-hover": "none" });
  });
});

describe("hover transitions and tablet columns", () => {
  it("eases hover changes and turns them off with reduced motion", () => {
    const css = collectPageCss([custom([node("section", {}, [node("div", {}, [], { hover: { background: "secondary" } })])])]);
    expect(css).toMatch(/\{transition:color \.2s,background-color \.2s.*transform \.6s/);
    expect(css).toContain("@media (prefers-reduced-motion:reduce){");
  });

  it("gives rows of 4+ columns a tablet value when the design sets none", () => {
    expect(fallbackTabletColumns("productList", 4)).toBe(3);
    expect(fallbackTabletColumns("grid", 4)).toBe(2);
    expect(fallbackTabletColumns("grid", 6)).toBe(3);
    expect(fallbackTabletColumns("grid", 3)).toBeUndefined();
    expect(fallbackTabletColumns("vFlex", 4)).toBeUndefined();
    const css = collectPageCss([custom([node("section", {}, [node("grid", {}, [], { columns: 4 })])])]);
    expect(css).toMatch(/@media \(max-width:1023px\)\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
    const set = collectPageCss([custom([{ ...node("grid", {}, [], { columns: 4 }), breakpointStyles: { tablet: { columns: 4 } } }])]);
    expect(set).not.toContain("repeat(2,");
  });
});
