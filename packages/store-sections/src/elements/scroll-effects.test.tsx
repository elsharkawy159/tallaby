/**
 * Motion v2 scroll effects, steps, count-up and hover polish markup
 * (docs/motion-v2-plan.md §5.4-§5.7): the section Scroll effect parser, where
 * effects can play (`scrollEffectTargets`), the enum attributes the renderer
 * draws on public pages only, and the CSS gating (reduced motion, Animations
 * off, RTL).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { DESIGNS, instantiateDesign } from "../designs";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { MOTION_CSS_POLISH, MOTION_CSS_SCROLL } from "./motion";
import { getElementDefinition } from "./registry";
import { planScroll, scrollEffectTargets } from "./scroll-plan";
import { normalizeShell } from "./shell";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = [], style?: Record<string, unknown>): ComponentNode => ({
  id: `s${++n}`,
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
const render = (instance: SectionInstance, over: Partial<RenderContext> = {}, aboveFold = false) =>
  renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" aboveFold={aboveFold} />);
const shell = (scrollEffect: string, extra: Record<string, unknown> = {}) => ({ shell: { scrollEffect, ...extra } }) as SectionInstance["style"];

/** A hero: a clipped photo frame, and the copy box with the title. */
const hero = () => {
  const photo = node("image", { src: "hero.jpg", role: "image" });
  const copy = node("vFlex", { role: "intro" }, [node("heading", { text: "Title", level: "h1", role: "title" }), node("paragraph", { text: "Line" })]);
  const frame = node("div", {}, [photo, copy], { overflow: "hidden", position: "relative" });
  return { tree: [node("section", { motion: 2 }, [frame])], photo, copy, frame };
};

describe("section Scroll effect setting", () => {
  it("keeps the five effects, drops none and junk", () => {
    expect(normalizeShell({ scrollEffect: "parallax" })).toEqual({ scrollEffect: "parallax" });
    expect(normalizeShell({ scrollEffect: "zoom" })).toEqual({ scrollEffect: "zoom" });
    expect(normalizeShell({ scrollEffect: "fade-exit" })).toEqual({ scrollEffect: "fade-exit" });
    expect(normalizeShell({ scrollEffect: "reveal-scrub" })).toEqual({ scrollEffect: "reveal-scrub" });
    expect(normalizeShell({ scrollEffect: "horizontal" })).toEqual({ scrollEffect: "horizontal" });
    // The markup names of the scrub's two parts are not a setting.
    expect(normalizeShell({ scrollEffect: "scrub-photo" })).toBeUndefined();
    expect(normalizeShell({ scrollEffect: "none" })).toBeUndefined();
    expect(normalizeShell({ scrollEffect: "spin" })).toBeUndefined();
    expect(normalizeShell({ scrollEffect: 3, paddingY: "md" })).toEqual({ paddingY: "md" });
    expect(normalizeShell({ scrollEffect: "progress" })).toBeUndefined();
  });
});

