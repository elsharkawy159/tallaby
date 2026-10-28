/**
 * Category carousel (2026-10-28): one row of the store's products from one
 * category, under that category's own name and its "View all" link. The
 * category is picked by its place in the store (`categoryIndex`, 1 = the
 * first), so a template's four rows show the first four categories of any
 * store that applies it. The heading is a one-category list at the same
 * place (`offset` = place − 1), so the name and link always match the
 * products. A carousel row (`rail`): four cards in view on desktop with
 * arrows, and on phones it swipes sideways.
 * Change the place on both lists to show another category. Cards show
 * square photos (furniture and packshots are rarely tall); the photo layer
 * is labelled so a template can set its ratio and frame.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L, arrowLink } from "../_kit";
import { CATEGORY_LINK } from "../categories/_shared";
import { PRODUCT_NAME, SHOP_LINK, priceRow, productName } from "./_shared";

/** The card: the photo (sale chip, heart) on a soft frame, name, price and the cart button. */
function card(t: TreeBuilder): NodeTemplate {
  return t.stack(
    [
      t.box(
        [
          t.link(
            SHOP_LINK,
            [t.image("", PRODUCT_NAME, { label: L("صورة البطاقة", "Card photo"), bind: "image", style: { aspectRatio: "square", objectFit: "cover", width: "100%" } })],
            { label: L("صورة المنتج", "Product photo"), bind: "href", style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 16, overflow: "hidden", background: "secondary" } },
          ),
          t.badge(L("-٢٠٪", "-20%"), {
            bind: "discount",
            style: { position: "absolute", insetTop: "10px", insetStart: "10px", background: "primary", color: "primaryInk", fontWeight: "semibold", fontSize: "xs", radius: 999 },
          }),
          t.wishlistButton({ label: L("المفضلة", "Wishlist"), style: { position: "absolute", insetTop: "8px", insetEnd: "8px" } }),
        ],
        { label: L("الصورة", "Photo"), style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, background: "transparent" } },
      ),
      t.stack([productName(t, { fontWeight: "medium" }), priceRow(t)], { label: L("المعلومات", "Details"), style: { gap: 6 } }),
      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
    ],
    { label: L("بطاقة المنتج", "Product card"), style: { gap: 12 } },
  );
}

export const productsCategoryCarousel = defineDesign({
  id: "products-category-carousel",
  version: 1,
  category: "products",
  subcategory: "by-category",
  name: L("منتجات قسم", "Category carousel"),
  description: L(
    "صف منتجات من قسم واحد بعنوان القسم ورابط عرض الكل، وعلى الجوال يُسحب جانبيًا.",
    "One row of products from one category, under its name and View all; on phones it swipes sideways.",
  ),
  keywords: ["products", "category", "carousel", "rail", "collection", "swipe", "منتجات", "قسم", "شريط", "سحب"],
  tree: (t) => {
    const products = t.productList([card(t)], {
      label: L("منتجات القسم", "Category products"),
      role: "items",
      source: "category",
      limit: 8,
      columns: { desktop: 4, tablet: 3, mobile: 2 },
      mobileRail: true,
      style: { gap: 24 },
      tablet: { gap: 16 },
      mobile: { gap: 12 },
    });
    return t.section({ label: L("منتجات قسم", "Category carousel") }, [
      t.container(
        [
          t.stack(
            [
              t.categoryList(
                [
                  t.row(
                    [
                      t.heading(L("اسم القسم", "Category name"), "h2", { bind: "name", role: "title", style: { fontSize: "display-sm", lineHeight: "tight" } }),
                      arrowLink(t, L("عرض الكل", "View all"), CATEGORY_LINK, { bind: "href", style: { color: "foreground" } }),
                    ],
                    {
                      label: L("رأس القسم", "Section head"),
                      style: { justifyContent: "between", alignItems: "end", gap: 16, wrap: false },
                      mobile: { direction: "column", alignItems: "start", gap: 10 },
                    },
                  ),
                ],
                { label: L("القسم", "Category"), role: "intro", limit: 1, columns: { desktop: 1 } },
              ),
              { ...products, props: { ...products.props, categoryIndex: 1, rail: true } },
            ],
            { label: L("المحتوى", "Content"), style: { gap: 28 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]);
  },
});
