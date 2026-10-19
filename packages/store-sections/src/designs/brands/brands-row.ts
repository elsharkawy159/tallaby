/**
 * Logo row (library L-a): a small centred caption over one row of logos
 * evenly spaced in a white rounded strip, each muted until hover.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD } from "../_kit";
import { wordmark } from "./_shared";

export const brandsRow = defineDesign({
  id: "brands-row",
  version: 1,
  category: "brands",
  subcategory: "logo-grid",
  name: L("شريط الماركات", "Logo row"),
  description: L("سطر قصير فوق شريط أبيض بشعارات الماركات.", "A short caption over a white strip of brand logos."),
  keywords: ["brands", "logos", "trust", "ماركات", "شعارات", "علامات"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands"), style: { paddingTop: 32, paddingBottom: 32 } }, [
      t.container(
        [
          t.text(L("ماركات أصلية نبيعها", "Genuine brands we carry"), {
            role: "title",
            style: { textAlign: "center", color: "muted", fontWeight: "medium", marginBottom: 16 },
          }),
          t.grid(
            Array.from({ length: 6 }, (_, i) => wordmark(t, i)),
            {
              label: L("الشعارات", "Logos"),
              role: "items",
              columns: { desktop: 6, mobile: 3 },
              style: { ...PAPER_CARD, gap: 24, alignItems: "center", paddingTop: 28, paddingBottom: 28, paddingStart: 32, paddingEnd: 32 },
              mobile: { gap: 18, paddingTop: 20, paddingBottom: 20, paddingStart: 16, paddingEnd: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
