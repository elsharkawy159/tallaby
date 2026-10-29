/**
 * Centred row (2026-10-29, after the WoodMart "Accessories" demo's "Most
 * Popular Products"): a centred head (brand line, title, muted line) over one
 * row of six flat centred cards of the store's best sellers; tablets show
 * three across and phones two.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { centeredCard, centeredHead } from "../_centered";

export const productsCenteredRow = defineDesign({
  id: "products-centered-row",
  version: 1,
  category: "products",
  subcategory: "best-sellers",
  name: L("صف منتجات في النص", "Centred row"),
  description: L("عنوان في النص وتحته صف من ٦ منتجات الأكثر مبيعًا بكروت بسيطة.", "A centred heading over one row of six best sellers in simple cards."),
  keywords: ["products", "best sellers", "row", "popular", "منتجات", "الأكثر مبيعا", "صف"],
  tree: (t) =>
    t.section({ label: L("الأكثر مبيعًا", "Best sellers") }, [
      t.container(
        [
          t.stack(
            [
              centeredHead(t, {
                eyebrow: L("اختيار عملائنا", "Our customers' picks"),
                title: L("الأكثر مبيعًا", "Most popular products"),
                subtitle: L("القطع اللي بترجع لها كل مرة.", "The pieces people come back for."),
              }),
              t.productList([centeredCard(t)], {
                label: L("المنتجات", "Products"),
                role: "items",
                source: "best-sellers",
                limit: 6,
                columns: { desktop: 6, tablet: 3, mobile: 2 },
                style: { gap: 24 },
                mobile: { gap: 14 },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 32 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
