/**
 * Best-seller rail (library P-b): a heading row with "view all" on a tinted
 * band, then tall portrait cards, 4 across and 2 on mobile. The source is
 * best sellers (units sold); a store without sales sees the editor hint to
 * change the source.
 *
 * v2 (look-first pilot, 2026-11-11): the premium card without a border (its
 * photo frame on the page colour, since the band is tinted), the calmer
 * heading rising word by word (motion v2), and the site's product stage.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { PRODUCTS_SECTION, SHOP_LINK, premiumCard, productsHead } from "./_shared";

export const productsRail = defineDesign({
  id: "products-rail",
  version: 2,
  category: "products",
  subcategory: "best-sellers",
  name: L("الأكثر مبيعًا", "Best-seller rail"),
  description: L("بطاقات طولية لأكثر منتجاتك مبيعًا.", "Tall cards for your best-selling products."),
  keywords: ["products", "best sellers", "rail", "portrait", "الأكثر مبيعا", "منتجات"],
  tree: (t) =>
    t.section({ label: L("الأكثر مبيعًا", "Best sellers"), style: { ...PRODUCTS_SECTION.style, background: "secondary" }, mobile: PRODUCTS_SECTION.mobile }, [
      t.container(
        [
          productsHead(t, {
            eyebrow: L("بيحبوها", "Loved by customers"),
            title: L("الأكثر مبيعًا", "Best sellers"),
            link: { href: SHOP_LINK },
          }),
          t.productList([premiumCard(t, { ratio: "portrait", frame: "background" })], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "best-sellers",
            limit: 8,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            mobileRail: true,
            style: { gap: 28 },
            tablet: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
