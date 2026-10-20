/**
 * Rating summary (library T-c): a tinted score card with the average in huge
 * type, stars, the count and five bars on the start side; two latest reviews
 * stacked on the end side.
 */
import { defineDesign } from "../builder";
import { L, arrowLink, person, stars } from "../_kit";
import { REVIEWS } from "./_shared";

const BARS = [
  { stars: L("٥", "5"), share: L("٧٨٪", "78%"), width: "78%" },
  { stars: L("٤", "4"), share: L("١٥٪", "15%"), width: "15%" },
  { stars: L("٣", "3"), share: L("٤٪", "4%"), width: "4%" },
  { stars: L("٢", "2"), share: L("٢٪", "2%"), width: "2%" },
  { stars: L("١", "1"), share: L("١٪", "1%"), width: "1%" },
];

export const testimonialsRating = defineDesign({
  id: "testimonials-rating",
  version: 1,
  category: "testimonials",
  subcategory: "rating-summary",
  name: L("ملخص التقييم", "Rating summary"),
  description: L("متوسط التقييم وتوزيع النجوم بجانب أحدث رأيين.", "The average rating and star breakdown beside the two latest reviews."),
  keywords: ["rating", "reviews", "summary", "stars", "تقييم", "نجوم", "آراء"],
  tree: (t) =>
    t.section({ label: L("ملخص التقييم", "Rating summary") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("تقييم عملائنا", "Customer rating"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
                  t.heading(L("٤٫٨", "4.8"), "h2", { role: "value", style: { fontSize: "6xl", fontWeight: "extrabold", lineHeight: "tight" } }),
                  stars(t, 5),
                  t.text(L("من ٢٬٣١٢ تقييم", "from 2,312 reviews"), { style: { color: "muted" } }),
                  t.stack(
                    BARS.map((b) =>
                      t.row(
                        [
                          t.text(b.stars, { style: { width: "16px", fontWeight: "semibold" } }),
                          t.box(
                            [t.box([], { label: L("الجزء الممتلئ", "Fill"), style: { background: "accent", radius: 999, minHeight: 8, width: b.width } })],
                            {
                              label: L("الشريط", "Bar"),
                              style: { background: "background", radius: 999, minHeight: 8, width: "70%" },
                            },
                          ),
                          t.text(b.share, { style: { color: "muted", fontSize: "xs" } }),
                        ],
                        { label: L("صف", "Row"), style: { gap: 10, wrap: false } },
                      ),
                    ),
                    { label: L("التوزيع", "Breakdown"), style: { gap: 8, marginTop: 12 } },
                  ),
                ],
                {
                  label: L("بطاقة التقييم", "Score card"),
                  style: { background: "secondary", radius: 28, gap: 8, paddingTop: 32, paddingBottom: 32, paddingStart: 32, paddingEnd: 32 },
                },
              ),
              t.stack(
                [
                  ...REVIEWS.slice(0, 2).map((r) =>
                    t.card(
                      [
                        t.stack([stars(t, r.rating), t.paragraph(r.text, { style: { color: "foreground" } }), person(t, r.initial, r.name, r.city)], {
                          label: L("المحتوى", "Content"),
                          style: { gap: 14 },
                        }),
                      ],
                      {
                        label: L("رأي", "Review"),
                        style: { radius: 20 },
                      },
                    ),
                  ),
                  arrowLink(t, L("كل التقييمات", "All reviews"), "/products"),
                ],
                { label: L("أحدث الآراء", "Latest reviews"), role: "items", style: { gap: 16, colSpan: 2 }, mobile: { colSpan: 1 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 3, mobile: 1 }, style: { gap: 24, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
