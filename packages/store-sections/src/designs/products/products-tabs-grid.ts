/**
 * Grid with tabs (Claude Design premium set, productGrid): a centred heading,
 * a row of collection chips under it (new in, best sellers, top rated, each a
 * link to that sort of the shop) and the newest products below, two across
 * on phones and four on desktop, with an outlined "View all" under the grid.
 * There is no tabs element, so the chips are links rather than panes.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { chip } from "../_modular";
import { SHOP_LINK } from "./_shared";
import { plainCard, premiumHead } from "./_premium";

const TABS = [
  { text: L("الجديد", "New in"), href: "/products?sort=newest" },
  { text: L("الأكثر مبيعاً", "Best sellers"), href: "/products?sort=popularity" },
  { text: L("الأعلى تقييمًا", "Top rated"), href: "/products?sort=rating" },
];

export const productsTabsGrid = defineDesign({
  id: "products-tabs-grid",
  version: 1,
  category: "products",
  subcategory: "new-arrivals",
  name: L("شبكة بشرائح", "Grid with tabs"),
  description: L(
    "عنوان في المنتصف وشرائح للمجموعات، وتحتها شبكة منتجات وزر عرض الكل.",
    "A centred heading and collection chips over a product grid, with View all below.",
  ),
  keywords: ["products", "grid", "tabs", "chips", "new arrivals", "premium", "منتجات", "شبكة", "تبويبات", "وصل حديثا"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          t.stack(
            [
              premiumHead(t, { title: L("وصل حديثاً", "New arrivals"), center: true }),
              t.row(
                TABS.map((tab, i) => chip(t, tab.text, tab.href, { active: i === 0 })),
                { label: L("التبويبات", "Tabs"), role: "tabs", style: { gap: 8, justifyContent: "center" } },
              ),
              t.productList([plainCard(t)], {
                label: L("المنتجات", "Products"),
                role: "items",
                source: "newest",
                limit: 8,
                columns: { desktop: 4, tablet: 3, mobile: 2 },
                style: { gap: 28 },
                tablet: { gap: 20 },
                mobile: { gap: 12 },
              }),
              t.row([t.button(L("عرض الكل", "View all"), SHOP_LINK, "outline", { role: "cta" })], {
                label: L("الزر", "Button"),
                style: { justifyContent: "center", paddingTop: 8 },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 28 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
