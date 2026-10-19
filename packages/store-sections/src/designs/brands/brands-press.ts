/**
 * As seen in (library L-d): one large quote from a publication with its name
 * on the start side, and a column of other publications on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { wordmark } from "./_shared";

export const brandsPress = defineDesign({
  id: "brands-press",
  version: 1,
  category: "brands",
  subcategory: "press",
  name: L("كتبوا عنا", "As seen in"),
  description: L("اقتباس كبير من موقع أو مؤثر بجانب شعارات من كتبوا عنك.", "A large quote from the press beside the logos of who featured you."),
  keywords: ["press", "as seen in", "media", "influencers", "كتبوا عنا", "صحافة", "مؤثرين"],
  tree: (t) =>
    t.section({ label: L("كتبوا عنا", "As seen in") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.icon("quote", { style: { fontSize: "4xl", color: "primary" } }),
                  t.heading(
                    L("«من أكثر المتاجر اهتمامًا بالمنتج الأصلي والضمان.»", "“One of the stores that cares most about genuine products and warranty.”"),
                    "h2",
                    { role: "quote", style: { fontSize: "display-sm", fontWeight: "semibold", lineHeight: "snug" } },
                  ),
                  wordmark(t, 1, "2xl"),
                ],
                { label: L("الاقتباس", "Quote"), style: { gap: 18, alignItems: "start", colSpan: 2 }, mobile: { colSpan: 1 } },
              ),
              t.stack(
                [
                  t.text(L("كتبوا عنا", "As seen in"), { style: { color: "muted", fontWeight: "semibold", letterSpacing: "wide" } }),
                  ...[2, 3, 4, 5].map((i) => wordmark(t, i, "xl")),
                ],
                {
                  label: L("الشعارات", "Logos"),
                  role: "items",
                  style: { gap: 22, background: "secondary", radius: 24, paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
                },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 3, mobile: 1 }, style: { gap: 48, alignItems: "center" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
