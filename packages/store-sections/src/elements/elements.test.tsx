import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { withHomeSections } from "../config/fixtures.test-utils";
import { validateSiteConfig } from "../config/validate";
import type { ComponentNode, SectionInstance } from "../config/schema";
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
  const site = (tree: ComponentNode[]) => withHomeSections([custom(tree)]);

  it("rejects too many elements", () => {
    const big = Array.from({ length: 160 }, () => node("vFlex", {}, [node("text")]));
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
