/**
 * Gallery and buy box (the product page's main section): breadcrumbs (Home ›
 * category › product), then the product's photos beside its buy column, in
 * the product page design's order (meta row with category and rating, title,
 * price, stock, options, buy box with its perks box, details). The gallery
 * takes about 58% of the row on desktop and stays in view while the column
 * scrolls; below desktop it is one column, photos first. Every part reads
 * the page's product, so nothing here is typed in.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

/** The title's placeholder: the editor shows it only outside a product page. */
const TITLE = L("اسم المنتج", "Product name");

export const productMain = defineDesign({
  id: "product-main",
  version: 2,
  category: "product-page",
  subcategory: "buy-box",
  name: L("المعرض وزر الشراء", "Gallery and buy box"),
  description: L(
    "صور المنتج جنب عمود الشراء: القسم والتقييم والاسم والسعر والمخزون والاختيارات وزر الشراء والتفاصيل.",
    "Product photos beside the buy column: category, rating, name, price, stock, options, buy box and details.",
  ),
  keywords: ["product page", "gallery", "buy box", "price", "add to cart", "variants", "breadcrumbs", "صفحة المنتج", "صور", "شراء", "سعر", "سلة"],
  tree: (t) =>
    t.section(
      {
        label: L("المنتج", "Product"),
        style: { paddingTop: 20, paddingBottom: 56 },
        mobile: { paddingTop: 12, paddingBottom: 40 },
      },
      [
        t.container(
          [
            t.productBreadcrumbs({
              label: L("مسار الصفحة", "Breadcrumbs"),
              style: { marginBottom: 20 },
              mobile: { marginBottom: 12 },
            }),
            t.grid(
              [
                t.productGallery({
                  label: L("صور المنتج", "Product gallery"),
                  style: { colSpan: 7, position: "sticky", insetTop: "96px" },
                  tablet: { colSpan: 1, position: "relative", insetTop: "0px" },
                }),
                t.stack(
                  [
                    t.productRating({ label: L("التقييم", "Rating") }),
                    t.heading(TITLE, "h1", {
                      label: L("اسم المنتج", "Product name"),
                      role: "title",
                      bind: "title",
                      style: { fontSize: "3xl", fontWeight: "extrabold", lineHeight: "snug" },
                      mobile: { fontSize: "2xl", lineHeight: "snug" },
                    }),
                    t.productPrice({ label: L("السعر", "Price") }),
                    t.productStock({ label: L("المخزون", "Stock") }),
                    t.productVariants({ label: L("الاختيارات", "Options"), style: { marginTop: 4 } }),
                    t.productBuyBox({ label: L("زر الشراء", "Buy box"), style: { marginTop: 4 } }),
                    t.productDetails({ label: L("التفاصيل", "Details"), style: { marginTop: 8 } }),
                  ],
                  {
                    label: L("عمود الشراء", "Buy column"),
                    style: { gap: 20, colSpan: 5 },
                    tablet: { colSpan: 1 },
                    mobile: { gap: 16 },
                  },
                ),
              ],
              {
                label: L("المعرض والشراء", "Gallery and buy column"),
                columns: { desktop: 12, tablet: 1 },
                style: { gap: 56, alignItems: "start" },
                tablet: { gap: 32 },
                mobile: { gap: 20 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
