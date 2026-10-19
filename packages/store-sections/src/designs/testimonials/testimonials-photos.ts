/**
 * Photo reviews (library T-e): tall cards with the customer's photo on top
 * and a rating chip on it, then the review, the reviewer and a small "bought"
 * line at the bottom.
 */
import { defineDesign } from "../builder";
import { L, N, person, sectionHead } from "../_kit";
import { REVIEWS } from "./_shared";

export const testimonialsPhotos = defineDesign({
  id: "testimonials-photos",
  version: 1,
  category: "testimonials",
  subcategory: "carousel",
  name: L("آراء بالصور", "Photo reviews"),
  description: L("بطاقات آراء بصورة العميل وتقييمه والمنتج الذي اشتراه.", "Review cards with the customer's photo, rating and what they bought."),
  keywords: ["reviews", "photos", "ugc", "testimonials", "آراء", "صور", "عملاء"],
  tree: (t) =>
    t.section({ label: L("آراء بالصور", "Photo reviews") }, [
      t.container(
        [
          sectionHead(t, { title: L("من عملائنا", "From our customers") }),
          t.grid(
            REVIEWS.slice(0, 4).map((r, i) =>
              t.card(
                [
                  t.box(
                    [
                      t.photo(i + 2, L("صورة العميل", "Customer photo"), { style: { aspectRatio: "square", objectFit: "cover", radius: 0 } }),
                      t.row([t.icon("star", { style: { color: "accent", fontSize: "sm" } }), t.text(N(String(r.rating)), { style: { fontWeight: "bold" } })], {
                        label: L("التقييم", "Rating"),
                        style: {
                          position: "absolute",
                          insetTop: "12px",
                          insetStart: "12px",
                          gap: 4,
                          background: "background",
                          radius: 999,
                          paddingTop: 4,
                          paddingBottom: 4,
                          paddingStart: 10,
                          paddingEnd: 10,
                        },
                      }),
                    ],
                    { label: L("الصورة", "Photo"), style: { position: "relative" } },
                  ),
                  t.stack(
                    [
                      t.paragraph(r.text, { style: { color: "foreground" } }),
                      person(t, r.initial, r.name, r.city),
                      t.row(
                        [
                          t.icon("shopping-bag", { style: { fontSize: "sm", color: "primary" } }),
                          t.text(L("اشترى من المتجر", "Verified buyer"), { style: { fontSize: "xs", color: "muted" } }),
                        ],
                        {
                          label: L("اشترى", "Bought"),
                          style: { gap: 6 },
                        },
                      ),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 14, paddingTop: 18, paddingBottom: 20, paddingStart: 18, paddingEnd: 18 } },
                  ),
                ],
                { label: L("رأي", "Review"), style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 20, overflow: "hidden" } },
              ),
            ),
            { label: L("الآراء", "Reviews"), role: "items", columns: { desktop: 4, tablet: 2, mobile: 1 }, style: { gap: 16, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
