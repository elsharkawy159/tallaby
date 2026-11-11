import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { collectCatalogQueries } from "../core/registry";
import { DESIGNS, defineDesign, instantiateDesign } from "../designs";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import {
  MOTION_CSS,
  MOTION_CSS_V1,
  MOTION_CSS_V2,
  MOTION_CSS_POLISH,
  MOTION_CSS_SCROLL,
  REVEAL_CHOICES,
  intensityFactor,
  isMotionV2,
  revealFromV2,
  siteMotionAttrs,
  splitWords,
  wipeInset,
} from "./motion";
import { getElementDefinition } from "./registry";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({
  id: `v${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
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
const reveals = (html: string) => [...html.matchAll(/data-node-type="(\w+)"[^>]*?data-reveal="([\w-]+)"/g)].map((m) => [m[1], m[2]]);

/** Top-level CSS blocks of a minified string: `[prelude, body]`. */
function blocks(css: string): [string, string][] {
  const out: [string, string][] = [];
  let depth = 0;
  let start = 0;
  let open = -1;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === "{") {
      if (depth === 0) open = i;
      depth++;
    } else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        out.push([css.slice(start, open), css.slice(open + 1, i)]);
        start = i + 1;
      }
    }
  }
  return out;
}

describe("the motion v2 marker", () => {
  it("is stamped on the root section of every design and template design, by defineDesign", () => {
    for (const design of DESIGNS) {
      const root = instantiateDesign(design, { id: "d1" }).componentTree![0]!;
      expect(root.props.motion, design.id).toBe(2);
      // Only the root carries it.
      expect(JSON.stringify(root.children)).not.toContain('"motion":2');
    }
    const own = defineDesign({ ...DESIGNS[0]!, id: "x-own", tree: (t) => t.section({}, [t.heading("A", "h2")]) });
    expect(instantiateDesign(own, { id: "o" }).componentTree![0]!.props.motion).toBe(2);
  });

  it("is a known, hidden section prop", () => {
    const section = getElementDefinition("section")!;
    expect(section.systemProps).toContain("motion");
    expect(section.fields.map((f) => f.key)).not.toContain("motion");
    expect(isMotionV2({ motion: 2 })).toBe(true);
    expect(isMotionV2({ motion: "2" })).toBe(false);
    expect(isMotionV2({})).toBe(false);
  });

  it("is drawn as data-sf-mv only on marked sections, in every mode", () => {
    const tree = (props: Record<string, unknown>) => [node("section", props, [node("paragraph", { text: "A" })])];
    expect(render(custom(tree({ motion: 2 })))).toContain('<section data-node-id="v');
    expect(render(custom(tree({ motion: 2 })))).toMatch(/<section [^>]*data-sf-mv="2"/);
    expect(render(custom(tree({ motion: 2 })), { mode: "edit", reveal: false })).toContain('data-sf-mv="2"');
    expect(render(custom(tree({})))).not.toContain("data-sf-mv");
    expect(render(custom(tree({ motion: 3 })))).not.toContain("data-sf-mv");
  });
});

describe("motion v2 CSS", () => {
  it("leaves v1 untouched and appends v2 after it", () => {
    expect(MOTION_CSS).toBe(MOTION_CSS_V1 + MOTION_CSS_V2 + MOTION_CSS_SCROLL + MOTION_CSS_POLISH);
    expect(MOTION_CSS_V1).not.toContain("data-sf-mv");
    expect(MOTION_CSS_V1).not.toContain("wipe");
  });

  it("scopes every retuned reveal to marked sections, and uses the v2 tokens", () => {
    for (const [prelude, body] of blocks(MOTION_CSS_V2)) {
      if (!prelude.startsWith("@media")) continue;
      for (const [selector] of blocks(body)) {
        const v1Variant = /\[data-reveal(?:="(?:fade-up|fade|zoom-in|slide-start|slide-end)")?\](?:\.is-inview|:not)/.test(selector);
        if (v1Variant && !/wipe|words/.test(selector)) expect(selector, selector).toContain('[data-sf-mv="2"]');
      }
    }
    expect(MOTION_CSS_V2).toContain("cubic-bezier(.22,1,.36,1)");
    expect(MOTION_CSS_V2).toContain("--sf-dist:calc(20px * var(--sf-intensity,1))");
    expect(MOTION_CSS_V2).toContain("--sf-zoom:calc(1 + 0.06 * var(--sf-intensity,1))");
    expect(MOTION_CSS_V2).toContain("--sf-dur:calc(0.7s * var(--sf-speed,1))");
    expect(MOTION_CSS_V2).toContain('[data-sf-mv="2"] [data-reveal="zoom-in"].is-inview{clip-path:inset(0);transition:opacity calc(0.6s * var(--sf-speed,1))');
    expect(MOTION_CSS_V2).toContain("transform calc(1s * var(--sf-speed,1)) cubic-bezier(.22,1,.36,1) var(--sf-delay,0s)");
    // The server's stagger step is ignored in v2: the runtime's batch delay replaces it.
    expect(MOTION_CSS_V2).toContain('.sf-motion [data-sf-mv="2"] [data-reveal-step]{--sf-delay:0s}');
    expect(MOTION_CSS_V2).toContain('.sf-site[data-sf-intensity="subtle"]{--sf-intensity:0.6}');
    expect(MOTION_CSS_V2).toContain('.sf-site[data-sf-intensity="expressive"]{--sf-intensity:1.4}');
  });

  it("hides and moves nothing with reduced motion, without the runtime, or with Animations off", () => {
    for (const [prelude, body] of blocks(MOTION_CSS_V2)) {
      if (prelude === "@media (prefers-reduced-motion:no-preference)") {
        // Every rule that hides or moves waits for the runtime (`sf-motion`, never added with
        // reduced motion, with `data-sf-motion="off"` or on the editor canvas).
        for (const [selector, rule] of blocks(body)) {
          if (/opacity:0|transform:(?!none)|clip-path:inset\((?!0\))/.test(rule)) expect(selector, selector).toContain(".sf-motion");
        }
      } else {
        expect(body, prelude).not.toMatch(/opacity|transform|clip-path|transition/);
      }
    }
  });

  it("maps Intensity to a root attribute only when it isn't normal", () => {
    expect(siteMotionAttrs({ intensity: "normal" })).toEqual({});
    expect(siteMotionAttrs({ intensity: "subtle" })).toEqual({ "data-sf-intensity": "subtle" });
    expect(siteMotionAttrs({ intensity: "expressive", speed: "fast" })).toEqual({ "data-sf-intensity": "expressive", "data-sf-speed": "fast" });
    expect(siteMotionAttrs({ intensity: "wild" })).toEqual({});
    expect(intensityFactor("subtle")).toBe(0.6);
    expect(intensityFactor(undefined)).toBe(1);
  });
});

describe("wipe", () => {
  it("grows from the reading start: the left in English, the right in Arabic", () => {
    expect(wipeInset("wipe-start", false, "0%")).toBe("inset(0% 100% 0% 0%)");
    expect(wipeInset("wipe-start", true, "0%")).toBe("inset(0% 0% 0% 100%)");
    expect(wipeInset("wipe-end", false, "0%")).toBe("inset(0% 0% 0% 100%)");
    expect(wipeInset("wipe-end", true, "0%")).toBe("inset(0% 100% 0% 0%)");
    expect(wipeInset("wipe-up", true, "0%")).toBe("inset(100% 0% 0% 0%)");
    expect(MOTION_CSS_V2).toContain('[dir="rtl"] .sf-motion [data-reveal="wipe-start"][data-reveal]:not(.is-inview){clip-path:inset(calc(50% - 50% / var(--sf-zoom)) calc(50% - 50% / var(--sf-zoom)) calc(50% - 50% / var(--sf-zoom)) 100%)}');
    expect(revealFromV2("wipe-start", true)).toEqual({ opacity: 1, transform: "scale(1.06)", clipPath: "inset(2.83% 2.83% 2.83% 100%)" });
    expect(revealFromV2("wipe-start", false).clipPath).toBe("inset(2.83% 100% 2.83% 2.83%)");
  });

  it("is offered on photos only, and plays on photos only", () => {
    const options = (type: string) => getElementDefinition(type)!.fields.find((f) => f.key === "reveal")!.options!.map((o) => o.value);
    expect(options("image")).toEqual(["auto", "fade-up", "fade", "zoom-in", "slide-start", "slide-end", "wipe-start", "wipe-end", "wipe-up", "none"]);
    expect(options("heading")).toContain("words");
    expect(options("heading")).not.toContain("wipe-start");
    expect(options("button")).toEqual(["auto", "fade-up", "fade", "zoom-in", "slide-start", "slide-end", "none"]);
    expect(REVEAL_CHOICES).toContain("wipe-up");
    const html = render(custom([node("section", {}, [node("image", { src: "a.jpg", reveal: "wipe-end" }), node("paragraph", { text: "A", reveal: "wipe-up" })])]));
    expect(reveals(html)).toEqual([
      ["image", "wipe-end"],
      ["paragraph", "fade-up"],
    ]);
  });

  it("as a section Animation, wipes photos from the start and fades the rest up", () => {
    const html = render(
      custom([node("section", {}, [node("heading", { level: "h2", text: "T" }), node("image", { src: "a.jpg" }), node("button", { label: "B", href: "/products" })])], {
        shell: { animation: "wipe" },
      }),
    );
    expect(reveals(html)).toEqual([
      ["heading", "fade-up"],
      ["image", "wipe-start"],
      ["button", "fade-up"],
    ]);
  });
});

describe("words", () => {
  it("splits on whitespace only and keeps Arabic words whole", () => {
    expect(splitWords("عطر فاخر للمساء")).toEqual([{ word: "عطر", step: 0 }, " ", { word: "فاخر", step: 1 }, " ", { word: "للمساء", step: 2 }]);
    expect(splitWords("  two\nlines ")).toEqual(["  ", { word: "two", step: 0 }, "\n", { word: "lines", step: 1 }, " "]);
    expect(splitWords("")).toBeNull();
    expect(splitWords("   ")).toBeNull();
    expect(splitWords(Array.from({ length: 24 }, (_, i) => `w${i}`).join(" "))).not.toBeNull();
    expect(splitWords(Array.from({ length: 25 }, (_, i) => `w${i}`).join(" "))).toBeNull();
    // Word 13 onwards plays with word 12.
    const steps = splitWords(Array.from({ length: 20 }, (_, i) => `w${i}`).join(" "))!.flatMap((p) => (typeof p === "string" ? [] : [p.step]));
    expect(steps.slice(10)).toEqual([10, 11, 11, 11, 11, 11, 11, 11, 11, 11]);
  });

  it("draws one accessible string and the words beside it, hidden from assistive tech", () => {
    const html = render(custom([node("section", {}, [node("heading", { level: "h2", text: "عطر فاخر للمساء", reveal: "words" })])]));
    expect(html).toContain('data-reveal="words"');
    expect(html).toContain('<span class="sr-only">عطر فاخر للمساء</span><span aria-hidden="true">');
    const words = [...html.matchAll(/<span data-w="" style="--i:(\d+)">([^<]*)<\/span>/g)].map((m) => [m[1], m[2]]);
    expect(words).toEqual([
      ["0", "عطر"],
      ["1", "فاخر"],
      ["2", "للمساء"],
    ]);
    // The real spaces are kept between the words.
    expect(html).toContain('عطر</span> <span data-w=""');
    // The visible words read the same as the accessible string.
    const visible = html.match(/<span aria-hidden="true">(.*?)<\/span><\/h2>/)![1]!.replace(/<[^>]+>/g, "");
    expect(visible).toBe("عطر فاخر للمساء");
  });

  it("never splits the hero h1, long text, prices or the editor canvas", () => {
    const long = Array.from({ length: 30 }, () => "كلمة").join(" ");
    const html = render(
      custom([
        node("section", {}, [
          node("heading", { level: "h1", text: "عنوان رئيسي", reveal: "words" }),
          node("paragraph", { text: long, reveal: "words" }),
          node("text", { text: "سطر قصير", reveal: "words" }),
          node("button", { label: "B", href: "/products", reveal: "words" }),
        ]),
      ]),
    );
    expect(reveals(html)).toEqual([
      ["heading", "fade-up"],
      ["paragraph", "fade-up"],
      ["text", "words"],
      ["button", "fade-up"],
    ]);
    expect(html.match(/data-w=""/g)).toHaveLength(2);
    // The canvas edits text in place: plain text there, even with animations previewed.
    const edit = render(custom([node("section", {}, [node("heading", { level: "h2", text: "عطر فاخر", reveal: "words" })])]), { mode: "edit" });
    expect(edit).toContain('data-reveal="words"');
    expect(edit).not.toContain("data-w");
    expect(edit).toContain(">عطر فاخر</h2>");
  });

  it("as a section Animation, plays words on headings and short text and fades the rest up", () => {
    const html = render(
      custom([node("section", {}, [node("heading", { level: "h2", text: "عنوان" }), node("paragraph", { text: "سطر" }), node("image", { src: "a.jpg" })])], {
        shell: { animation: "words" },
      }),
    );
    expect(reveals(html)).toEqual([
      ["heading", "words"],
      ["paragraph", "words"],
      ["image", "fade-up"],
    ]);
  });

  it("keeps words visible without the runtime (hidden only under sf-motion)", () => {
    expect(MOTION_CSS_V2).toContain('.sf-motion [data-reveal="words"][data-reveal]:not(.is-inview) [data-w]{opacity:0;');
    expect(MOTION_CSS_V2.startsWith("[data-w]{display:inline-block}")).toBe(true);
  });
});

describe("rails", () => {
  it("marks sideways rows so the runtime reveals their cards together", () => {
    const card = node("linkBlock", { href: "/p", bind: "href" }, [node("text", { bind: "title", text: "T" })]);
    const list = (props: Record<string, unknown>) => custom([node("section", {}, [node("productList", { ...props }, [card])])]);
    const html = (props: Record<string, unknown>) => {
      const instance = list(props);
      const products = Object.fromEntries(Object.keys(collectCatalogQueries([instance], storeSectionRegistry)).map((key) => [key, [{ id: "p1", title: "A", href: "/p/1", image: "https://cdn.test/p1.jpg", price: 1 }]]));
      return render(instance, { catalog: { products, categories: [] } });
    };
    expect(html({ rail: true })).toContain('data-sf-rail=""');
    expect(html({ mobileRail: true })).toContain('data-sf-rail=""');
    expect(html({})).not.toContain("data-sf-rail");
  });
});
