/**
 * Milestones (Modular set): a timeline of years on a hairline axis with sun
 * dots, each with a short line under it; the latest year is emphasised in
 * brand. Shows growth over time on About pages. On mobile the axis turns into
 * a vertical list.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, modHead } from "../_modular";

const STEPS = [
  { year: L("٢٠١٨", "2018"), text: L("أول محل صغير", "Our first small shop") },
  {
    year: L("٢٠٢٠", "2020"),
    text: L("بدأنا البيع أونلاين", "Started selling online"),
  },
  {
    year: L("٢٠٢٣", "2023"),
    text: L("شحن لكل المحافظات", "Shipping nationwide"),
  },
  { year: L("٢٠٢٦", "2026"), text: L("٢٥ ألف طلب", "25,000 orders") },
];

export const statsMilestones = defineDesign({
  id: "stats-milestones",
  version: 1,
  category: "statistics",
  subcategory: "stats-content",
  name: L("محطات", "Milestones"),
  description: L("خط زمني بسنين ومحطات المتجر.", "A timeline of your store's years and milestones."),
  keywords: ["stats", "timeline", "milestones", "story", "about", "محطات", "حكايتنا"],
  tree: (t) =>
    t.section({ label: L("المحطات", "Milestones") }, [
      t.container(
        [
          modHead(t, {
            label: L("حكايتنا", "Our story"),
            title: L("من محل صغير لكل مصر", "From one shop to all of Egypt"),
          }),
          t.divider({
            label: L("المحور", "Axis"),
            style: { marginTop: 0, marginBottom: -8 },
            mobile: { hidden: true },
          }),
          t.grid(
            STEPS.map((s, i) => {
              const last = i === STEPS.length - 1;
              return t.stack(
                [
                  t.box([], {
                    label: L("النقطة", "Dot"),
                    style: {
                      background: last ? "primary" : "accent",
                      radius: 999,
                      width: "14px",
                      minHeight: 14,
                    },
                  }),
                  t.text(s.year, {
                    role: "value",
                    style: {
                      ...BIG_NUMBER,
                      fontSize: "4xl",
                      color: last ? "primary" : "foreground",
                    },
                  }),
                  t.paragraph(s.text),
                ],
                {
                  label: L("محطة", "Milestone"),
                  style: { gap: 14, paddingEnd: 24 },
                  mobile: { gap: 6, paddingEnd: 0 },
                },
              );
            }),
            {
              label: L("الخط الزمني", "Timeline"),
              role: "items",
              columns: { desktop: 4, mobile: 1 },
              style: { gap: 0 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
