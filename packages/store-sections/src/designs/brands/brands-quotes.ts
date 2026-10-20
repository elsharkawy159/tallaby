/**
 * Press quotes (Modular set): one large press quote centred on the page, the
 * publication under it, and a row of other publications' wordmarks, the first
 * highlighted. For stores where press coverage is part of the story.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { wordmark } from "./_shared";

export const brandsQuotes = defineDesign({
  id: "brands-quotes",
  version: 1,
  category: "brands",
  subcategory: "press",
  name: L("قالوا عننا", "Press quotes"),
  description: L("اقتباس كبير من موقع أو جريدة كتبت عنك، وتحته شعاراتهم.", "A large quote from the press, with publication names below."),
  keywords: ["brands", "press", "as seen in", "quote", "premium", "كتبوا عنا", "صحافة"],
  tree: (t) =>
    t.section({ label: L("قالوا عننا", "Press") }, [
      t.container(
        [
          t.stack(
            [
              t.icon("quote", { style: { fontSize: "2xl", color: "accent" } }),
              t.quote(
                L("«واحد من أكتر المتاجر اللي ممكن تثق فيها لو بتدور على منتج أصلي.»", "“One of the most trustworthy places to buy genuine products online.”"),
                {
                  role: "quote",
                  style: {
                    fontSize: "display-sm",
                    fontWeight: "semibold",
                    textAlign: "center",
                    lineHeight: "snug",
                    maxWidth: "32ch",
                    borderWidth: 0,
                  },
                },
              ),
              t.row(
                [0, 1, 2].map((i) =>
                  t.stack([wordmark(t, i + 3, "xl")], {
                    label: L("جريدة", "Publication"),
                    style: {
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingStart: 20,
                      paddingEnd: 20,
                      radius: 999,
                      ...(i === 0
                        ? {
                            background: "secondary",
                            borderWidth: 1,
                            borderColor: "border",
                          }
                        : { opacity: 70 }),
                    },
                  }),
                ),
                {
                  label: L("الجرايد", "Publications"),
                  role: "items",
                  style: { gap: 12, justifyContent: "center", marginTop: 12 },
                },
              ),
            ],
            {
              label: L("الاقتباس", "Quote"),
              style: { gap: 20, alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