describe("scrollEffectTargets", () => {
  it("finds the main photo, and the title's box on the first section only", () => {
    const { tree, photo, copy } = hero();
    // Any other section: reveal-scrub moves the same photo and the title's box.
    expect(scrollEffectTargets(tree)).toEqual({ effects: ["parallax", "zoom", "reveal-scrub"], imageId: photo.id, contentId: null, scrubId: copy.id, rowId: null });
    expect(scrollEffectTargets(tree, { isFirstSection: true })).toEqual({
      effects: ["parallax", "zoom", "fade-exit"],
      imageId: photo.id,
      contentId: copy.id,
      scrubId: null,
      rowId: null,
    });
  });

  it("offers nothing for a photo outside its own frame or inside a data list", () => {
    const loose = [node("section", {}, [node("div", {}, [node("image", { src: "a.jpg", role: "image" }), node("paragraph", { text: "x" })])])];
    expect(scrollEffectTargets(loose).effects).toEqual([]);
    const listed = [node("section", {}, [node("productList", {}, [node("div", {}, [node("image", { bind: "image", role: "image" })])])])];
    // The list itself is a row `horizontal` can slide; its photo still takes nothing.
    expect(scrollEffectTargets(listed)).toMatchObject({ effects: ["horizontal"], imageId: null, rowId: listed[0]!.children[0]!.id });
    // A background photo is enough for parallax and zoom.
    expect(scrollEffectTargets(loose, { backgroundImage: true })).toEqual({ effects: ["parallax", "zoom"], imageId: null, contentId: null, scrubId: null, rowId: null });
    // A background photo's wrapper clips, so nothing could be pinned: no horizontal there.
    expect(scrollEffectTargets(listed, { backgroundImage: true }).effects).toEqual(["parallax", "zoom"]);
  });

  it("takes a banner photo alone in its box, and never fades a box holding the photo", () => {
    const banner = node("image", { src: "b.jpg" }, [], { aspectRatio: "banner" });
    const title = node("heading", { text: "T", level: "h2" });
    const tree = [node("section", {}, [node("div", {}, [banner]), node("div", {}, [title, node("image", { src: "c.jpg" })])])];
    expect(scrollEffectTargets(tree, { isFirstSection: true })).toEqual({ effects: ["parallax", "zoom"], imageId: banner.id, contentId: null, scrubId: null, rowId: null });
  });

  it("finds the targets in the hero-fullbleed design", () => {
    const design = DESIGNS.find((d) => d.id === "hero-fullbleed")!;
    const tree = instantiateDesign(design, { id: "h1" }).componentTree!;
    const targets = scrollEffectTargets(tree, { isFirstSection: true });
    expect(targets.effects).toEqual(["parallax", "zoom", "fade-exit"]);
    const ids = new Map<string, ComponentNode>();
    const walk = (nodes: ComponentNode[]) => nodes.forEach((x) => (ids.set(x.id, x), walk(x.children)));
    walk(tree);
    expect(ids.get(targets.imageId!)?.props.role).toBe("image");
    expect(ids.get(targets.contentId!)?.children.some((c) => c.props.role === "title")).toBe(true);
  });
});

