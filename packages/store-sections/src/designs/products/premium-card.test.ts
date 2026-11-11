/**
 * The premium product card and the template's product stage (look-first
 * pilot, docs/systems/plan.md §10): the card's parts and frame, the stage a
 * template opts into, and the name's two-line cut.
 */
import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../../config/schema";
import { designSystemToTokens } from "../../core/theme";
import { collectPageCss, normalizeStyle, styleDeclarations } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import { getDesign } from "..";
import { instantiateDesign, treeBuilder } from "../builder";
import { libraryTemplate, type LibraryTemplateSpec } from "../../templates/library-template";
import { premiumCard, productsHead } from "./_shared";

const flat = (node: NodeTemplate): NodeTemplate[] => [node, ...(node.children ?? []).flatMap(flat)];
const binds = (node: NodeTemplate) => flat(node).map((n) => (n.props as { bind?: string }).bind).filter(Boolean);

const PILOT = ["products-grid", "products-rail", "products-category-carousel", "products-feature", "products-spotlight"] as const;

describe("premium product card", () => {
  it("binds the photo, sale chip, name, price and list price, with the cart button last", () => {
    const card = premiumCard(treeBuilder);
    expect(binds(card)).toEqual(["href", "image", "discount", "href", "title", "price", "compareAtPrice"]);
    expect(card.children!.at(-1)!.type).toBe("addToCart");
    expect(flat(premiumCard(treeBuilder, { quickAdd: false })).some((n) => n.type === "addToCart")).toBe(false);
    expect(flat(premiumCard(treeBuilder, { wishlist: true })).some((n) => n.type === "wishlistButton")).toBe(true);
  });

  it("has no border and no shadow, and cuts the name at two lines", () => {
    const nodes = flat(premiumCard(treeBuilder));
    for (const n of nodes) {
      expect(n.style?.borderWidth).toBeUndefined();
      expect(n.style?.shadow).toBeUndefined();
    }
    const name = nodes.find((n) => (n.props as { bind?: string }).bind === "title")!;
    expect(name.style).toMatchObject({ fontWeight: "normal", lineClamp: 2 });
    const chip = nodes.find((n) => n.type === "badge")!;
    expect(chip.style).toMatchObject({ position: "absolute", insetTop: "10px", insetStart: "10px" });
  });

  it("the frame falls back to the design's ratio on the secondary colour", () => {
    const nodes = flat(premiumCard(treeBuilder, { ratio: "square" }));
    expect(nodes.find((n) => n.type === "image")!.style).toMatchObject({ aspectRatio: "square", objectFit: "cover" });
    expect(nodes.find((n) => n.type === "linkBlock")!.style).toMatchObject({ background: "secondary", overflow: "hidden" });
  });

  it("the heading puts View all at the end and stacks it under the title on phones", () => {
    const head = productsHead(treeBuilder, { title: { ar: "عنوان", en: "Title" }, link: { href: "/products" } });
    expect(head.style).toMatchObject({ justifyContent: "between", alignItems: "end" });
    expect(head.breakpointStyles?.mobile).toMatchObject({ direction: "column", alignItems: "start" });
    const title = flat(head).find((n) => n.type === "heading")!;
    expect(title.props).toMatchObject({ level: "h2", reveal: "words" });
  });

  it.each(PILOT)("%s: every product photo in a list reads the product stage", (id) => {
    const instance: SectionInstance = instantiateDesign(getDesign(id)!, { id: "s1" });
    const css = collectPageCss([instance]);
    const walk = (nodes: SectionInstance["componentTree"], inList = false): string[] =>
      (nodes ?? []).flatMap((n) => [
        ...(inList && n.type === "image" && n.props.bind === "image" ? [n.id] : []),
        ...walk(n.children, inList || n.type === "productList"),
      ]);
    const photos = walk(instance.componentTree);
    expect(photos.length).toBeGreaterThan(0);
    for (const nodeId of photos) expect(css).toMatch(new RegExp(`\\[data-node-id="${nodeId}"\\]\\{[^}]*aspect-ratio:var\\(--sf-stage-ratio,`));
  });
});

describe("line clamp", () => {
  it("is a bounded number that writes the clamp declarations", () => {
    expect(normalizeStyle({ lineClamp: 2 })).toEqual({ lineClamp: 2 });
    expect(normalizeStyle({ lineClamp: 99 })).toEqual({ lineClamp: 4 });
    expect(normalizeStyle({ lineClamp: "2" })).toEqual({});
    expect(styleDeclarations({ lineClamp: 2 })).toEqual(["display:-webkit-box", "-webkit-box-orient:vertical", "-webkit-line-clamp:2", "overflow:hidden"]);
  });
});

describe("a template's product stage", () => {
  const spec = (over: Partial<LibraryTemplateSpec> = {}): LibraryTemplateSpec => ({
    key: "stage-test",
    version: 1,
    name: { ar: "تجربة", en: "Test" },
    description: { ar: "تجربة", en: "Test" },
    category: "fashion",
    style: ["luxe"],
    sortOrder: 1,
    palette: ["#ffffff"],
    colors: { primary: "#111111" },
    fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
    radius: 0,
    header: getDesign("header-centered")!,
    footer: getDesign("footer-classic")!,
    pages: [{ slug: "home", name: { ar: "الرئيسية", en: "Home" }, sections: [getDesign("products-grid")!] }],
    demo: { store: { name: { ar: "متجر", en: "Store" }, description: { ar: "", en: "" } }, categories: [], products: [] },
    ...over,
  });

  it("is written to the design system only when the template sets it", () => {
    expect(libraryTemplate(spec()).config().designSystem.spacing.productStage).toBeUndefined();
    const staged = libraryTemplate(spec({ productStage: { ratio: "4:5", fit: "cover", background: "#f4f1ec" } })).config().designSystem;
    expect(staged.spacing.productStage).toEqual({ ratio: "4:5", fit: "cover", background: "#f4f1ec" });
    expect(designSystemToTokens(staged)).toMatchObject({ "--sf-stage-ratio": "4 / 5", "--sf-stage-fit": "cover", "--sf-stage-bg": "#f4f1ec" });
  });
});
