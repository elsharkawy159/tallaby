/**
 * Category tabs grid (2026-10-29, after the WoodMart "Accessories" demo's
 * "New Arrivals"): a centred head (brand line, title, muted line), the
 * store's first three categories as tab links under it, then two rows of
 * flat centred cards, five across on desktop. There is no tabs element, so
 * the tabs are links to each category's page.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { centeredCard, centeredHead } from "../_centered";

export const productsCategoryTabs = defineDesign({
  id: "products-category-tabs",
  version: 1,
  category: "products",
  subcategory: "new-arrivals",
  name: L("منتجات بتبويبات الأقسام", "Category tabs grid"),
  description: L(
    "عنوان في النص، وأسماء أول ٣ أقسام كتبويبات، وتحتها صفين منتجات بكروت بسيطة.",
    "A centred heading, your first three categories as tabs and two rows of simple product cards.",
  ),
  keywords: ["products", "tabs", "categories", "new arrivals", "grid", "منتجات", "تبويبات", "أقسام", "وصل حديثا"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          t.stack(
            [
              centeredHead(t, {
                eyebrow: L("لحق قبل ما يخلص", "Hurry up to buy"),
                title: L("وصل حديثًا", "New arrivals"),
                subtitle: L("أحدث القطع اللي نزلت المتجر الأسبوع ده.", "The newest pieces in the store this week."),
              }),
              t.categoryList(
                [
                  t.link("/products", [t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontWeight: "semibold", fontSize: "sm", textTransform: "uppercase" } })], {
                    label: L("تبويب", "Tab"),
                    bind: "href",
                    style: { paddingTop: 6, paddingBottom: 6, paddingStart: 2, paddingEnd: 2, color: "foreground", hover: { color: "primary" } },
                  }),
                ],
                { label: L("التبويبات", "Tabs"), role: "tabs", limit: 3, columns: { desktop: 3, mobile: 3 }, style: { gap: 24, justifyContent: "center", width: "auto" } },
              ),
              t.productList([centeredCard(t)], {
                label: L("المنتجات", "Products"),
                role: "items",
                source: "newest",
                limit: 10,
                columns: { desktop: 5, tablet: 3, mobile: 2 },
                style: { gap: 28 },
                tablet: { gap: 20 },
                mobile: { gap: 14 },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 28, alignItems: "center" }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
