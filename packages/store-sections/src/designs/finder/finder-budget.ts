/**
 * Budget (Product finder E-b): a shelf panel about shopping within a budget,
 * with "lowest price first" and "highest price first" buttons, over the
 * store's products sorted from the lowest price. The design's range slider
 * needs a script and a price filter the shop page does not have, so the panel
 * links to the shop sorted by price instead, and the grid shows the cheapest
 * products for real.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { TILE, TILE_MOBILE, dotLabel, pillButton } from "../_modular";
import { productCard } from "../products/_shared";
import { CHEAPEST_FIRST, DEAREST_FIRST } from "./_shared";

export const finderBudget = defineDesign({
  id: "finder-budget",
  version: 1,
  category: "finder",
  subcategory: "budget",
  name: L("على قد الميزانية", "Budget first"),
  description: L(
    "لوحة عن الميزانية بزرارين للترتيب بالسعر، وتحتها أرخص المنتجات.",
    "A budget panel with sort-by-price buttons, over your lowest-priced products.",
  ),
  keywords: ["finder", "budget", "price", "cheap", "ميزانية", "سعر", "أرخص"],
  tree: (t) =>
    t.section({ label: L("الميزانية", "Budget") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("ميزانيتك", "Your budget")),
                  t.heading(
                    L("ابدأ من الأوفر", "Start with the best value"),
                    "h2",
                    {
                      role: "title",
                      style: {
                        fontSize: "5xl",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                      },
                      mobile: { fontSize: "4xl" },
                    },
                  ),
                  t.paragraph(
                    L(
                      "رتبنالك المنتجات من الأقل سعرًا. عايز تشوف الأغلى الأول؟ اختار من الزراير.",
                      "Products sorted from the lowest price. Want the premium ones first? Use the buttons.",
                    ),
                    {
                      role: "subtitle",
                      style: { maxWidth: "520px" },
                    },
                  ),
                ],
                {
                  label: L("العنوان", "Heading"),
                  role: "intro",
                  style: { gap: 12 },
                },
              ),
              t.row(
                [
                  pillButton(
                    t,
                    L("الأقل سعرًا", "Lowest price"),
                    CHEAPEST_FIRST,
                    { icon: "tag" },
                  ),
                  pillButton(
                    t,
                    L("الأعلى سعرًا", "Highest price"),
                    DEAREST_FIRST,
                    { tone: "outline" },
                  ),
                ],
                {
                  label: L("الأزرار", "Buttons"),
                  style: { gap: 10, justifyContent: "end", alignItems: "end" },
                  mobile: { justifyContent: "start" },
                },
              ),
            ],
            {
              label: L("لوحة الميزانية", "Budget panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                ...TILE,
                gap: 24,
                alignItems: "end",
                paddingTop: 36,
                paddingBottom: 36,
                paddingStart: 36,
                paddingEnd: 36,
                marginBottom: 32,
              },
              mobile: { ...TILE_MOBILE, gap: 18, marginBottom: 24 },
            },
          ),
          t.productList([productCard(t)], {
            label: L("المنتجات", "Products"),
            role: "products",
            source: "all",
            sort: "price-asc",
            limit: 8,
            columns: { desktop: 4, mobile: 2 },
            style: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
