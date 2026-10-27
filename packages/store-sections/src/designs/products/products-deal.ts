/**
 * Deal of the day (Claude Design premium set, `dealOfDay`; 2026-10-27): one
 * real product on sale (the first `discounted` product, bound like every
 * card): a large photo with its discount chip, then the name, rating, price
 * with the old price struck through, a countdown to the deal's end and a
 * full-width Add to cart. A store with nothing on sale shows nothing, and the
 * countdown stays hidden until the seller sets the real end date.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { SHOP_LINK, PRODUCT_NAME, productPhoto } from "./_shared";

export const productsDeal = defineDesign({
  id: "products-deal",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("عرض اليوم", "Deal of the day"),
  description: L(
    "منتج واحد عليه خصم بصورة كبيرة وسعره وعداد لنهاية العرض وزر إضافة للسلة.",
    "One discounted product with a big photo, its price, a countdown to the deal's end and an add-to-cart button.",
  ),
  keywords: ["deal", "deal of the day", "offer", "sale", "countdown", "product", "عرض اليوم", "خصم", "عداد", "منتج"],
  tree: (t) =>
    t.section({ label: L("عرض اليوم", "Deal of the day"), style: { background: "secondary" } }, [
      t.container(
        [
          t.productList(
            [
              t.grid(
                [
                  productPhoto(t, { ratio: "square", radius: 20, chip: false }),
                  t.stack(
                    [
                      t.badge(L("عرض اليوم", "Deal of the day"), { role: "eyebrow", style: { background: "primary", color: "primaryInk", fontWeight: "bold" } }),
                      t.link(SHOP_LINK, [t.heading(PRODUCT_NAME, "h2", { bind: "title", style: { fontSize: "display-sm", lineHeight: "tight" } })], {
                        label: L("اسم المنتج", "Product name"),
                        bind: "href",
                        style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground", hover: { color: "primary" } },
                      }),
                      t.row(
                        [
                          t.icon("star", { style: { color: "accent", fontSize: "md" } }),
                          t.text(L("٤٫٨", "4.8"), { bind: "rating", style: { fontWeight: "semibold", fontSize: "sm" } }),
                        ],
                        { label: L("التقييم", "Rating"), style: { gap: 6, alignItems: "center", wrap: false } },
                      ),
                      t.row(
                        [
                          t.text(L("٢٥٠ ج.م", "EGP 250"), { bind: "price", style: { fontWeight: "extrabold", fontSize: "3xl", color: "primary" } }),
                          t.text(L("٣٢٠ ج.م", "EGP 320"), { bind: "compareAtPrice", style: { color: "muted", fontSize: "lg", italic: true } }),
                          t.badge(L("-٢٢٪", "-22%"), { bind: "discount", style: { background: "accent", color: "foreground", fontWeight: "bold" } }),
                        ],
                        { label: L("السعر", "Price"), style: { gap: 12, alignItems: "center" } },
                      ),
                      t.countdown({ label: L("العداد", "Countdown"), caption: L("العرض بينتهي خلال", "Ends in"), style: { color: "foreground" } }),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    { label: L("التفاصيل", "Details"), style: { gap: 18, justifyContent: "center" }, mobile: { gap: 14 } },
                  ),
                ],
                {
                  label: L("بطاقة العرض", "Deal card"),
                  columns: { desktop: 2, tablet: 2, mobile: 1 },
                  style: { gap: 48, alignItems: "center", background: "background", radius: 28, paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                  tablet: { gap: 28 },
                  mobile: { gap: 20, radius: 20, paddingTop: 12, paddingBottom: 18, paddingStart: 12, paddingEnd: 12 },
                },
              ),
            ],
            { label: L("المنتج", "Product"), role: "items", source: "discounted", limit: 1, columns: { desktop: 1, tablet: 1, mobile: 1 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
