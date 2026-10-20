/**
 * Perks bento (Modular set): four tiles under the buy box: a brand tile for
 * delivery time and shelf tiles for warranty, returns and cash on delivery,
 * each with an icon and one line. Removes purchase doubts right under the
 * price. The same for every product, so nothing here is product data.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BRAND_TILE, TILE, TILE_MOBILE } from "../_modular";

const PERKS = [
  {
    icon: "truck",
    title: L("توصيل سريع", "Fast delivery"),
    text: L("من يوم لـ ٤ أيام", "In 1 to 4 days"),
  },
  {
    icon: "shield",
    title: L("ضمان المتجر", "Store warranty"),
    text: L("بفاتورة رسمية", "With an official invoice"),
  },
  {
    icon: "rotate",
    title: L("استرجاع ١٤ يوم", "14-day returns"),
    text: L("من غير أسئلة", "No questions asked"),
  },
  {
    icon: "credit-card",
    title: L("ادفع عند الاستلام", "Pay on delivery"),
    text: L("كاش أو كارت", "Cash or card"),
  },
] as const;

export const productPerks = defineDesign({
  id: "product-perks",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("بينتو مزايا", "Perks bento"),
  description: L("أربع مربعات تحت زر الشراء: التوصيل والضمان والاسترجاع والدفع.", "Four tiles under the buy box: delivery, warranty, returns and payment."),
  keywords: ["product page", "perks", "trust", "delivery", "warranty", "صفحة المنتج", "مزايا", "ضمان"],
  tree: (t) =>
    t.section(
      {
        label: L("المزايا", "Perks"),
        style: { paddingTop: 24, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.grid(
              PERKS.map((p, i) => {
                const ink = i === 0 ? "primaryInk" : "foreground";
                return t.stack(
                  [
                    t.icon(p.icon, {
                      style: {
                        fontSize: "xl",
                        color: i === 0 ? "primaryInk" : "primary",
                      },
                    }),
                    t.text(p.title, {
                      style: { fontWeight: "bold", color: ink, marginTop: 4 },
                    }),
                    t.text(p.text, {
                      style: {
                        fontSize: "sm",
                        color: i === 0 ? "primaryInk" : "muted",
                        ...(i === 0 && { opacity: 85 }),
                      },
                    }),
                  ],
                  {
                    label: L("ميزة", "Perk"),
                    style: {
                      ...(i === 0 ? BRAND_TILE : TILE),
                      gap: 4,
                      paddingTop: 22,
                      paddingBottom: 22,
                      paddingStart: 22,
                      paddingEnd: 22,
                    },
                    mobile: TILE_MOBILE,
                  },
                );
              }),
              {
                label: L("المزايا", "Perks"),
                role: "items",
                columns: { desktop: 4, mobile: 2 },
                style: { gap: 12 },
                mobile: { gap: 10 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
