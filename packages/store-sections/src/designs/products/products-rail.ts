/**
 * Best-seller rail (library P-b): a bold heading row with "view all" on a
 * tinted band, then tall portrait cards, 4 across and 2 on mobile. The source
 * is best sellers (units sold); a store without sales sees the editor hint to
 * change the source.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { SHOP_LINK, productCard } from "./_shared";

export const productsRail = defineDesign({
  id: "products-rail",
  version: 1,
  category: "products",
  subcategory: "best-sellers",
  name: L("الأكثر مبيعًا", "Best-seller rail"),
  description: L("بطاقات طولية لأكثر منتجاتك مبيعًا.", "Tall cards for your best-selling products."),
  keywords: ["products", "best sellers", "rail", "portrait", "الأكثر مبيعا", "منتجات"],
  tree: (t) =>
    t.section({ label: L("الأكثر مبيعًا", "Best sellers"), style: { background: "secondary" } }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("بيحبوها", "Loved by customers"),
            title: L("الأكثر مبيعًا", "Best sellers"),
            size: "display-md",
            link: { href: SHOP_LINK },
          }),
          t.productList([productCard(t, { ratio: "portrait" })], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "best-sellers",
            limit: 8,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            style: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
