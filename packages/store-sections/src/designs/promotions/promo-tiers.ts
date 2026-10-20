/**
 * Spend tiers (Modular set): a heading over three ruled cells, each a spend
 * tier with the "spend" and "save" amounts; the middle tier is highlighted in
 * brand as the most used. For spend-more-save-more campaigns.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, RULED, RULED_CELL, modHead } from "../_modular";

const TIERS = [
  { spend: L("١٠٠٠ ج.م", "EGP 1,000"), save: L("١٠٠ ج.م", "EGP 100") },
  { spend: L("٢٠٠٠ ج.م", "EGP 2,000"), save: L("٢٥٠ ج.م", "EGP 250") },
  { spend: L("٣٥٠٠ ج.م", "EGP 3,500"), save: L("٥٠٠ ج.م", "EGP 500") },
];

export const promoTiers = defineDesign({
  id: "promo-tiers",
  version: 1,
  category: "promotions",
  subcategory: "tiles",
  name: L("شرائح التوفير", "Spend tiers"),
  description: L("ثلاث شرائح: كل ما تشتري أكتر توفر أكتر.", "Three tiers: the more you spend, the more you save."),
  keywords: ["promotions", "tiers", "spend more save more", "عروض", "شرائح", "توفير"],
  tree: (t) =>
    t.section({ label: L("شرائح التوفير", "Spend tiers") }, [
      t.container(
        [
          modHead(t, {
            label: L("عرض الشهر", "This month"),
            title: L("كل ما تزود، توفّر أكتر", "Spend more, save more"),
          }),
          t.grid(
            TIERS.map((tier, i) => {
              const on = i === 1;
              const ink = on ? "primaryInk" : "muted";
              return t.stack(
                [
                  ...(on
                    ? [
                        t.badge(L("الأكثر استخدامًا", "Most used"), {
                          style: {
                            background: "accent",
                            color: "foreground",
                            fontWeight: "semibold",
                          },
                        }),
                      ]
                    : []),
                  t.row(
                    [
                      t.text(L("لما تشتري بـ", "Spend"), {
                        style: { fontSize: "sm", color: ink },
                      }),
                      t.text(tier.spend, {
                        style: { fontSize: "sm", color: ink },
                      }),
                    ],
                    {
                      label: L("الحد", "Spend"),
                      style: { gap: 6 },
                    },
                  ),
                  t.text(tier.save, {
                    role: "value",
                    style: {
                      ...BIG_NUMBER,
                      fontSize: "5xl",
                      color: on ? "primaryInk" : "foreground",
                    },
                    mobile: { fontSize: "4xl" },
                  }),
                  t.text(L("خصم على الفاتورة", "off your order"), {
                    style: { fontSize: "sm", color: ink },
                  }),
                ],
                {
                  label: L("شريحة", "Tier"),
                  style: {
                    ...RULED_CELL,
                    ...(on && { background: "primary" }),
                    gap: 10,
                    justifyContent: "center",
                    paddingTop: 36,
                    paddingBottom: 36,
                    paddingStart: 32,
                    paddingEnd: 32,
                    minHeight: 220,
                  },
                  mobile: {
                    minHeight: 0,
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingStart: 22,
                    paddingEnd: 22,
                  },
                },
              );
            }),
            {
              label: L("الشرائح", "Tiers"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: RULED,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
