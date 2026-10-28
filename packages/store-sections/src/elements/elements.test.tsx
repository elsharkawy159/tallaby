import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { withHomeSections } from "../config/fixtures.test-utils";
import { validateSiteConfig } from "../config/validate";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { sectionText } from "../core/copy";
import { resolveSectionForLocale } from "../core/locale";
import type { RenderContext } from "../core/types";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { LAYOUT_PRESETS } from "./presets";
import { ELEMENT_DEFINITIONS, MAX_NODES_PER_SECTION, PALETTE_TYPES } from "./registry";
import {
  canContain,
  cloneWithNewIds,
  countNodes,
  createNode,
  duplicateNode,
  findParent,
  fromTemplate,
  insertNode,
  moveNode,
  newTreeSection,
  removeNode,
  wrapNodes,
} from "./tree";

let n = 0;
const makeId = () => `n${++n}`;

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
  formatPrice: (v) => `${v}`,
  ...over,
});

const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({
  id: makeId(),
  type: type as ComponentNode["type"],
  props,
  children,
});

const custom = (tree: ComponentNode[]): SectionInstance => ({ id: "c1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree });
const render = (instance: SectionInstance, over: Partial<RenderContext> = {}) =>
  renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" />);

describe("element renderer", () => {
  it("renders every palette element with a node id", () => {
    for (const type of PALETTE_TYPES) {
      const html = render(custom([createNode(type, makeId)]), { mode: "edit" });
      expect(html, type).toContain(`data-node-type="${type}"`);
    }
  });

  it("prints text as text and blocks unsafe links", () => {
    const html = render(
      custom([node("heading", { text: "<script>x</script>", level: "h1" }), node("button", { label: "Go", href: "javascript:alert(1)" })]),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<h1");
  });

  it("plays YouTube from a privacy-enhanced embed, behind a thumbnail unless autoplay", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    const facade = render(custom([node("video", { url, title: "Demo" })]));
    expect(facade).toContain("<iframe");
    expect(facade).toContain("srcDoc=");
    expect(facade).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(facade).toContain("i.ytimg.com/vi/dQw4w9WgXcQ");

    const autoplay = render(custom([node("video", { url, autoplay: true })]));
    expect(autoplay).not.toContain("srcDoc=");
    expect(autoplay).toContain("autoplay=1&amp;mute=1");

    // No link: nothing publicly; a still with a hint on the canvas (no player to swallow clicks).
    expect(render(custom([node("video", { url: "https://vimeo.com/1" })]))).not.toContain("data-node-type=\"video\"");
    const edit = render(custom([node("video", { url })]), { mode: "edit" });
    expect(edit).toContain('data-node-type="video"');
    expect(edit).not.toContain("<iframe");
  });

  it("plays a background video muted on a loop over its poster, and only the poster without a file", () => {
    const file = "https://videos.example.com/hero.mp4";
    const html = render(custom([node("video", { url: file, background: true, poster: "hero.jpg" })]));
    expect(html).toContain('src="https://cdn/hero.jpg"');
    expect(html).toMatch(/<video[^>]*autoplay=""[^>]*muted=""[^>]*loop=""[^>]*playsinline=""/i);
    expect(html).not.toContain("controls");
    expect(html).toContain("motion-reduce:hidden");
    // A site link (not a file), or the canvas: the poster alone.
    expect(render(custom([node("video", { url: "https://youtu.be/dQw4w9WgXcQ", background: true, poster: "hero.jpg" })]))).not.toContain("<video");
    const edit = render(custom([node("video", { url: file, background: true, poster: "hero.jpg" })]), { mode: "edit" });
    expect(edit).toContain("https://cdn/hero.jpg");
    expect(edit).not.toContain("<video");
  });

  it("plays a playlist row in the playlist's own frame", () => {
    const item = (id: string, url: string, title: string): ComponentNode => ({ id, type: "videoItem" as ComponentNode["type"], props: { url, title }, children: [] });
    const playlist: ComponentNode = {
      id: "pl1",
      type: "videoPlaylist" as ComponentNode["type"],
      props: { listPosition: "end" },
      children: [item("i1", "https://youtu.be/dQw4w9WgXcQ", "First"), item("i2", "https://www.tiktok.com/@s/video/7231338487075638570", "Second"), item("i3", "nope", "Broken")],
    };
    const html = render(custom([playlist]));
    expect(html).toContain('name="vp-pl1"');
    expect(html.match(/target="vp-pl1"/g)).toHaveLength(2);
    expect(html).toContain("https://www.tiktok.com/player/v1/7231338487075638570?");
    // A row without a playable link is left out publicly but stays selectable on the canvas.
    expect(html).not.toContain("Broken");
    const edit = render(custom([playlist]), { mode: "edit" });
    expect(edit).toContain('data-node-id="i3"');
    expect(edit).not.toContain("<iframe");
    expect(edit).not.toContain("target=");
  });

  it("draws nothing for unknown or non-palette types", () => {
    const html = render(custom([node("input", { value: "x" }), node("shadcn-dialog")]));
    expect(html).not.toContain("data-node-id");
  });

  it("applies English overlays per node", () => {
    const tree = [node("paragraph", { text: "مرحبا", translations: { en: { text: "Hello" } } })];
    expect(render(custom(tree))).toContain("مرحبا");
    expect(render(custom(tree), { locale: "en", dir: "ltr" })).toContain("Hello");
    expect(resolveSectionForLocale(custom(tree), "en", "ar").componentTree![0]!.props.text).toBe("Hello");
    // The Arabic base is untouched.
    expect(tree[0]!.props.text).toBe("مرحبا");
  });

  it("shows an empty state only in the editor", () => {
    expect(render(custom([]))).toBe('<div data-section-id="c1" data-section-type="custom-section"></div>');
    expect(render(custom([]), { mode: "edit" })).toContain("قسم فارغ");
  });

  it("hides empty images publicly", () => {
    expect(render(custom([node("image", { src: "" })]))).not.toContain("data-node-id");
  });
});

describe("tree operations", () => {
  it("inserts, moves, duplicates and removes immutably", () => {
    const a = node("heading", { text: "a" });
    const box = node("vFlex");
    const tree = [box, a];
    const moved = moveNode(tree, a.id, box.id, 0);
    expect(moved[0]!.children[0]!.id).toBe(a.id);
    expect(tree[0]!.children).toHaveLength(0);
    const dup = duplicateNode(moved, a.id, makeId);
    expect(dup.nodes[0]!.children).toHaveLength(2);
    expect(dup.newId).not.toBe(a.id);
    expect(countNodes(removeNode(dup.nodes, box.id))).toBe(0);
  });

  it("refuses moves into a descendant and children of leaf elements", () => {
    const inner = node("vFlex");
    const outer = node("vFlex", {}, [inner]);
    expect(moveNode([outer], outer.id, inner.id, 0)).toEqual([outer]);
    const text = node("text");
    expect(insertNode([text], text.id, node("text"))).toEqual([text]);
  });

  it("keeps list items in lists and links out of links", () => {
    const list = createNode("list", makeId);
    expect(canContain([list], list.id, node("listItem"))).toBe(true);
    expect(canContain([list], list.id, node("text"))).toBe(false);
    expect(canContain([], null, node("listItem"))).toBe(false);
    const block = node("linkBlock", { href: "/" }, [node("vFlex")]);
    expect(canContain([block], block.children[0]!.id, node("button"))).toBe(false);
    expect(canContain([block], block.children[0]!.id, node("text"))).toBe(true);
  });

  it("wraps siblings in a container", () => {
    const a = node("text");
    const b = node("text");
    const c = node("text");
    const { nodes, wrapperId } = wrapNodes([a, b, c], [c.id, b.id], "hFlex", makeId);
    expect(nodes.map((x) => x.id)).toEqual([a.id, wrapperId]);
    expect(nodes[1]!.children.map((x) => x.id)).toEqual([b.id, c.id]);
    expect(findParent(nodes, c.id)).toEqual({ parentId: wrapperId, index: 1 });
  });

  it("stops at the node limit", () => {
    const many = Array.from({ length: MAX_NODES_PER_SECTION }, () => node("text"));
    expect(insertNode(many, null, node("text"))).toHaveLength(MAX_NODES_PER_SECTION);
  });

  it("gives clones and presets fresh ids", () => {
    const tree = createNode("list", makeId);
    const copy = cloneWithNewIds(tree, makeId);
    expect(copy.id).not.toBe(tree.id);
    expect(copy.children[0]!.id).not.toBe(tree.children[0]!.id);
    for (const preset of LAYOUT_PRESETS) {
      const first = preset.nodes.map((t) => fromTemplate(t, makeId));
      const second = preset.nodes.map((t) => fromTemplate(t, makeId));
      expect(first[0]!.id).not.toBe(second[0]!.id);
      expect(render(custom(first)), preset.id).toContain("data-node-id");
    }
  });

  it("has one definition per type", () => {
    expect(new Set(ELEMENT_DEFINITIONS.map((d) => d.type)).size).toBe(ELEMENT_DEFINITIONS.length);
  });
});

describe("validation", () => {
  const site = (tree: ComponentNode[]) => ({ ...withHomeSections([custom(tree)]), header: null, footer: null });

  it("rejects too many elements", () => {
    const big = Array.from({ length: 160 }, () => node("vFlex", {}, [node("text"), node("text")]));
    const result = validateSiteConfig(site(big), { allowedSections: storeSectionRegistry.allowedSections() });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.map((i) => i.code)).toContain("tree_too_large");
  });

  it("keeps only whitelisted element styles", () => {
    const styled = node("text");
    styled.style = { color: "primary", content: "x", fontSize: "lg" };
    const ok = validateSiteConfig(site([styled]), { allowedSections: storeSectionRegistry.allowedSections() });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.pages[0]!.content.sections[0]!.componentTree![0]!.style).toEqual({ color: "primary", fontSize: "lg" });
  });
});

