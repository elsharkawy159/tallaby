/**
 * Clean grid (library P-a): heading, a short line and "view all" on one row,
 * then an even grid of square cards without borders, 4 across and 2 on mobile.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { SHOP_LINK, productCard } from "./_shared";

export const productsGrid = defineDesign({
  id: "products-grid",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("شبكة نظيفة", "Clean grid"),
  description: L("شبكة منتجات بسيطة لأي اختيار: الجديد أو قسم أو منتجات تختارها.", "A plain product grid for any pick: new, a category or hand-picked."),
  keywords: ["products", "grid", "minimal", "منتجات", "شبكة"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          sectionHead(t, {
            title: L("وصل حديثًا", "Just landed"),
            subtitle: L("أحدث المنتجات اللي نزلت المتجر.", "The newest products in the store."),
            link: { href: SHOP_LINK },
          }),
          t.productList([productCard(t, { bordered: false })], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "newest",
            limit: 8,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            style: { gap: 24 },
            mobile: { gap: 14 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
