/**
 * Clean grid (library P-a): heading, a short line and "view all" on one row,
 * then an even grid of square cards without borders, 4 across and 2 on mobile.
 *
 * v2 (motion v2, 2026-11-11): the heading rises word by word; the cards keep
 * the v2 row-by-row stagger and the eased second-photo swap.
 * v3 (look-first pilot, 2026-11-11): the premium card and the calmer heading
 * (`_shared.ts`); the photos sit on the site's product stage when it has one;
 * on phones it is a real two-column grid, not a swipe row.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { PRODUCTS_SECTION, SHOP_LINK, premiumCard, productsHead } from "./_shared";

export const productsGrid = defineDesign({
  id: "products-grid",
  version: 3,
  category: "products",
  subcategory: "featured",
  name: L("شبكة نظيفة", "Clean grid"),
  description: L("شبكة منتجات بسيطة لأي اختيار: الجديد أو قسم أو منتجات تختارها.", "A plain product grid for any pick: new, a category or hand-picked."),
  keywords: ["products", "grid", "minimal", "منتجات", "شبكة"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          productsHead(t, {
            title: L("وصل حديثًا", "Just landed"),
            subtitle: L("أحدث المنتجات اللي نزلت المتجر.", "The newest products in the store."),
            link: { href: SHOP_LINK },
          }),
          t.productList([premiumCard(t, { ratio: "square" })], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "newest",
            limit: 8,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            style: { gap: 28 },
            tablet: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
