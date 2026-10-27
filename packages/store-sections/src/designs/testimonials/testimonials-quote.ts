/**
 * Quiet quote (Claude Design premium set, `reviewSpotlight`; 2026-10-27): a
 * calm, narrow centred block with a small eyebrow, a soft quote mark, the
 * stars, one review set large in the heading font, and the reviewer's name
 * and city. A breather between busy product sections. The source swipes
 * through several quotes; here the seller writes one.
 */
import { defineDesign } from "../builder";
import { L, stars } from "../_kit";
import { REVIEWS } from "./_shared";

export const testimonialsQuote = defineDesign({
  id: "testimonials-quote",
  version: 1,
  category: "testimonials",
  subcategory: "quote",
  name: L("رأي هادي", "Quiet quote"),
  description: L("رأي عميل واحد بخط كبير في النص، مع النجوم والاسم.", "One customer review set large in the centre, with the stars and the name."),
  keywords: ["testimonial", "quote", "review", "calm", "minimal", "premium", "اقتباس", "رأي", "تقييم"],
  tree: (t) =>
    t.section({ label: L("رأي العميل", "Customer quote") }, [
      t.container(
        [
          t.stack(
            [
              t.text(L("آراء العملاء", "Customer reviews"), { role: "eyebrow", style: { color: "primary", fontWeight: "semibold", fontSize: "sm" } }),
              t.icon("quote", { style: { fontSize: "4xl", color: "primary", opacity: 50 } }),
              stars(t, 5),
              t.heading(
                L(
                  "«من أحسن تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف شيك، والمنتج أحلى من الصور.»",
                  "“One of the best online orders I've had. Fast delivery, lovely packaging, and the product beats the photos.”",
                ),
                "h2",
                {
                  role: "quote",
                  style: { fontSize: "3xl", fontWeight: "medium", lineHeight: "snug", textAlign: "center", maxWidth: "820px" },
                  mobile: { fontSize: "xl" },
                },
              ),
              t.stack(
                [
                  t.text(REVIEWS[0]!.name, { style: { fontWeight: "semibold" } }),
                  t.text(REVIEWS[0]!.city, { style: { color: "muted", fontSize: "sm" } }),
                ],
                { label: L("صاحب الرأي", "Reviewer"), style: { gap: 2, alignItems: "center" } },
              ),
            ],
            { label: L("الاقتباس", "Quote"), style: { gap: 16, alignItems: "center", textAlign: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "960px" } },
      ),
    ]),
});
