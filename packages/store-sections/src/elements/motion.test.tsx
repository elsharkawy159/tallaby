import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { PageRenderer, SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { MOTION_CSS, revealFrom, siteMotionAttrs } from "./motion";
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
    // The old "rise" meant on: it plays the site default.
    expect(render(custom(tree(), { shell: { animation: "rise" } }))).toContain("data-reveal");
  });

  it("plays the section's Animation preset in every reveal, and the site default for Inherit", () => {
    const slide = reveals(render(custom(tree(), { shell: { animation: "slide-end" } })));
    expect(slide.length).toBeGreaterThan(0);
    // Every reveal plays the preset, and a list's items play together (no stagger steps).
    expect(new Set(slide.map(([, variant]) => variant))).toEqual(new Set(["slide-end"]));
    expect(new Set(slide.map(([, , step]) => step))).toEqual(new Set(["0"]));
    // Stagger: everything rises, items one after another.
    const stagger = reveals(render(custom(tree(), { shell: { animation: "stagger" } })));
    expect(new Set(stagger.map(([, variant]) => variant))).toEqual(new Set(["fade-up"]));
    expect(stagger.map(([, , step]) => step)).toContain("3");
    // Inherit takes the site default; Auto (the default default) keeps each element's own.
    expect(new Set(reveals(render(custom(tree()), { revealDefault: "fade" })).map(([, v]) => v))).toEqual(new Set(["fade"]));
    expect(reveals(render(custom(tree()), { revealDefault: "auto" }))).toEqual(reveals(render(custom(tree()))));
    // A section's own preset beats the site default; None turns it off.
    expect(new Set(reveals(render(custom(tree(), { shell: { animation: "zoom-in" } }), { revealDefault: "fade" })).map(([, v]) => v))).toEqual(new Set(["zoom-in"]));
    expect(render(custom(tree(), { shell: { animation: "none" } }), { revealDefault: "fade" })).not.toContain("data-reveal");
  });

  it("keeps an element's own Reveal and the hero heading under a section preset", () => {
    const html = render(
      custom([node("section", {}, [node("heading", { level: "h1", text: "Hero" }), node("paragraph", { text: "A", reveal: "slide-start" })])], { shell: { animation: "zoom-in" } }),
    );
    expect(reveals(html)).toEqual([["paragraph", "slide-start", "0"]]);
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

describe("hover and press feedback", () => {
  it("lifts buttons and cards on hover devices, only with motion allowed and Hover effect on", () => {
    expect(MOTION_CSS).toContain("@media (hover:hover) and (prefers-reduced-motion:no-preference){");
    expect(MOTION_CSS).toContain(':is(:hover,:focus-visible){translate:0 -2px;');
    expect(MOTION_CSS).toContain(':hover{translate:0 -3px;');
    expect(MOTION_CSS).toContain(':not([data-sf-hover="none"])');
  });

  it("lifts a button reached by keyboard like a hovered one", () => {
    expect(MOTION_CSS).toContain(":is(:hover,:focus-visible){translate:0 -2px;");
  });

  it("slides the burger sheet out on close, not only in on open", () => {
    expect(MOTION_CSS).toContain('dialog[data-sf-sheet]{transform:translate3d(-100%,0,0);transition:transform .2s');
    expect(MOTION_CSS).toContain("overlay .2s allow-discrete,display .2s allow-discrete");
    expect(MOTION_CSS).toContain('dialog[data-sf-sheet][open]{transform:none;animation:sf-sheet-in');
    expect(MOTION_CSS).toContain("::backdrop{opacity:0;transition:opacity .2s");
  });

  it("presses buttons in on touch screens too", () => {
    expect(MOTION_CSS).toContain("@media (hover:none) and (prefers-reduced-motion:no-preference){");
    expect(MOTION_CSS).toMatch(/hover:none\) and \(prefers-reduced-motion:no-preference\)\{[^@]*:active\{scale:\.97/);
  });
});

describe("motion CSS", () => {
  it("hides only under sf-motion, moves only opacity and transform, and respects reduced motion", () => {
    expect(MOTION_CSS.startsWith("@media (prefers-reduced-motion:no-preference){")).toBe(true);
    expect(MOTION_CSS).toContain(".sf-motion [data-reveal]:not(.is-inview){opacity:0}");
    expect(MOTION_CSS).not.toMatch(/transition:[^;}]*(?:width|height|top|margin)/);
    expect(MOTION_CSS).toContain('[data-reveal-step="5"]{--sf-delay:calc(0.45s * var(--sf-speed,1))}');
    // Only the reveal's own parts wait for the stagger, never hover or press.
    expect(MOTION_CSS).toContain("opacity calc(0.9s * var(--sf-speed,1)) cubic-bezier(.16,1,.3,1) var(--sf-delay,0s)");
    expect(MOTION_CSS).not.toMatch(/translate \.3s[^,;}]*var\(--sf-delay/);
    expect(MOTION_CSS).not.toContain("will-change");
    expect(MOTION_CSS).not.toContain('data-reveal-step="6"');
  });

  it("maps the theme switches to root attributes", () => {
    expect(siteMotionAttrs(undefined)).toEqual({});
    expect(siteMotionAttrs({ reveal: false, hoverZoom: false })).toEqual({ "data-sf-motion": "off", "data-sf-hover": "none" });
    // Speed: normal (or unknown) writes nothing; slow and fast scale every reveal through --sf-speed.
    expect(siteMotionAttrs({ speed: "normal" })).toEqual({});
    expect(siteMotionAttrs({ speed: "fast" })).toEqual({ "data-sf-speed": "fast" });
    expect(siteMotionAttrs({ speed: "turbo" })).toEqual({});
    expect(MOTION_CSS).toContain('[data-sf-speed="slow"]{--sf-speed:1.6}');
  });

  it("mirrors the logical slides in Arabic", () => {
    expect(MOTION_CSS).toContain('[data-reveal="slide-end"]{transform:translate3d(28px,0,0)}');
    expect(MOTION_CSS).toContain('[dir="rtl"] .sf-motion [data-reveal]:not(.is-inview)[data-reveal="slide-end"]{transform:translate3d(-28px,0,0)}');
    // The editor replay starts from the same place as the CSS.
    expect(revealFrom("slide-start", false)).toEqual({ transform: "translate3d(-28px,0,0)" });
    expect(revealFrom("slide-start", true)).toEqual({ transform: "translate3d(28px,0,0)" });
    expect(revealFrom("slide-end", true)).toEqual({ transform: "translate3d(-28px,0,0)" });
    expect(revealFrom("zoom-in", true).clipPath).toBe("inset(6% 6% 6% 6%)");
    expect(revealFrom(undefined, false)).toEqual({ transform: "translate3d(0,28px,0)" });
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
