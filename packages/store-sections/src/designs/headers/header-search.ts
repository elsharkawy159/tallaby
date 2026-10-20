/**
 * Search first (library H-d): logo, a wide search box and a labelled cart on
 * the top row; a soft second row of category links with a delivery note at
 * the end. For stores with many products.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { logo, nav } from "./_shared";

const CATEGORIES = [
  { text: L("وصل حديثًا", "New in"), href: "/products" },
  { text: L("الأكثر مبيعًا", "Best sellers"), href: "/products" },
  { text: L("العروض", "Offers"), href: "/products" },
  { text: L("هدايا", "Gifts"), href: "/products" },
  { text: L("إكسسوارات", "Accessories"), href: "/products" },
];

export const headerSearch = defineDesign({
  id: "header-search",
  version: 1,
  category: "headers",
  subcategory: "mega-menu",
  name: L("بحث كبير", "Search first"),
  description: L("مربع بحث عريض وسلة، وتحتهما صف أقسام وملاحظة التوصيل.", "A wide search box and cart, over a row of categories and a delivery note."),
  keywords: ["header", "search", "categories", "mega menu", "بحث", "هيدر", "أقسام"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.container(
        [
          t.row(
            [
              logo(t),
              t.stack(
                [
                  t.link(
                    "/products",
                    [
                      t.row(
                        [
                          t.text(L("ابحث عن منتج…", "Search products…"), { style: { color: "muted", fontSize: "md" } }),
                          t.icon("search", { style: { fontSize: "lg", color: "primary" } }),
                        ],
                        { label: L("المحتوى", "Content"), style: { justifyContent: "between", gap: 12, wrap: false } },
                      ),
                    ],
                    {
                      label: L("البحث", "Search"),
                      role: "search",
                      style: {
                        borderWidth: 2,
                        borderColor: "border",
                        radius: 999,
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingStart: 20,
                        paddingEnd: 12,
                        hover: { borderColor: "primary" },
                      },
                    },
                  ),
                ],
                { label: L("خانة البحث", "Search box"), style: { width: "50%" }, mobile: { width: "100%", order: 3 } },
              ),
              t.link(
                "/cart",
                [
                  t.row([t.icon("shopping-bag", { style: { fontSize: "lg" } }), t.text(L("السلة", "Cart"), { style: { fontWeight: "semibold" } })], {
                    label: L("المحتوى", "Content"),
                    style: { gap: 8, wrap: false },
                  }),
                ],
                {
                  label: L("السلة", "Cart"),
                  style: { background: "secondary", radius: 999, paddingTop: 10, paddingBottom: 10, paddingStart: 18, paddingEnd: 18 },
                },
              ),
            ],
            { label: L("الصف العلوي", "Top row"), style: { justifyContent: "between", gap: 20, paddingTop: 16, paddingBottom: 16 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.container(
        [
          t.row(
            [
              nav(t, CATEGORIES, { style: { gap: 20 } }),
              t.row(
                [t.icon("truck", { style: { color: "primary" } }), t.text(L("توصيل خلال ٤٨ ساعة", "Delivered within 48 hours"), { style: { color: "muted" } })],
                {
                  label: L("ملاحظة التوصيل", "Delivery note"),
                  style: { gap: 8 },
                  mobile: { hidden: true },
                },
              ),
            ],
            { label: L("صف الأقسام", "Category row"), style: { justifyContent: "between", gap: 16, paddingTop: 8, paddingBottom: 8 } },
          ),
        ],
        { label: L("الحاوية الثانية", "Second container"), style: { paddingTop: 0, paddingBottom: 0, background: "secondary", maxWidth: "100%" } },
      ),
    ]),
});
