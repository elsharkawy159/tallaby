/**
 * Tabbed grid (Modular set): a heading with a row of collection chips (new,
 * best sellers, offers) at the end, and a four-column grid of the store's
 * products below. Each chip links to that collection in the shop; the grid
 * shows the newest products.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { chip, modHead } from "../_modular";
import { SHOP_LINK, productCard } from "./_shared";

const TABS = [L("وصل جديد", "New"), L("الأكثر مبيعًا", "Best sellers"), L("العروض", "Offers")];

export const productsTabbed = defineDesign({
  id: "products-tabbed",
  version: 1,
  category: "products",
  subcategory: "new-arrivals",
  name: L("شبكة بتبويبات", "Tabbed grid"),
  description: L("عنوان وشرائح للمجموعات وتحتها شبكة منتجات بأربع أعمدة.", "A heading with collection chips over a four-column product grid."),
  keywords: ["products", "tabs", "grid", "collections", "منتجات", "تبويبات", "شبكة"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          t.row(
            [
              modHead(t, {
                label: L("المتجر", "Shop"),
                title: L("منتجاتنا", "Our products"),
              }),
              t.row(
                TABS.map((tab, i) => chip(t, tab, SHOP_LINK, { active: i === 0 })),
                {
                  label: L("التبويبات", "Tabs"),
                  role: "tabs",
                  style: { gap: 8, marginBottom: 32 },
                  mobile: { marginBottom: 22 },
                },
              ),
            ],
            {
              label: L("الرأس", "Head"),
              style: { justifyContent: "between", alignItems: "end", gap: 16 },
              mobile: { direction: "column", alignItems: "start", gap: 0 },
            },
          ),
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
