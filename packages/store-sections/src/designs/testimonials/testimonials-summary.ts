/**
 * Rating breakdown (Claude Design premium set, `reviewSummary`; 2026-10-27):
 * on the start side the title, the average score beside its stars, five
 * breakdown bars and an outline button; on the end side short bordered review
 * cards in two columns. The score and bars are worked out from the four cards
 * shown, so they stay true until the seller edits the cards. Stacks on
 * tablets and phones.
 */
import { defineDesign } from "../builder";
import { L, N, arDigits, stars } from "../_kit";
import { REVIEWS } from "./_shared";

const SHOWN = REVIEWS.slice(0, 4);
const AVERAGE = (SHOWN.reduce((sum, r) => sum + r.rating, 0) / SHOWN.length).toFixed(1);
const BARS = [5, 4, 3, 2, 1].map((n) => {
  const count = SHOWN.filter((r) => r.rating === n).length;
  return { n, count, width: `${Math.round((count / SHOWN.length) * 100)}%` };
});

export const testimonialsSummary = defineDesign({
  id: "testimonials-summary",
  version: 1,
  category: "testimonials",
  subcategory: "rating-summary",
  name: L("توزيع التقييم", "Rating breakdown"),
  description: L(
    "متوسط التقييم وأشرطة توزيع النجوم في جنب، وكروت آراء قصيرة في عمودين جنبها.",
    "The average score and star breakdown bars on one side, short review cards in two columns beside them.",
  ),
  keywords: ["reviews", "rating", "summary", "breakdown", "stars", "premium", "تقييمات", "ملخص", "نجوم", "آراء"],
  tree: (t) =>
    t.section({ label: L("ملخص التقييم", "Rating summary") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("تقييمات العملاء", "Customer reviews"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", lineHeight: "tight" },
                    mobile: { fontSize: "3xl" },
                  }),
                  t.row(
                    [
                      t.text(L(arDigits(AVERAGE).replace(".", "٫"), AVERAGE), { role: "value", style: { fontFamily: "heading", fontSize: "5xl", fontWeight: "bold", lineHeight: "tight" } }),
                      t.stack(
                        [
                          stars(t, Math.round(Number(AVERAGE))),
                          t.text(L(arDigits(`بناءً على ${SHOWN.length} تقييمات`),`Based on ${SHOWN.length} reviews`), {
                            style: { color: "muted", fontSize: "sm" },
                          }),
                        ],
                        { label: L("النجوم", "Stars"), style: { gap: 4 } },
                      ),
                    ],
                    { label: L("المتوسط", "Average"), style: { gap: 14, wrap: false, alignItems: "center" } },
                  ),
                  t.stack(
                    BARS.map((b) =>
                      t.row(
                        [
                          t.row([t.text(N(String(b.n)), { style: { fontWeight: "semibold", fontSize: "sm" } }), t.icon("star", { style: { fontSize: "xs", color: "accent" } })], {
                            label: L("النجوم", "Stars"),
                            style: { gap: 3, wrap: false, alignItems: "center" },
                          }),
                          t.box([t.box([], { label: L("الجزء الممتلئ", "Fill"), style: { background: "accent", radius: 4, minHeight: 8, width: b.width } })], {
                            label: L("الشريط", "Bar"),
                            style: { background: "secondary", radius: 4, minHeight: 8, width: "100%", overflow: "hidden" },
                          }),
                          t.text(N(String(b.count)), { style: { color: "muted", fontSize: "sm", textAlign: "end" } }),
                        ],
                        { label: L("صف", "Row"), style: { gap: 10, wrap: false, alignItems: "center" } },
                      ),
                    ),
                    { label: L("التوزيع", "Breakdown"), style: { gap: 8 } },
                  ),
                  t.row([t.button(L("تسوّق الأكثر مبيعًا", "Shop best sellers"), "/products", "outline", { role: "cta" })], {
                    label: L("الزر", "Button"),
                    style: { gap: 12 },
                  }),
                ],
                { label: L("الملخص", "Summary"), role: "intro", style: { gap: 16 } },
              ),
              t.grid(
                SHOWN.map((r) =>
                  t.stack(
                    [
                      stars(t, r.rating),
                      t.quote(r.text, { style: { borderWidth: 0, paddingStart: 0, paddingEnd: 0, fontSize: "sm", lineHeight: "relaxed", color: "foreground" } }),
                      t.row(
                        [
                          t.box([t.text(r.initial, { style: { fontWeight: "bold", color: "primaryInk", textAlign: "center", fontFamily: "heading" } })], {
                            label: L("الصورة الرمزية", "Avatar"),
                            style: { background: "primary", radius: 999, width: "40px", paddingTop: 9, paddingBottom: 9, paddingStart: 0, paddingEnd: 0 },
                          }),
                          t.stack(
                            [
                              t.text(r.name, { style: { fontWeight: "semibold", fontSize: "sm" } }),
                              t.row(
                                [
                                  t.icon("check", { style: { fontSize: "sm", color: "primary" } }),
                                  t.text(L("مشتري مؤكد", "Verified buyer"), { style: { color: "muted", fontSize: "xs" } }),
                                ],
                                { label: L("موثّق", "Verified"), style: { gap: 4, wrap: false, alignItems: "center" } },
                              ),
                            ],
                            { label: L("الاسم", "Name"), style: { gap: 2 } },
                          ),
                        ],
                        { label: L("صاحب الرأي", "Reviewer"), style: { gap: 10, wrap: false, alignItems: "center" } },
                      ),
                    ],
                    {
                      label: L("رأي", "Review"),
                      style: { background: "background", borderWidth: 1, borderColor: "border", radius: 16, gap: 10, paddingTop: 18, paddingBottom: 18, paddingStart: 18, paddingEnd: 18 },
                    },
                  ),
                ),
                {
                  label: L("الآراء", "Reviews"),
                  role: "items",
                  columns: { desktop: 2, tablet: 2, mobile: 1 },
                  style: { gap: 12, colSpan: 2, alignItems: "stretch" },
                  tablet: { colSpan: 1 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, tablet: 1, mobile: 1 },
              style: { gap: 56, alignItems: "start" },
              tablet: { gap: 32 },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