describe("tree section elements", () => {
  it("renders a section root as a <section> with no extra wrapper", () => {
    const root = node("section", {}, [node("heading", { text: "Hi" })]);
    const html = render(custom([root]));
    expect(html).toMatch(new RegExp(`^<div[^>]*data-section-id="c1"[^>]*><section data-node-id="${root.id}"`));
    expect(html).not.toContain("py-(--sf-section-y,48px)");
  });

  it("keeps the padded wrapper for an old custom section without a section root", () => {
    const html = render(custom([node("heading", { text: "Hi" })]));
    expect(html).toContain('<section class="relative isolate py-(--sf-section-y,48px)">');
  });

  it("allows a section only as the single root", () => {
    const section = node("section");
    expect(canContain([], null, section)).toBe(true);
    const tree = [node("section", {}, [node("div")])];
    expect(canContain(tree, null, node("section"))).toBe(false);
    expect(canContain(tree, tree[0]!.id, node("section"))).toBe(false);
    expect(PALETTE_TYPES).not.toContain("section");
  });

  it("puts root-level inserts and moves inside the section root", () => {
    const heading = node("heading", { text: "Hi" });
    const tree = [node("section", {}, [node("div", {}, [heading])])];
    const inserted = insertNode(tree, null, node("text"));
    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.children.map((c) => c.type)).toEqual(["div", "text"]);
    const moved = moveNode(tree, heading.id, null, 0);
    expect(moved).toHaveLength(1);
    expect(moved[0]!.children[0]!.id).toBe(heading.id);
  });

  it("keeps the drop position when redirecting a root-level drop into the section root", () => {
    const tree = [node("section", {}, [node("pattern"), node("div")])];
    expect(insertNode(tree, null, node("text"), 0)[0]!.children[0]!.type).toBe("text");
    expect(insertNode(tree, null, node("text"), 1)[0]!.children.map((c) => c.type)).toEqual(["pattern", "div", "text"]);
  });

  it("wraps loose nodes in a new section root", () => {
    const heading = node("heading", { text: "Hi" });
    const tree = newTreeSection([heading], makeId);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.type).toBe("section");
    expect(tree[0]!.children[0]).toBe(heading);
    const root = node("section", {}, [node("div")]);
    expect(newTreeSection([root], makeId)).toEqual([root]);
  });

  it("draws nothing publicly for an emptied section, card or decoration-only section", () => {
    expect(render(custom([node("section")]))).not.toContain("<section");
    expect(render(custom([node("section", {}, [node("pattern")])]))).not.toContain("<section");
    expect(render(custom([node("section", {}, [node("card"), node("text", { text: "x" })])]))).not.toContain('data-node-type="card"');
    expect(render(custom([node("section")]), { mode: "edit" })).toContain("<section");
  });

  it("lets an emptied accordion take items from the palette again", () => {
    expect(PALETTE_TYPES).toContain("accordionItem");
    const tree = [node("accordion")];
    expect(canContain(tree, tree[0]!.id, node("accordionItem"))).toBe(true);
    expect(canContain([], null, node("accordionItem"))).toBe(false);
    expect(render(custom(tree), { mode: "edit" })).toContain(sectionText("emptyAccordion", "ar"));
  });

  it("renders a pattern hidden from assistive tech", () => {
    const html = render(custom([node("section", {}, [node("pattern", { variant: "dots" }), node("text", { text: "x" })])]));
    expect(html).toMatch(/data-node-type="pattern"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-node-type="pattern"/);
  });

  it("renders accordion items as details/summary and respects open", () => {
    const tree = [
      node("accordion", {}, [
        node("accordionItem", { title: "Q1", open: true }, [node("paragraph", { text: "A1" })]),
        node("accordionItem", { title: "Q2" }, [node("paragraph", { text: "A2" })]),
      ]),
    ];
    const html = render(custom(tree));
    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html).toMatch(/<details[^>]*open=""[^>]*>\s*<summary[^>]*>Q1/);
    expect(html).toMatch(/<details(?![^>]*open)[^>]*>\s*<summary[^>]*>Q2/);
    expect(canContain(tree, tree[0]!.id, node("paragraph"))).toBe(false);
  });

  it("shows an empty-container hint only in the editor", () => {
    const tree = [node("section", {}, [node("grid")])];
    expect(render(custom(tree), { mode: "edit" })).toContain("data-editor-only");
    expect(render(custom(tree))).not.toContain("data-editor-only");
    expect(render(custom(tree), { mode: "edit" })).not.toContain("اسحب عناصر");
    expect(render(custom(tree), { mode: "edit", locale: "en" })).not.toContain("Drop elements here");
  });
});

