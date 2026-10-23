/**
 * Related products: a heading row with "view all", then four of the store's
 * products from the same category as the page's product (the store's newest
 * when there are too few), drawn with the catalog's own product card.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { SHOP_LINK, productCard } from "../products/_shared";

export const productRelated = defineDesign({
  id: "product-related",
  version: 1,
  category: "product-page",
  subcategory: "upsell",
  name: L("منتجات مشابهة", "Related products"),
  description: L("أربع منتجات من نفس قسم المنتج، ببطاقة المنتج بتاعة المتجر.", "Four products from the product's category, with the store's product card."),
  keywords: ["product page", "related", "similar", "you may also like", "صفحة المنتج", "مشابهة", "منتجات"],
  tree: (t) =>
    t.section(
      {
        label: L("منتجات مشابهة", "Related products"),
        style: { paddingTop: 48, paddingBottom: 64 },
        mobile: { paddingTop: 32, paddingBottom: 48 },
      },
      [
        t.container(
          [
            sectionHead(t, {
              title: L("ممكن يعجبك كمان", "You may also like"),
              link: { href: SHOP_LINK },
              size: "3xl",
            }),
            t.productList([productCard(t, { bordered: false })], {
              label: L("المنتجات", "Products"),
              role: "items",
              source: "related",
              limit: 4,
              columns: { desktop: 4, tablet: 3, mobile: 2 },
              style: { gap: 24 },
              mobile: { gap: 14 },
            }),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
