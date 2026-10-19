/**
 * Spotlight quote (library T-b): one review set large and centred under a
 * quote mark, the reviewer below it, and a row of other reviewers' initials.
 */
import { defineDesign } from "../builder";
import { L, person, stars } from "../_kit";
import { REVIEWS } from "./_shared";

export const testimonialsSpotlight = defineDesign({
  id: "testimonials-spotlight",
  version: 1,
  category: "testimonials",
  subcategory: "quote",
  name: L("اقتباس كبير", "Spotlight quote"),
  description: L("رأي واحد بخط كبير في المنتصف مع صاحبه.", "One review set large in the centre with its author."),
  keywords: ["testimonial", "quote", "review", "اقتباس", "رأي"],
  tree: (t) =>
    t.section({ label: L("رأي مميز", "Spotlight quote"), style: { background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              t.icon("quote", { style: { fontSize: "5xl", color: "primary" } }),
              stars(t, 5),
              t.heading(
                L(
                  "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»",
                  "“One of the best online orders I've had. Fast delivery, lovely packaging, and the product beats the photos.”",
                ),
                "h2",
                { role: "quote", style: { fontSize: "display-sm", fontWeight: "semibold", lineHeight: "snug", textAlign: "center", maxWidth: "820px" } },
              ),
              person(t, REVIEWS[0]!.initial, REVIEWS[0]!.name, REVIEWS[0]!.city),
              t.row(
                REVIEWS.slice(1, 5).map((r) =>
                  t.box([t.text(r.initial, { style: { textAlign: "center", fontWeight: "bold" } })], {
                    label: L("صاحب رأي", "Reviewer"),
                    style: { width: "44px", radius: 999, paddingTop: 10, paddingBottom: 10, background: "background", borderWidth: 1, borderColor: "border" },
                  }),
                ),
                { label: L("آراء أخرى", "More reviewers"), style: { gap: 8, justifyContent: "center", marginTop: 8 } },
              ),
            ],
            { label: L("الاقتباس", "Quote"), style: { gap: 20, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
