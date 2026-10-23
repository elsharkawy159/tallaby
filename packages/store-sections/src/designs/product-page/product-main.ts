/**
 * Gallery and buy box (the product page's main section): a back link to the
 * store, then the product's photos beside its buy column, in the order of
 * today's storefront page (seller, stock, title, rating, price, options, buy
 * box, details). The gallery takes about 58% of the row on desktop and stays
 * in view while the column scrolls; below desktop it is one column, photos
 * first. Every part reads the page's product, so nothing here is typed in.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

/** The title's placeholder: the editor shows it only outside a product page. */
const TITLE = L("اسم المنتج", "Product name");

export const productMain = defineDesign({
  id: "product-main",
  version: 1,
  category: "product-page",
  subcategory: "buy-box",
  name: L("المعرض وزر الشراء", "Gallery and buy box"),
  description: L(
    "صور المنتج جنب عمود الشراء: البائع والمخزون والاسم والتقييم والسعر والاختيارات وزر الشراء والتفاصيل.",
    "Product photos beside the buy column: seller, stock, name, rating, price, options, buy box and details.",
  ),
  keywords: ["product page", "gallery", "buy box", "price", "add to cart", "variants", "صفحة المنتج", "صور", "شراء", "سعر", "سلة"],
  tree: (t) =>
    t.section(
      {
        label: L("المنتج", "Product"),
        style: { paddingTop: 24, paddingBottom: 56 },
        mobile: { paddingTop: 16, paddingBottom: 40 },
      },
      [
        t.container(
          [
            t.textLink(L("العودة للمتجر", "Back to store"), "/", {
              label: L("رابط الرجوع", "Back link"),
              style: { fontSize: "sm", color: "muted", marginBottom: 20 },
              mobile: { marginBottom: 14 },
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
                    t.productSeller({ label: L("البائع", "Seller") }),
                    t.productStock({ label: L("المخزون", "Stock") }),
                    t.heading(TITLE, "h1", {
                      label: L("اسم المنتج", "Product name"),
                      role: "title",
                      bind: "title",
                      style: { fontSize: "3xl", fontWeight: "bold", lineHeight: "tight" },
                      mobile: { fontSize: "2xl", lineHeight: "snug" },
                    }),
                    t.productRating({ label: L("التقييم", "Rating") }),
                    t.productPrice({ label: L("السعر", "Price"), style: { marginTop: 4 } }),
                    t.productVariants({ label: L("الاختيارات", "Options"), style: { marginTop: 8 } }),
                    t.productBuyBox({ label: L("زر الشراء", "Buy box"), style: { marginTop: 8 } }),
                    t.productDetails({ label: L("التفاصيل", "Details"), style: { marginTop: 16 } }),
                  ],
                  {
                    label: L("عمود الشراء", "Buy column"),
                    style: { gap: 14, colSpan: 5 },
                    tablet: { colSpan: 1 },
                    mobile: { gap: 12 },
                  },
                ),
              ],
              {
                label: L("المعرض والشراء", "Gallery and buy column"),
                columns: { desktop: 12, tablet: 1 },
                style: { gap: 56, alignItems: "start" },
                tablet: { gap: 32 },
                mobile: { gap: 24 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
