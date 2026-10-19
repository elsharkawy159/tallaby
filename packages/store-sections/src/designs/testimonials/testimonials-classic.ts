/**
 * Classic testimonials (library T-a, Classic template): a full-width white
 * band with a heading, then three equal quote cards with stars, the review
 * and a round initial with name and city.
 */
import { defineDesign } from "../builder";
import { L, person, sectionHead, stars } from "../_kit";
import { REVIEWS } from "./_shared";

export const testimonialsClassic = defineDesign({
  id: "testimonials-classic",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("آراء كلاسيك", "Classic testimonials"),
  description: L("ثلاث بطاقات آراء بالنجوم والاسم والمدينة.", "Three review cards with stars, name and city."),
  keywords: ["testimonials", "reviews", "classic", "آراء", "تقييمات", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials"), style: { background: "secondary" } }, [
      t.container(
        [
          sectionHead(t, { title: L("آراء العملاء", "What customers say") }),
          t.grid(
            REVIEWS.slice(0, 3).map((r) =>
              t.card(
                [
                  t.stack([stars(t, r.rating), t.paragraph(r.text, { style: { color: "foreground", fontSize: "md" } }), person(t, r.initial, r.name, r.city)], {
                    label: L("المحتوى", "Content"),
                    style: { gap: 16 },
                  }),
                ],
                { label: L("رأي", "Review"), style: { radius: 20, borderWidth: 0, paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 } },
              ),
            ),
            { label: L("الآراء", "Reviews"), role: "items", columns: { desktop: 3, mobile: 1 }, style: { gap: 20, alignItems: "start" }, mobile: { gap: 14 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