describe("scroll effect markup", () => {
  it("draws the section's parallax on its photo and frames it, on public pages only", () => {
    const { tree, photo, frame } = hero();
    const html = render(custom(tree, shell("parallax")));
    expect(html).toMatch(new RegExp(`<img data-node-id="${photo.id}" data-node-type="image"[^>]*data-sf-scroll="parallax"`));
    expect(html).toMatch(new RegExp(`<div data-node-id="${frame.id}" data-node-type="div"[^>]*data-sf-frame=""`));
    expect(html.match(/data-sf-scroll/g)).toHaveLength(1);
    // The editor canvas draws no scroll effect at all.
    const edit = render(custom(tree, shell("parallax")), { mode: "edit", reveal: false });
    expect(edit).not.toMatch(/data-sf-(scroll|frame|track|steps|step-|live)/);
  });

  it("puts fade-exit on the first section's copy only, with its section as the track", () => {
    const { tree, copy } = hero();
    const first = render(custom(tree, shell("fade-exit")), {}, true);
    expect(first).toMatch(new RegExp(`data-node-id="${copy.id}" data-node-type="vFlex"[^>]*data-sf-scroll="fade-exit"`));
    expect(first).toMatch(/<section [^>]*data-sf-track=""/);
    // The hero heading is never hidden or marked; nothing is hidden inline.
    expect(first).not.toMatch(/<h1[^>]*data-sf-scroll/);
    expect(first).not.toMatch(/opacity:\s*0|visibility:\s*hidden/);
    // Not the page's first section: no effect.
    expect(render(custom(tree, shell("fade-exit")))).not.toContain("data-sf-scroll");
  });

  it("lets a background photo take parallax and zoom", () => {
    const { tree } = hero();
    const html = render(custom(tree, shell("zoom", { bgImage: "bg.jpg" })));
    expect(html).toMatch(/<div data-section-id="c1" data-section-type="custom-section"[^>]*data-sf-frame=""[^>]*>/);
    expect(html).toMatch(/<img [^>]*data-sf-scroll="zoom"[^>]*aria-hidden/);
    expect(html.match(/data-sf-scroll/g)).toHaveLength(1);
  });

  it("draws an image's own effect only where it has a frame and is not a list record", () => {
    const own = node("image", { src: "a.jpg", scrollEffect: "zoom" });
    const loose = node("image", { src: "b.jpg", scrollEffect: "parallax" });
    const listed = node("image", { bind: "image", scrollEffect: "parallax" });
    const tree = [
      node("section", {}, [
        node("div", {}, [own]),
        node("div", {}, [loose, node("paragraph", { text: "p" })]),
        node("productList", { source: "newest" }, [node("div", {}, [listed])]),
        node("image", { src: "c.jpg", scrollEffect: "spin" }),
      ]),
    ];
    const html = render(custom(tree), {
      catalog: { products: { [tree[0]!.children[2]!.id]: [{ id: "p1", title: "P", href: "/p", image: "https://cdn.test/p.jpg", price: 1 }] }, categories: [] },
    });
    expect(html).toMatch(new RegExp(`data-node-id="${own.id}" data-node-type="image"[^>]*data-sf-scroll="zoom"`));
    expect(html.match(/data-sf-scroll/g)).toHaveLength(1);
  });

  it("marks a progress bar, vertical too, and its section track", () => {
    const bar = node("div", { role: "progress" });
    const tall = node("div", { role: "progress", axis: "vertical" });
    const html = render(custom([node("section", {}, [bar, tall])]));
    expect(html).toMatch(new RegExp(`data-node-id="${bar.id}" data-node-type="div"[^>]*data-sf-scroll="progress"`));
    expect(html).toMatch(new RegExp(`data-node-id="${tall.id}" data-node-type="div"[^>]*data-sf-scroll="progress" data-sf-axis="y"`));
    expect(html).toMatch(/<section [^>]*data-sf-track=""/);
  });

  it("draws steps: the block, each step, the media column and its photos (which never reveal)", () => {
    const step = (i: number) => node("vFlex", { role: "step" }, [node("heading", { text: `Step ${i}`, level: "h3" }), node("image", { src: `own${i}.jpg` })]);
    const steps = [step(0), step(1), step(2)];
    const media = node("div", { role: "steps-media" }, [0, 1, 2].map((i) => node("image", { src: `m${i}.jpg` })));
    const bar = node("div", { role: "progress" });
    const block = node("grid", { role: "steps" }, [node("vFlex", {}, steps), media, bar]);
    const tree = [node("section", { motion: 2 }, [block])];
    const html = render(custom(tree));
    expect(html).toMatch(new RegExp(`data-node-id="${block.id}" data-node-type="grid"[^>]*data-sf-steps="3"`));
    steps.forEach((s, k) => expect(html).toMatch(new RegExp(`data-node-id="${s.id}" data-node-type="vFlex"[^>]*data-sf-step-item="${k}"`)));
    expect(html).toMatch(new RegExp(`data-node-id="${media.id}" data-node-type="div"[^>]*data-sf-steps-media=""`));
    media.children.forEach((img, k) => expect(html).toContain(`<img data-node-id="${img.id}" data-node-type="image" data-sf-step-media="${k}"`));
    // Step photos crossfade only: no reveal on them; each step's own photo is marked for phones.
    expect(html).not.toMatch(/data-sf-step-media="\d"[^>]*data-reveal/);
    expect(html.match(/data-sf-step-own=""/g)).toHaveLength(3);
    // A bar inside the steps follows the steps, not the section.
    expect(html).toMatch(new RegExp(`data-node-id="${bar.id}" data-node-type="div"[^>]*data-sf-scroll="progress"`));
    expect(html).not.toContain("data-sf-track");
    // No data-sf-step on the server: every text shows in full.
    expect(html).not.toMatch(/data-sf-step="/);
    expect(render(custom(tree), { mode: "edit", reveal: false })).not.toMatch(/data-sf-(steps|step-)/);
  });

  it("needs 2 to 8 steps", () => {
    const one = [node("section", {}, [node("div", { role: "steps" }, [node("div", { role: "step" })])])];
    expect(planScroll(one[0]!, undefined)).toBeNull();
    const nine = [node("section", {}, [node("div", { role: "steps" }, Array.from({ length: 9 }, () => node("div", { role: "step" })))])];
    expect(planScroll(nine[0]!, undefined)).toBeNull();
  });

  it("draws reveal-scrub on the photo and the copy of any section but the first", () => {
    const { tree, photo, copy, frame } = hero();
    const html = render(custom(tree, shell("reveal-scrub")));
    expect(html).toMatch(new RegExp(`<img data-node-id="${photo.id}" data-node-type="image"[^>]*data-sf-scroll="scrub-photo"`));
    expect(html).toMatch(new RegExp(`data-node-id="${copy.id}" data-node-type="vFlex"[^>]*data-sf-scroll="scrub-copy"`));
    expect(html).toMatch(new RegExp(`<div data-node-id="${frame.id}" data-node-type="div"[^>]*data-sf-frame=""`));
    expect(html).toMatch(/<section [^>]*data-sf-track=""/);
    expect(html).toMatch(/<section [^>]*data-sf-scrub=""/);
    // Nothing is hidden inline: without scroll timelines the ordinary reveal still plays.
    expect(html).not.toMatch(/opacity:\s*0|visibility:\s*hidden/);
    // The page's first section and the editor canvas: nothing.
    expect(render(custom(tree, shell("reveal-scrub")), {}, true)).not.toMatch(/data-sf-(scroll|scrub)/);
    expect(render(custom(tree, shell("reveal-scrub")), { mode: "edit", reveal: false })).not.toMatch(/data-sf-(scroll|scrub|track)/);
    // A photo's own effect wins over the section's scrub.
    const own = hero();
    own.photo.props.scrollEffect = "zoom";
    expect(render(custom(own.tree, shell("reveal-scrub")))).toMatch(new RegExp(`data-node-id="${own.photo.id}"[^>]*data-sf-scroll="zoom"`));
  });

  it("draws horizontal on a row of 4 to 12 cards: the pinned section, its sticky part and the row", () => {
    const cards = (count: number) => Array.from({ length: count }, (_, i) => node("div", {}, [node("paragraph", { text: `Card ${i}` })]));
    const row = node("grid", {}, cards(5));
    const pin = node("vFlex", {}, [node("heading", { text: "T", level: "h2" }), row]);
    const tree = [node("section", {}, [pin])];
    const html = render(custom(tree, shell("horizontal")));
    expect(html).toMatch(/<section [^>]*data-sf-h="5"/);
    expect(html).toMatch(/<section [^>]*data-sf-track=""/);
    expect(html).toMatch(new RegExp(`data-node-id="${pin.id}" data-node-type="vFlex"[^>]*data-sf-h-pin=""`));
    expect(html).toMatch(new RegExp(`data-node-id="${row.id}" data-node-type="grid"[^>]*data-sf-scroll="horizontal"`));
    // The editor canvas, a background photo, and a row of 3 or 13 cards: the row stays as it is.
    expect(render(custom(tree, shell("horizontal")), { mode: "edit", reveal: false })).not.toMatch(/data-sf-(h|scroll|track)/);
    expect(render(custom(tree, shell("horizontal", { bgImage: "bg.jpg" })))).not.toMatch(/data-sf-(h=|h-pin|scroll="horizontal")/);
    for (const count of [3, 13]) {
      const small = [node("section", {}, [node("vFlex", {}, [node("grid", {}, cards(count))])])];
      expect(planScroll(small[0]!, "horizontal")).toBeNull();
    }
  });

  it("counts the cards a data list draws for horizontal", () => {
    const list = node("productList", { source: "newest" }, [node("div", {}, [node("text", { bind: "title" })])]);
    const tree = [node("section", {}, [node("div", {}, [list])])];
    const products = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, title: `P${i}`, href: `/p${i}`, image: null, price: 1 }));
    const withProducts = (count: number) => render(custom(tree, shell("horizontal")), { catalog: { products: { [list.id]: products(count) }, categories: [] } });
    expect(withProducts(6)).toMatch(/<section [^>]*data-sf-h="6"/);
    expect(withProducts(6)).toMatch(new RegExp(`data-node-id="${list.id}"[^>]*data-sf-scroll="horizontal"`));
    // Too few products to slide: an ordinary list.
    expect(withProducts(2)).not.toMatch(/data-sf-(h=|scroll="horizontal")/);
    // A swipe row moves on its own: never pinned.
    list.props.rail = true;
    expect(planScroll(tree[0]!, "horizontal")).toBeNull();
  });

  it("leaves a section with no effect exactly as it was", () => {
    const { tree } = hero();
    expect(render(custom(tree))).not.toMatch(/data-sf-(scroll|frame|track|steps)/);
    expect(planScroll(tree[0]!, undefined)).toBeNull();
  });
});

