import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionInstanceSchema, type ComponentNode } from "../config/schema";
import type { RenderContext } from "../core/types";
import { MAX_ELEMENT_DEPTH, MAX_NODES_PER_SECTION, getElementDefinition } from "../elements/registry";
import { countNodes, treeDepth } from "../elements/tree";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { DESIGNS, getDesign, instantiateDesign } from ".";

/** Designs this test expects to exist; each later design adds its id here. */
const EXPECTED = ["stats-cards", "hero-split", "about-story"];

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
    const instance = instantiateDesign(design, { id: "d1" });
    for (const locale of ["ar", "en"] as const) {
      for (const mode of ["edit", "public"] as const) {
        const html = renderToStaticMarkup(
          <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx({ locale, mode, dir: locale === "ar" ? "rtl" : "ltr" })} />,
        );
        expect(html).toContain("<section data-node-id=");
      }
    }
  });

  it.each(DESIGNS.map((d) => [d.id, d] as const))("%s matches its snapshot (ar, public)", (_id, design) => {
    const instance = instantiateDesign(design, { id: "d1" });
    expect(renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx()} />)).toMatchSnapshot();
  });

  it.each(DESIGNS.map((d) => [d.id, d] as const))("%s keeps image frames sized without a photo", (_id, design) => {
    // An empty image draws nothing publicly; the frame around it must keep its size.
    for (const node of walk(instantiateDesign(design, { id: "d1" }).componentTree!)) {
      if (!node.children.some((c) => c.type === "image")) continue;
      expect(node.style?.minHeight, `${node.props.label}`).toBeGreaterThan(0);
      expect(node.breakpointStyles?.mobile?.minHeight, `${node.props.label} (mobile)`).toBeGreaterThan(0);
    }
  });

  it("gives two inserted copies of a design no shared node ids", () => {
    for (const design of DESIGNS) {
      const a = new Set(walk(instantiateDesign(design, { id: "a" }).componentTree!).map((n) => n.id));
      const b = walk(instantiateDesign(design, { id: "b" }).componentTree!).map((n) => n.id);
      expect(b.some((id) => a.has(id)), design.id).toBe(false);
    }
  });
});
