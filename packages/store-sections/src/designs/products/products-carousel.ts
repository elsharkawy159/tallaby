/**
 * Product carousel (Claude Design premium set, productCarousel): the heading
 * at the start and "View all" at the end, then one row of portrait product
 * cards, four across on desktop. On phones the row swipes sideways with the
 * next card peeking in. Our lists have no arrow buttons or progress line,
 * so the desktop row shows four products and the phone row swipes.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { SHOP_LINK } from "./_shared";
import { plainCard, premiumHead } from "./_premium";

export const productsCarousel = defineDesign({
  id: "products-carousel",
  version: 1,
  category: "products",
  subcategory: "best-sellers",
  name: L("شريط منتجات", "Product carousel"),
  description: L(
    "صف منتجات بعنوان ورابط عرض الكل، وعلى الجوال يُسحب جانبيًا.",
    "One row of products under a heading and View all; on phones it swipes sideways.",
  ),
  keywords: ["products", "carousel", "rail", "best sellers", "swipe", "premium", "منتجات", "شريط", "الأكثر مبيعا", "سحب"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          t.stack(
            [
              premiumHead(t, { title: L("الأكثر مبيعاً", "Best sellers"), link: { href: SHOP_LINK } }),
              t.productList([plainCard(t)], {
                label: L("المنتجات", "Products"),
                role: "items",
                source: "best-sellers",
                limit: 4,
                columns: { desktop: 4, tablet: 2, mobile: 2 },
                mobileRail: true,
                style: { gap: 24 },
                tablet: { gap: 16 },
                mobile: { gap: 12 },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 28 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