describe("count-up markup", () => {
  const stat = (text: string, extra: Record<string, unknown> = {}) => [node("section", {}, [node("text", { text, role: "value", countUp: true, ...extra })])];

  it("writes the final number for search, screen readers and no-JS, with the width kept", () => {
    const html = render(custom(stat("+١٬٠٨٠")));
    expect(html).toContain('<span data-sf-count=""><span class="sr-only">+١٬٠٨٠</span><span aria-hidden="true" style="display:inline-grid;font-variant-numeric:tabular-nums">');
    expect(html).toContain('<span style="grid-area:1/1;visibility:hidden">+١٬٠٨٠</span><span data-sf-count-live="" style="grid-area:1/1">+١٬٠٨٠</span>');
  });

  it("is plain text in the editor, without the switch, off the value role, or with no whole number", () => {
    expect(render(custom(stat("98%")), { mode: "edit", reveal: false })).not.toContain("data-sf-count");
    expect(render(custom(stat("98%", { countUp: false })))).not.toContain("data-sf-count");
    expect(render(custom(stat("98%", { role: "title" })))).not.toContain("data-sf-count");
    expect(render(custom(stat("4.9")))).not.toContain("data-sf-count");
    expect(render(custom(stat("مجاني")))).not.toContain("data-sf-count");
    expect(render(custom(stat("98%")))).toContain("data-sf-count");
  });

  it("has an advanced switch on text, shown for stat values", () => {
    const field = getElementDefinition("text")!.fields.find((f) => f.key === "countUp")!;
    expect(field).toMatchObject({ type: "switch", group: "advanced", showWhen: { key: "role", equals: ["value"] } });
    expect(field.label).toEqual({ ar: expect.any(String), en: "Count up when shown" });
    const image = getElementDefinition("image")!.fields.find((f) => f.key === "scrollEffect")!;
    expect(image).toMatchObject({ type: "select", group: "advanced" });
    expect(image.options?.map((o) => o.value)).toEqual(["none", "parallax", "zoom"]);
    expect(image.options?.every((o) => o.label.ar && o.label.en)).toBe(true);
  });
});

