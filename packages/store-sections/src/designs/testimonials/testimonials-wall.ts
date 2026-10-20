/**
 * Review wall (library T-d): a wall of reviews in three columns of uneven
 * cards, alternating paper and accent tints, closed by a "see all" button.
 */
import { defineDesign } from "../builder";
import { L, person, sectionHead, stars } from "../_kit";
import { REVIEWS } from "./_shared";

export const testimonialsWall = defineDesign({
  id: "testimonials-wall",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("حائط الآراء", "Review wall"),
  description: L("أعمدة من بطاقات آراء بألوان متبادلة لإظهار كثرة العملاء.", "Columns of review cards in alternating tints to show volume."),
  keywords: ["reviews", "wall", "testimonials", "آراء", "حائط"],
  tree: (t) =>
    t.section({ label: L("حائط الآراء", "Review wall") }, [
      t.container(
        [
          sectionHead(t, { title: L("ماذا يقولون عنا", "What people say"), align: "center" }),
          t.grid(
            [0, 1, 2].map((col) =>
              t.stack(
                REVIEWS.filter((_, i) => i % 3 === col).map((r, i) =>
                  t.card(
                    [
                      t.stack([stars(t, r.rating), t.paragraph(r.text, { style: { color: "foreground" } }), person(t, r.initial, r.name, r.city)], {
                        label: L("المحتوى", "Content"),
                        style: { gap: 14 },
                      }),
                    ],
                    {
                      label: L("رأي", "Review"),
                      style: { radius: 20, ...((col + i) % 2 === 1 && { background: "accent", borderWidth: 0 }) },
                    },
                  ),
                ),
                { label: L("عمود", "Column"), style: { gap: 16, ...(col === 1 && { marginTop: 32 }) }, mobile: { marginTop: 0 } },
              ),
            ),
            { label: L("الحائط", "Wall"), role: "items", columns: { desktop: 3, mobile: 1 }, style: { gap: 16, alignItems: "start", marginTop: 32 } },
          ),
          t.stack([t.button(L("كل الآراء", "See all reviews"), "/products", "outline", { role: "cta" })], {
            label: L("الزر", "Button"),
            style: { alignItems: "center", marginTop: 32 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
