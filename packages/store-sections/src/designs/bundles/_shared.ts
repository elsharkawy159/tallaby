/**
 * Pieces the Bundles designs (library O) share. A tree cannot add several
 * products to the cart at once or sum their prices, so every product a bundle
 * shows comes from a `productList` (bound photo, name and price), while the
 * bundle price, the "instead of" sum and the saving are text the seller types
 * once. The bundle button links to a page the seller picks (for example the
 * bundle listed as its own product).
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";

export const BUNDLE_LINK = "/products";

/** The seller-typed bundle figures. */
export const BUNDLE_PRICE = L("١٬٢٧٠ ج.م", "EGP 1,270");
export const BUNDLE_WAS = L("بدل ١٬٤٩٠ ج.م", "Instead of EGP 1,490");
export const BUNDLE_SAVE = L("وفّر ٢٢٠ ج.م", "Save EGP 220");
export const BUNDLE_PCT = L("خصم ١٥٪", "Save 15%");

/** A round plus sign, absolutely placed on the end side of a product card (joins it to the next one). */
export function plusDisc(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.box([t.icon("plus", { style: { fontSize: "lg", color: "foreground" } })], {
    label: L("علامة الزائد", "Plus sign"),
    style: {
      position: "absolute",
      insetTop: "30%",
      insetEnd: "-50px",
      zIndex: 1,
      background: "secondary",
      radius: 999,
      width: "44px",
      paddingTop: 11,
      paddingBottom: 9,
      textAlign: "center",
      ...style,
    },
    mobile: { hidden: true },
  });
}

/** A small tick and the product's bound name (for "what is inside" lists). */
export function tickName(t: TreeBuilder, color = "primary", textStyle: StyleValues = {}): NodeTemplate {
  return t.row(
    [
      t.icon("check", { style: { fontSize: "md", color } }),
      t.text(L("اسم المنتج", "Product name"), { bind: "title", style: { fontSize: "md", ...textStyle } }),
    ],
    { label: L("قطعة", "Item"), style: { gap: 10, wrap: false } },
  );
}

/** A small muted label above a heading. */
export function smallLabel(t: TreeBuilder, text: DesignText, style: StyleValues = {}): NodeTemplate {
  return t.text(text, { role: "eyebrow", style: { fontSize: "sm", fontWeight: "semibold", color: "muted", ...style } });
}