describe("hover polish markup", () => {
  const card = (motion?: number) => {
    const list = node("productList", { source: "newest" }, [node("div", { label: "Photo" }, [node("image", { bind: "image", src: "" })])]);
    const tree = [node("section", motion ? { motion } : {}, [list, node("linkBlock", { href: "/products" }, [node("text", { text: "View all" }), node("icon", { name: "arrow" })])])];
    const product = { id: "p1", title: "P", href: "/p", image: "https://cdn.test/p.jpg", secondImage: "https://cdn.test/p-b.jpg", price: 1 };
    return render(custom(tree), { catalog: { products: { [list.id]: [product] }, categories: [] } });
  };

  it("marks the photo swap and text links in v2 sections only", () => {
    const v2 = card(2);
    expect(v2).toContain('<span class="group/pc relative isolate block w-full" data-sf-swap="">');
    expect(v2).toMatch(/aria-hidden="true" class="absolute! inset-0 block size-full! object-cover" loading="lazy" decoding="async" fetchPriority="low"/);
    expect(v2).toMatch(/data-node-type="linkBlock"[^>]*data-sf-link=""/);
    // A v1 section keeps today's markup exactly (the 500ms swap, no new attributes).
    const v1 = card();
    expect(v1).toContain('<span class="group/pc relative isolate block w-full">');
    expect(v1).toContain("transition-opacity duration-500 ease-in-out group-hover/pc:opacity-0");
    expect(v1).not.toMatch(/data-sf-(swap|link)|fetchPriority="low"/);
  });
});

/** `[prelude, body]` of each top-level block of a CSS string. */
function blocks(css: string): [string, string][] {
  const out: [string, string][] = [];
  let depth = 0;
  let start = 0;
  let prelude = "";
  for (let i = 0; i < css.length; i++) {
    if (css[i] === "{") {
      if (depth === 0) {
        prelude = css.slice(start, i).trim();
        start = i + 1;
      }
      depth++;
    } else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        out.push([prelude, css.slice(start, i)]);
        start = i + 1;
      }
    }
  }
  return out;
}

