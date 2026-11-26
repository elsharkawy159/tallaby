/**
 * Product card styles (`card-styles.ts`): each style changes only props and
 * styles of a product list's card, never the tree's shape, labels, bindings
 * or field names.
 */
import { describe, expect, it } from "vitest";
import type { NodeTemplate } from "../../elements/tree";
import { getDesign } from "..";
import { treeBuilder } from "../builder";
import { assignFieldNames } from "../../templates/library-fields";
import { CARD_STYLE_IDS, applyCardStyle, hasProductList } from "./card-styles";

const flat = (node: NodeTemplate): NodeTemplate[] => [node, ...(node.children ?? []).flatMap(flat)];
const props = (n: NodeTemplate) => (n.props ?? {}) as Record<string, unknown>;
/** The tree's shape: type, label, binding and field of every node, in order. */
const shape = (node: NodeTemplate) => flat(node).map((n) => [n.type, JSON.stringify(props(n).label), props(n).bind, props(n).field, n.children?.length ?? 0]);
/** The same tree without what a card may change (props other than its identity, styles). */
const outsideLists = (node: NodeTemplate): unknown =>
  node.type === "productList" ? { type: node.type } : { ...node, children: node.children?.map(outsideLists) };
const cardOf = (tree: NodeTemplate) => flat(tree).find((n) => n.type === "productList")!.children![0]!;
const cart = (tree: NodeTemplate) => flat(cardOf(tree)).find((n) => n.type === "addToCart")!;

/** Every product design with a list card, and others that hold one (finder, gallery, payment, product page). */
const DESIGN_IDS = [
  "products-grid",
  "products-rail",
  "products-classic",
  "products-category-carousel",
  "products-feature",
  "products-shelf",
  "products-list",
  "products-rows",
  "products-bento",
  "products-minimal",
  "products-boxed",
  "products-campaign",
  "products-tabs-grid",
  "products-spotlight",
  "products-centered-row",
  "finder-use",
  "gallery-shop-look",
  "pay-installments",
  "product-related",
] as const;

const tree = (id: string) => assignFieldNames(getDesign(id)!.tree(treeBuilder));

describe("applyCardStyle", () => {
  it("classic returns the tree itself", () => {
    const t = tree("products-grid");
    expect(applyCardStyle(t, "classic")).toBe(t);
  });

  it.each(DESIGN_IDS)("%s: every style keeps the node count, types, labels, bindings and field names", (id) => {
    const t = tree(id);
    expect(hasProductList(t)).toBe(true);
    for (const style of CARD_STYLE_IDS) {
      const styled = applyCardStyle(t, style, { corners: 12 });
      expect(shape(styled)).toEqual(shape(t));
      // Nothing outside a product list changes.
      expect(outsideLists(styled)).toEqual(outsideLists(t));
      // Style keys are only added or replaced (a ref's style patch merges), and the input is not mutated.
      flat(styled).forEach((n, i) => {
        const before = flat(t)[i]!;
        for (const key of Object.keys(before.style ?? {})) expect(n.style).toHaveProperty(key);
      });
    }
    expect(applyCardStyle(t, "quiet")).not.toBe(t);
    expect(tree(id)).toEqual(t);
  });

  it("quiet hides the cart button on every device and centres a vertical card's text", () => {
    const styled = applyCardStyle(tree("products-grid"), "quiet");
    const button = cart(styled);
    expect(button.style).toMatchObject({ hidden: true });
    expect(button.breakpointStyles).toMatchObject({ tablet: { hidden: true }, mobile: { hidden: true } });
    const title = flat(cardOf(styled)).find((n) => props(n).bind === "title")!;
    expect(title.style).toMatchObject({ textAlign: "center", fontSize: "md" });
  });

  it("quiet never centres a card whose photo sits beside its text", () => {
    const styled = applyCardStyle(tree("products-list"), "quiet");
    const title = flat(cardOf(styled)).find((n) => props(n).bind === "title")!;
    expect(title.style?.textAlign).toBeUndefined();
    expect(cart(styled).style).toMatchObject({ hidden: true });
  });

  it("icon sets the round cart look at the card's bottom end, with room at the end of the text", () => {
    const styled = applyCardStyle(tree("products-grid"), "icon");
    expect(props(cart(styled)).look).toBe("icon");
    expect(cart(styled).style).toMatchObject({ position: "absolute", insetBottom: "0px", insetEnd: "0px" });
    expect(cardOf(styled).style).toMatchObject({ position: "relative" });
    const details = cardOf(styled).children!.find((n) => n.type === "vFlex")!;
    expect(details.style).toMatchObject({ paddingEnd: 48 });
  });

  it("icon keeps the cart in the flow in a row card", () => {
    const styled = applyCardStyle(tree("products-rows"), "icon");
    expect(props(cart(styled)).look).toBe("icon");
    expect(cart(styled).style?.position).toBeUndefined();
  });

  it("outline sets the outline look, full width", () => {
    const styled = applyCardStyle(tree("products-grid"), "outline");
    expect(props(cart(styled)).look).toBe("outline");
    expect(cart(styled).style).toMatchObject({ width: "100%" });
  });

  it("framed makes a paper card whose corners never pass the template's", () => {
    const styled = applyCardStyle(tree("products-grid"), "framed", { corners: 4 });
    expect(cardOf(styled).style).toMatchObject({ borderWidth: 1, borderColor: "border", radius: 4 });
    expect(props(cart(styled)).look).toBeUndefined();
  });

  it("editorial hides the cart and sets the name in the heading font", () => {
    const styled = applyCardStyle(tree("products-grid"), "editorial");
    expect(cart(styled).style).toMatchObject({ hidden: true });
    expect(flat(cardOf(styled)).find((n) => props(n).bind === "title")!.style).toMatchObject({ fontFamily: "heading" });
  });

  it("compact puts the icon over the photo's top end, or at the bottom end when a wishlist heart is there", () => {
    const grid = applyCardStyle(tree("products-grid"), "compact");
    expect(props(cart(grid)).look).toBe("icon");
    expect(cart(grid).style).toMatchObject({ position: "absolute", insetTop: "8px", insetEnd: "8px" });
    const carousel = applyCardStyle(tree("products-category-carousel"), "compact");
    expect(cart(carousel).style).toMatchObject({ position: "absolute", insetBottom: "0px" });
    expect(flat(cardOf(grid)).find((n) => props(n).bind === "price")!.style).toMatchObject({ color: "primary" });
  });

  it("hides a button row that holds only the cart button", () => {
    const styled = applyCardStyle(tree("products-minimal"), "quiet");
    const row = flat(cardOf(styled)).find((n) => n.children?.some((c) => c.type === "addToCart"))!;
    expect(row.style).toMatchObject({ hidden: true });
  });

  it("leaves a tree without a product list unchanged", () => {
    const t = tree("hero-split");
    expect(hasProductList(t)).toBe(false);
    expect(applyCardStyle(t, "framed")).toEqual(t);
  });
});
