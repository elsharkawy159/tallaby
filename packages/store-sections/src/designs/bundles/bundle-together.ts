/**
 * Bought together (O-k): a row of product photos joined by plus signs, and
 * beside it a ruled list of the same products with name, price and a cart
 * button each. The design's tick boxes, live total and "this item" row need
 * a script and the current product, so the shopper adds each piece on its
 * own; the seller picks the products. Mobile hides the photo row.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { productPhoto } from "../products/_shared";
import { plusDisc } from "./_shared";

export const bundleTogether = defineDesign({
  id: "bundle-together",
  version: 1,
  category: "bundles",
  subcategory: "fixed",
  name: L("بيتشتروا مع بعض", "Bought together"),
  description: L("منتجات بتتشترى مع بعض كتير، كل واحد بزرار السلة بتاعه.", "Products often bought together, each with its own cart button."),
  keywords: ["bundles", "frequently bought together", "cross-sell", "باقة", "بيتشتروا مع بعض", "مقترحات"],
  tree: (t) =>
    t.section({ label: L("بيتشتروا مع بعض", "Bought together") }, [
      t.container(
        [
          t.heading(L("بيتشتروا مع بعض كتير", "Often bought together"), "h2", {
            role: "title",
            style: { fontSize: "display-sm", letterSpacing: "tight", marginBottom: 24 },
          }),
          t.grid(
            [
              t.productList([t.box([productPhoto(t, { ratio: "square", radius: 16, chip: false }), plusDisc(t, { insetEnd: "-46px" })], { label: L("صورة", "Photo"), style: { position: "relative" } })], {
                label: L("الصور", "Photos"),
                source: "newest",
                limit: 3,
                columns: { desktop: 3 },
                style: { gap: 48 },
                mobile: { hidden: true },
              }),
              t.productList(
                [
                  t.row(
                    [
                      t.row(
                        [
                          t.icon("check", { style: { fontSize: "md", color: "primary" } }),
                          t.text(L("اسم المنتج", "Product name"), { bind: "title", style: { fontWeight: "medium" } }),
                        ],
                        { label: L("القطعة", "Item"), style: { gap: 10, wrap: false } },
                      ),
                      t.row(
                        [
                          t.text(L("٢٥٠ ج.م", "EGP 250"), { bind: "price", style: { fontWeight: "semibold" } }),
                          t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                        ],
                        { label: L("الشراء", "Buy"), style: { gap: 12, wrap: false } },
                      ),
                    ],
                    {
                      label: L("سطر", "Line"),
                      style: { justifyContent: "between", alignItems: "center", gap: 12, minHeight: 64, paddingTop: 10, paddingBottom: 10, borderWidth: 1, borderColor: "border", radius: 14, paddingStart: 16, paddingEnd: 16 },
                      mobile: { paddingStart: 12, paddingEnd: 12 },
                    },
                  ),
                ],
                { label: L("القائمة", "List"), role: "items", source: "newest", limit: 3, columns: { desktop: 1 }, style: { gap: 8 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 48, alignItems: "center" }, mobile: { gap: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