describe("carousel element", () => {
  const slides = () => [node("slide", {}, [node("heading", { text: "S1" })]), node("slide", {}, [node("heading", { text: "S2" })])];

  it("renders a snapping track with hidden controls for the runtime, and only static markup in the editor", () => {
    const tree = [node("section", {}, [node("carousel", { autoplay: true, interval: 7 }, slides())])];
    const html = render(custom(tree));
    expect(html).toContain('data-carousel=""');
    expect(html).toContain('data-interval="7000"');
    expect(html).toContain("snap-x");
    expect(html.match(/data-carousel-slide/g)).toHaveLength(2);
    expect(html.match(/data-carousel-dot=/g)).toHaveLength(2);
    expect(html).toContain("group-data-[carousel-ready]/carousel:flex");
    const edit = render(custom(tree), { mode: "edit" });
    expect(edit).not.toContain("data-carousel=");
    expect(edit).not.toContain("data-carousel-dot");
  });

  it("clamps the interval and keeps a single slide without controls", () => {
    const html = render(custom([node("section", {}, [node("carousel", { interval: 999, autoplay: false }, [node("slide", {}, [node("text", { text: "x" })])])])]));
    expect(html).toContain('data-interval="15000"');
    expect(html).toContain('data-autoplay="0"');
    expect(html).not.toContain("data-carousel-dot");
  });

  it("keeps slides in carousels and carousels holding only slides", () => {
    const tree = [node("section", {}, [node("carousel", {}, slides())])];
    const carousel = tree[0]!.children[0]!;
    expect(canContain(tree, carousel.id, node("slide"))).toBe(true);
    expect(canContain(tree, carousel.id, node("heading"))).toBe(false);
    expect(canContain(tree, tree[0]!.id, node("slide"))).toBe(false);
    expect(canContain(tree, carousel.children[0]!.id, node("image"))).toBe(true);
  });

  it("passes validation", () => {
    const tree = [node("section", {}, [node("carousel", {}, slides())])];
    expect(validateSiteConfig(withHomeSections([custom(tree)])).success).toBe(true);
  });
});
