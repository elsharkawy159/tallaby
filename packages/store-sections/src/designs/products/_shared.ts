/**
 * Product cards of the Products designs (library P). Every visible field is
 * bound to the product the list repeats it for (`elements/data.ts`): the
 * Arabic/English text here is only what the editor shows when the card is
 * moved out of its list. Nothing about a product is typed by the design.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { TreeBuilder } from "../builder";
import { L, PAPER_CARD } from "../_kit";

export const SHOP_LINK = "/products";

/** Bound placeholders, in the store's two languages. */
export const PRODUCT_NAME = L("اسم المنتج", "Product name");
const PRICE = L("٢٥٠ ج.م", "EGP 250");
const WAS = L("٣٠٠ ج.م", "EGP 300");

/** The product photo as a link, with the sale chip on its corner. */
export function productPhoto(t: TreeBuilder, o: { ratio?: StyleValues["aspectRatio"]; radius?: number; chip?: boolean } = {}): NodeTemplate {
  const radius = o.radius ?? 16;
  return t.box(
    [
      t.link(SHOP_LINK, [t.image("", PRODUCT_NAME, { bind: "image", style: { aspectRatio: o.ratio ?? "square", objectFit: "cover", width: "100%" } })], {
        label: L("صورة المنتج", "Product photo"),
        bind: "href",
        style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius, overflow: "hidden", background: "secondary" },
      }),
      ...(o.chip === false
        ? []
        : [
            t.badge(L("-٢٠٪", "-20%"), {
              bind: "discount",
              style: { position: "absolute", insetTop: "10px", insetStart: "10px", background: "accent", color: "foreground", fontWeight: "bold" },
            }),
          ]),
    ],
    {
      label: L("الصورة", "Photo"),
      style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, background: "transparent" },
    },
  );
}

/** Price and, when the product has one, its list price struck through. */
export function priceRow(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.row(
    [
      t.text(PRICE, { bind: "price", style: { fontWeight: "bold", color: "primary", fontSize: "md" } }),
      t.text(WAS, { bind: "compareAtPrice", style: { color: "muted", fontSize: "sm", italic: true } }),
    ],
    { label: L("السعر", "Price"), style: { gap: 8, alignItems: "center", ...style } },
  );
}

/** The product name as a link to its page. */
export function productName(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.link(SHOP_LINK, [t.text(PRODUCT_NAME, { bind: "title", style: { fontWeight: "semibold", lineHeight: "snug", ...style } })], {
    label: L("اسم المنتج", "Product name"),
    bind: "href",
    style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground" },
  });
}

/** A bordered paper card: photo, name, price and the cart button. */
export function productCard(t: TreeBuilder, o: { ratio?: StyleValues["aspectRatio"]; bordered?: boolean } = {}): NodeTemplate {
  const bordered = o.bordered !== false;
  return t.stack(
    [
      productPhoto(t, { ratio: o.ratio, radius: bordered ? 14 : 16 }),
      t.stack([productName(t), priceRow(t)], { label: L("المعلومات", "Details"), style: { gap: 6 } }),
      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
    ],
    {
      label: L("بطاقة المنتج", "Product card"),
      style: bordered ? { ...PAPER_CARD, radius: 18, gap: 12, paddingTop: 10, paddingBottom: 14, paddingStart: 10, paddingEnd: 10 } : { gap: 10 },
    },
  );
}
