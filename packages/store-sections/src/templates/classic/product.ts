/**
 * Tallaby Classic product page (spec §5.6; the owner approved adding it,
 * CLAUDE.md rule 12, without changing Classic's other pages): the same parts
 * and order as the library's product page designs, in Classic's idiom. The
 * photos sit beside a rounded white buy card with pill buttons; the reviews
 * sit on a white band, as the home page's reviews do; related products use
 * the Classic product card. Every part reads the page's product.
 */
import { defineDesign } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { CARD, LINKS, SECTION, productCard, sectionHead } from "./_shared";

/** The title's placeholder: the editor shows it only outside a product page. */
const TITLE = L("اسم المنتج", "Product name");

export const classicProductMain = defineDesign({
  id: "tallaby-product-main",
  version: 1,
  category: "product-page",
  subcategory: "buy-box",
  name: L("كلاسيك: المعرض وزر الشراء", "Classic: gallery and buy box"),
  description: L(
    "صور المنتج جنب كارت شراء أبيض: البائع والمخزون والاسم والتقييم والسعر والاختيارات وزر الشراء والتفاصيل.",
    "Product photos beside a white buy card: seller, stock, name, rating, price, options, buy box and details.",
  ),
  keywords: ["product page", "classic", "tallaby", "gallery", "buy box", "صفحة المنتج", "كلاسيك", "شراء"],
  tree: (t) =>
    t.section(
      { label: L("المنتج", "Product"), style: { paddingTop: 28, paddingBottom: 0 }, mobile: { paddingTop: 16 } },
      [
        t.container(
          [
            t.textLink(L("رجوع للمتجر", "Back to the store"), LINKS.home, {
              label: L("رابط الرجوع", "Back link"),
              style: { fontSize: "sm", fontWeight: "bold", color: "primary", marginBottom: 20 },
              mobile: { marginBottom: 14 },
            }),
            t.grid(
              [
                t.productGallery({
                  label: L("صور المنتج", "Product gallery"),
                  thumbs: "bottom",
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
                      style: { fontSize: "3xl", fontWeight: "extrabold", lineHeight: "tight" },
                      mobile: { fontSize: "2xl", lineHeight: "snug" },
                    }),
                    t.productRating({ label: L("التقييم", "Rating") }),
                    t.productPrice({ label: L("السعر", "Price"), style: { marginTop: 4, fontWeight: "extrabold" } }),
                    t.productVariants({ label: L("الاختيارات", "Options"), style: { marginTop: 8 } }),
                    t.productBuyBox({ label: L("زر الشراء", "Buy box"), style: { marginTop: 8 } }),
                    t.productDetails({ label: L("التفاصيل", "Details"), style: { marginTop: 16 } }),
                  ],
                  {
                    label: L("عمود الشراء", "Buy column"),
                    style: { ...CARD, gap: 14, colSpan: 5, paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
                    tablet: { colSpan: 1 },
                    mobile: { gap: 12, paddingTop: 18, paddingBottom: 18, paddingStart: 18, paddingEnd: 18 },
                  },
                ),
              ],
              {
                label: L("المعرض والشراء", "Gallery and buy column"),
                columns: { desktop: 12, tablet: 1 },
                style: { gap: 40, alignItems: "start" },
                tablet: { gap: 28 },
                mobile: { gap: 20 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});

export const classicProductContent = defineDesign({
  id: "tallaby-product-content",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("كلاسيك: محتوى المنتج", "Classic: product content"),
  description: L("الوصف المنسّق اللي كتبته للمنتج، في عمود سهل القراءة.", "The formatted content you wrote for the product, in an easy-to-read column."),
  keywords: ["product page", "classic", "tallaby", "content", "description", "صفحة المنتج", "كلاسيك", "وصف"],
  tree: (t) =>
    t.section({ label: L("محتوى المنتج", "Product content"), ...SECTION }, [
      t.container([t.productContent({ label: L("المحتوى", "Content") })], {
        label: L("الحاوية", "Container"),
        style: { maxWidth: "768px" },
      }),
    ]),
});

export const classicProductReviews = defineDesign({
  id: "tallaby-product-reviews",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("كلاسيك: التقييمات والأسئلة", "Classic: reviews and questions"),
  description: L("شريط أبيض فيه تقييمات العملاء وأسئلتهم عن المنتج.", "A white band with customer reviews and questions about the product."),
  keywords: ["product page", "classic", "tallaby", "reviews", "questions", "صفحة المنتج", "كلاسيك", "تقييمات"],
  tree: (t) =>
    t.section(
      {
        label: L("التقييمات", "Reviews"),
        style: { background: "surface", paddingTop: 64, paddingBottom: 64, marginTop: 72 },
        mobile: { paddingTop: 44, paddingBottom: 44, marginTop: 48 },
      },
      [
        t.container(
          [
            t.stack(
              [
                sectionHead(t, { eyebrow: L("آراء العملاء", "Reviews"), title: L("رأي اللي جربوه", "What buyers say") }),
                t.productReviews({ label: L("التقييمات والأسئلة", "Reviews and questions") }),
              ],
              { label: L("العمود", "Column"), style: { gap: 8 } },
            ),
          ],
          { label: L("الحاوية", "Container"), style: { maxWidth: "960px" } },
        ),
      ],
    ),
});

export const classicProductRelated = defineDesign({
  id: "tallaby-product-related",
  version: 1,
  category: "product-page",
  subcategory: "upsell",
  name: L("كلاسيك: منتجات مشابهة", "Classic: related products"),
  description: L("أربع منتجات من نفس قسم المنتج، بكارت المنتج الكلاسيكي.", "Four products from the product's category, with the Classic product card."),
  keywords: ["product page", "classic", "tallaby", "related", "similar", "صفحة المنتج", "كلاسيك", "مشابهة"],
  tree: (t) =>
    t.section({ label: L("منتجات مشابهة", "Related products"), style: { paddingTop: 72, paddingBottom: 72 }, mobile: { paddingTop: 48, paddingBottom: 48 } }, [
      t.container(
        [
          sectionHead(t, { eyebrow: L("من نفس القسم", "From the same aisle"), title: L("ممكن يعجبك كمان", "You may also like"), link: { text: L("عرض الكل", "View all"), href: LINKS.shop } }),
          t.productList([productCard(t)], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "related",
            limit: 4,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            style: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

/** The product page sections, in page order. */
export const CLASSIC_PRODUCT = [classicProductMain, classicProductContent, classicProductReviews, classicProductRelated] as const;
