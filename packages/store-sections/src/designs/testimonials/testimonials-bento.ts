/**
 * Review bento (Modular set): a brand tile with the overall rating, a large
 * quote tile and two smaller review tiles on shelf. Proof and personality in
 * one block on the home page. On mobile the rating comes first.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY, stars } from "../_kit";
import { BIG_NUMBER, BRAND_TILE, TILE, TILE_MOBILE, who } from "../_modular";
import { REVIEWS } from "./_shared";

export const testimonialsBento = defineDesign({
  id: "testimonials-bento",
  version: 1,
  category: "testimonials",
  subcategory: "rating-summary",
  name: L("بينتو آراء", "Review bento"),
  description: L("مربع بالتقييم العام ومربعات بآراء العملاء.", "A tile with your overall rating and tiles with customer reviews."),
  keywords: ["testimonials", "bento", "rating", "reviews", "bold", "آراء", "تقييم", "بينتو"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.text(L("٤٫٨", "4.8"), {
                    role: "value",
                    style: { ...BIG_NUMBER, fontSize: "6xl", ...ON_BRAND },
                  }),
                  stars(t),
                  t.text(L("متوسط ١٢٬٤٠٠ تقييم", "Average of 12,400 reviews"), {
                    style: { fontSize: "sm", ...ON_BRAND_BODY },
                  }),
                ],
                {
                  label: L("التقييم", "Rating"),
                  role: "rating",
                  style: { ...BRAND_TILE, gap: 10, justifyContent: "end" },
                  mobile: TILE_MOBILE,
                },
              ),
              ...REVIEWS.slice(0, 3).map((r, i) =>
                t.stack(
                  [
                    stars(t, r.rating),
                    t.quote(r.text, {
                      style: {
                        fontSize: i === 0 ? "2xl" : "md",
                        lineHeight: "snug",
                        borderWidth: 0,
                      },
                    }),
                    who(t, r.initial, r.name, r.city, i + 1),
                  ],
                  {
                    label: L("رأي", "Review"),
                    style: {
                      ...TILE,
                      gap: 16,
                      justifyContent: "between",
                      ...(i === 0 && { colSpan: 2 }),
                    },
                    mobile: { ...TILE_MOBILE, colSpan: 1 },
                  },
                ),
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
