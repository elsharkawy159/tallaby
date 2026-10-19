/**
 * Ruled quotes (Modular set): three reviews in one hairline-ruled row, each
 * with a star row, the review and the customer's name and city at the bottom.
 * One column on mobile.
 */
import { defineDesign } from "../builder";
import { L, stars } from "../_kit";
import { RULED, RULED_CELL, modHead, who } from "../_modular";
import { REVIEWS } from "./_shared";

export const testimonialsRuled = defineDesign({
  id: "testimonials-ruled",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("اقتباسات مقسمة", "Ruled quotes"),
  description: L("ثلاث آراء في صف واحد بخطوط رفيعة.", "Three reviews in one hairline-ruled row."),
  keywords: ["testimonials", "reviews", "ruled", "minimal", "آراء", "تقييمات"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials") }, [
      t.container(
        [
          modHead(t, {
            label: L("آراء العملاء", "Reviews"),
            title: L("قالوا عننا", "What customers say"),
          }),
          t.grid(
            REVIEWS.slice(0, 3).map((r, i) =>
              t.stack(
                [
                  stars(t, r.rating),
                  t.quote(r.text, {
                    style: {
                      fontSize: "lg",
                      lineHeight: "relaxed",
                      borderWidth: 0,
                    },
                  }),
                  who(t, r.initial, r.name, r.city, i),
                ],
                {
                  label: L("رأي", "Review"),
                  style: {
                    ...RULED_CELL,
                    gap: 18,
                    justifyContent: "between",
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 28,
                    paddingEnd: 28,
                  },
                  mobile: {
                    paddingTop: 22,
                    paddingBottom: 22,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                },
              ),
            ),
            {
              label: L("الآراء", "Reviews"),
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
