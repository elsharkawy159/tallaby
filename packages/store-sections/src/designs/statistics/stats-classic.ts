/**
 * Classic stats (library S-a, Classic template): four deep-colour rounded
 * tiles in a row, each with a large accent figure and a short label.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND_BODY } from "../_kit";
import { FIGURES } from "./_shared";

export const statsClassic = defineDesign({
  id: "stats-classic",
  version: 1,
  category: "statistics",
  subcategory: "counters",
  name: L("أرقام كلاسيك", "Classic stats"),
  description: L("أربعة مربعات داكنة بأرقام كبيرة ووصف قصير.", "Four deep tiles with big figures and short labels."),
  keywords: ["stats", "numbers", "counters", "classic", "أرقام", "إحصائيات", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأرقام", "Stats") }, [
      t.container(
        [
          t.grid(
            FIGURES.map((f) =>
              t.stack(
                [
                  t.heading(f.value, "h3", { style: { fontSize: "display-md", fontWeight: "extrabold", color: "accent", lineHeight: "tight" } }),
                  t.text(f.label, { style: { ...ON_BRAND_BODY, fontSize: "md" } }),
                ],
                {
                  label: L("رقم", "Stat"),
                  style: { background: "primary", radius: 24, gap: 8, paddingTop: 28, paddingBottom: 28, paddingStart: 24, paddingEnd: 24 },
                  mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 16, paddingEnd: 16 },
                },
              ),
            ),
            { label: L("الأرقام", "Stats"), role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
