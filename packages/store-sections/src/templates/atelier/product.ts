/**
 * Atelier product page (spec §5.6): the same parts and order as the library's
 * product page designs, in Atelier's editorial idiom. A large gallery with
 * its thumbnails on the side, a flat buy column under a serif title, an
 * outlined buy button, the details as hairline-divided rows, and generous
 * whitespace; the reviews sit on the warm shelf colour and related pieces
 * use the Atelier product card. Every part reads the page's product.
 */
import { defineDesign } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { DISPLAY, LINKS, SECTION, head, productCard } from "./_shared";

/** The title's placeholder: the editor shows it only outside a product page. */
const TITLE = L("اسم القطعة", "Piece name");

export const atelierProductMain = defineDesign({
  id: "atelier-product-main",
  version: 1,
  category: "product-page",
  subcategory: "buy-box",
  name: L("أتيليه: المعرض وزر الشراء", "Atelier: gallery and buy box"),
  description: L(
    "معرض صور كبير بصور مصغرة على الجانب، وعمود شراء هادئ بعنوان كلاسيكي وزر محدد والتفاصيل في صفوف بخطوط رفيعة.",
    "A large gallery with side thumbnails, and a quiet buy column with a serif title, an outlined button and the details as hairline rows.",
  ),
  keywords: ["product page", "atelier", "gallery", "buy box", "صفحة المنتج", "أتيليه", "شراء"],
  tree: (t) =>
    t.section(
      { label: L("المنتج", "Product"), style: { paddingTop: 40, paddingBottom: 96 }, mobile: { paddingTop: 20, paddingBottom: 56 } },
      [
        t.container(
          [
            t.textLink(L("العودة إلى الدار", "Back to the house"), "/", {
              label: L("رابط الرجوع", "Back link"),
              style: { fontSize: "xs", fontWeight: "medium", letterSpacing: "wider", color: "muted", marginBottom: 32 },
              mobile: { marginBottom: 18 },
            }),
            t.grid(
              [
                t.productGallery({
                  label: L("صور المنتج", "Product gallery"),
                  thumbs: "side",
                  style: { colSpan: 7, position: "sticky", insetTop: "96px" },
                  tablet: { colSpan: 1, position: "relative", insetTop: "0px" },
                }),
                t.stack(
                  [
                    t.productSeller({ label: L("البائع", "Seller"), style: { color: "muted" } }),
                    t.productStock({ label: L("المخزون", "Stock") }),
                    t.heading(TITLE, "h1", {
                      label: L("اسم المنتج", "Product name"),
                      role: "title",
                      bind: "title",
                      style: { ...DISPLAY, fontSize: "display-md" },
                      mobile: { fontSize: "3xl", lineHeight: "snug" },
                    }),
                    t.productRating({ label: L("التقييم", "Rating") }),
                    t.productPrice({ label: L("السعر", "Price"), style: { marginTop: 4, fontSize: "xl" } }),
                    t.productVariants({ label: L("الاختيارات", "Options"), style: { marginTop: 12 } }),
                    t.productBuyBox({ label: L("زر الشراء", "Buy box"), variant: "outline", style: { marginTop: 8 } }),
                    t.productDetails({ label: L("التفاصيل", "Details"), style: { marginTop: 24 } }),
                  ],
                  {
                    label: L("عمود الشراء", "Buy column"),
                    style: { gap: 16, colSpan: 5, paddingTop: 8 },
                    tablet: { colSpan: 1, paddingTop: 0 },
                    mobile: { gap: 12 },
                  },
                ),
              ],
              {
                label: L("المعرض والشراء", "Gallery and buy column"),
                columns: { desktop: 12, tablet: 1 },
                style: { gap: 72, alignItems: "start" },
                tablet: { gap: 40 },
                mobile: { gap: 28 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});

export const atelierProductContent = defineDesign({
  id: "atelier-product-content",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("أتيليه: حكاية القطعة", "Atelier: the piece's story"),
  description: L("الوصف المنسّق الذي كتبته للقطعة، في عمود قراءة ضيق.", "The formatted content you wrote for the piece, in a narrow reading column."),
  keywords: ["product page", "atelier", "content", "description", "صفحة المنتج", "أتيليه", "وصف"],
  tree: (t) =>
    t.section({ label: L("محتوى المنتج", "Product content"), style: { paddingTop: 0, paddingBottom: 96 }, mobile: { paddingTop: 0, paddingBottom: 56 } }, [
      t.container([t.productContent({ label: L("المحتوى", "Content") })], {
        label: L("الحاوية", "Container"),
        style: { maxWidth: "720px" },
      }),
    ]),
});

export const atelierProductReviews = defineDesign({
  id: "atelier-product-reviews",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("أتيليه: الآراء والأسئلة", "Atelier: reviews and questions"),
  description: L("آراء العملاء وأسئلتهم على لون الرف الدافئ، تحت عنوان كلاسيكي في المنتصف.", "Customer reviews and questions on the warm shelf colour, under a centred serif heading."),
  keywords: ["product page", "atelier", "reviews", "questions", "صفحة المنتج", "أتيليه", "آراء"],
  tree: (t) =>
    t.section({ label: L("التقييمات", "Reviews"), ...SECTION, style: { ...SECTION.style, background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              head(t, { eyebrow: L("بعد التجربة", "After wearing it"), title: L("ماذا قالوا عن القطعة", "What they said about the piece"), center: true }),
              t.productReviews({ label: L("التقييمات والأسئلة", "Reviews and questions") }),
            ],
            { label: L("العمود", "Column"), style: { gap: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "880px" } },
      ),
    ]),
});

export const atelierProductRelated = defineDesign({
  id: "atelier-product-related",
  version: 1,
  category: "product-page",
  subcategory: "upsell",
  name: L("أتيليه: قطع من المجموعة نفسها", "Atelier: from the same collection"),
  description: L("أربع قطع من قسم القطعة نفسه، ببطاقة أتيليه.", "Four pieces from the piece's category, with the Atelier card."),
  keywords: ["product page", "atelier", "related", "similar", "صفحة المنتج", "أتيليه", "مشابهة"],
  tree: (t) =>
    t.section({ label: L("منتجات مشابهة", "Related products"), ...SECTION }, [
      t.container(
        [
          head(t, {
            eyebrow: L("من المجموعة", "From the collection"),
            title: L("قطع تكمل الإطلالة", "Pieces to complete the look"),
            link: { text: L("كل القطع", "All pieces"), href: LINKS.shop },
          }),
          t.productList([productCard(t)], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "related",
            limit: 4,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            style: { gap: 32 },
            mobile: { gap: 16 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

/** The product page sections, in page order. */
export const ATELIER_PRODUCT = [atelierProductMain, atelierProductContent, atelierProductReviews, atelierProductRelated] as const;