describe("scroll effect CSS", () => {
  it("moves nothing outside no-preference screens with Animations on", () => {
    for (const [prelude, body] of blocks(MOTION_CSS_SCROLL)) {
      const moving = /animation|translate|scale|transition|position:sticky/.test(body);
      if (!moving) continue;
      expect(prelude, prelude).toMatch(/^@media screen and (\(min-width:768px\) and (\(min-height:600px\) and )?)?\(prefers-reduced-motion:no-preference\)$/);
      for (const [selector, rule] of blocks(body)) {
        if (selector.startsWith("@keyframes") || selector.startsWith("@supports")) {
          for (const [inner] of blocks(rule)) if (!/^(from|to|\d+%)$/.test(inner)) expect(inner, inner).toContain(':not([data-sf-motion="off"])');
          continue;
        }
        expect(selector, selector).toContain(':not([data-sf-motion="off"])');
      }
    }
  });

  it("uses CSS scroll timelines where supported, the engine's variables elsewhere", () => {
    expect(MOTION_CSS_SCROLL).toContain("@supports (animation-timeline:view()){");
    expect(MOTION_CSS_SCROLL).toContain("@supports not (animation-timeline:view()){");
    expect(MOTION_CSS_SCROLL).toContain("animation-range:exit-crossing 0% exit-crossing 100%");
    // The fallback waits for the engine (`data-sf-live`): without script nothing moves.
    for (const effect of ["parallax", "zoom", "fade-exit", "progress"]) {
      expect(MOTION_CSS_SCROLL).toContain(`[data-sf-scroll="${effect}"][data-sf-live]{`);
    }
    expect(MOTION_CSS_SCROLL).toContain("var(--sf-progress");
    expect(MOTION_CSS_SCROLL).toContain("var(--sf-exit");
    expect(MOTION_CSS_SCROLL).toContain("--sf-r:calc(0.08 * var(--sf-intensity,1))");
  });

  it("grows progress bars from the reading start (right in Arabic)", () => {
    expect(MOTION_CSS_SCROLL).toContain('.sf-site:not([data-sf-motion="off"]) [data-sf-scroll="progress"]{transform-origin:left center}');
    expect(MOTION_CSS_SCROLL).toContain(':is([dir="rtl"] .sf-site:not([data-sf-motion="off"]),.sf-site:not([data-sf-motion="off"])[dir="rtl"]) [data-sf-scroll="progress"]{transform-origin:right center}');
  });

  it("shows every step's text and the first photo without the engine, and stacks steps where the column can't follow", () => {
    expect(MOTION_CSS_SCROLL).toContain('[data-sf-steps]:not([data-sf-step]) [data-sf-step-media]:not([data-sf-step-media="0"]){opacity:0}');
    expect(MOTION_CSS_SCROLL).toContain("@media (max-width:767.98px),print,(prefers-reduced-motion:reduce){[data-sf-steps-media]{display:none}}");
    expect(MOTION_CSS_SCROLL).toContain('.sf-site[data-sf-motion="off"] [data-sf-steps-media]{display:none}');
    // Text dims only once the engine sets a step, and never while its own reveal runs.
    expect(MOTION_CSS_SCROLL).toContain("[data-sf-step] [data-sf-step-item]:not([data-reveal]){opacity:0.35");
    expect(MOTION_CSS_SCROLL).toContain('[data-sf-step="2"] [data-sf-step-item="2"]:not([data-reveal]){opacity:1}');
  });

  it("scopes the hover polish to v2 sections, a fine pointer and no-preference", () => {
    for (const [prelude, body] of blocks(MOTION_CSS_POLISH)) {
      expect(prelude).toMatch(/prefers-reduced-motion:no-preference/);
      for (const [selector] of blocks(body)) if (!selector.startsWith("@keyframes")) expect(selector, selector).toContain('[data-sf-mv="2"]');
    }
    expect(MOTION_CSS_POLISH).toContain("[data-sf-swap]>img+img{scale:1.04;transition:scale .7s cubic-bezier(.22,1,.36,1)}");
    expect(MOTION_CSS_POLISH).toContain('[dir="rtl"] :where(.sf-site:not([data-sf-hover="none"]) [data-sf-mv="2"]) [data-sf-link]:is(:hover,:focus-visible) [data-node-type="icon"]{translate:-3px 0}');
  });
});
