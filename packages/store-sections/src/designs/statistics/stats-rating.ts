/**
 * Rating breakdown (Modular set): a paper card with the overall rating very
 * large, five stars and the review count on the start side, and five bars for
 * 5 to 1 stars with percentages on the end side. The seller types the figures
 * from their reviews. Stacks on mobile.
 */
import { defineDesign } from "../builder";
import { L, N, PAPER_CARD, stars } from "../_kit";
import { BIG_NUMBER, bar } from "../_modular";

const SHARES = [78, 14, 5, 2, 1];

export const statsRating = defineDesign({
  id: "stats-rating",
  version: 1,
  category: "statistics",
  subcategory: "counters",
  name: L("تفصيل التقييم", "Rating breakdown"),
  description: L("التقييم العام كبير، وجنبه أشرطة لكل عدد نجوم.", "Your overall rating, large, beside a bar for each star level."),
  keywords: ["stats", "rating", "reviews", "stars", "تقييم", "نجوم", "آراء"],
  tree: (t) =>
    t.section({ label: L("التقييم", "Rating") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.text(L("٤٫٨", "4.8"), {
                    role: "value",
                    style: { ...BIG_NUMBER, fontSize: "6xl" },
                  }),
                  stars(t),
                  t.text(L("من ١٢٬٤٠٠ تقييم", "from 12,400 reviews"), {
                    style: { color: "muted", fontSize: "sm" },
                  }),
                ],
                {
                  label: L("الملخص", "Summary"),
                  style: { gap: 10, justifyContent: "center" },
                },
              ),
              t.stack(
                SHARES.map((share, i) =>
                  t.row(
                    [
                      t.row(
                        [
                          t.text(N(String(5 - i)), {
                            style: { fontWeight: "semibold", fontSize: "sm" },
                          }),
                          t.icon("star", {
                            style: { fontSize: "sm", color: "accent" },
                          }),
                        ],
                        {
                          label: L("النجوم", "Stars"),
                          style: { gap: 4, wrap: false, width: "40px" },
                        },
                      ),
                      bar(t, `${share}%`, { width: "100%" }),
                      t.text(N(`${share}%`), {
                        style: {
                          color: "muted",
                          fontSize: "sm",
                          width: "44px",
                          textAlign: "end",
                        },
                      }),
                    ],
                    { label: L("سطر", "Row"), style: { gap: 12, wrap: false } },
                  ),
                ),
                {
                  label: L("الأشرطة", "Bars"),
                  role: "items",
                  style: { gap: 12, colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              columns: { desktop: 3, mobile: 1 },
              style: {
                ...PAPER_CARD,
                radius: 24,
                gap: 48,
                alignItems: "center",
                paddingTop: 40,
                paddingBottom: 40,
                paddingStart: 40,
                paddingEnd: 40,
                maxWidth: "900px",
              },
              mobile: {
                gap: 24,
                paddingTop: 24,
                paddingBottom: 24,
                paddingStart: 20,
                paddingEnd: 20,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
