/**
 * Big numbers (library F-b, moved to Stats as S-b): a tinted rounded panel
 * with a short heading on the start side and four large figures in a row,
 * separated by thin rules. Mobile turns into a 2×2 grid.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FIGURES } from "./_shared";

export const statsBigNumbers = defineDesign({
  id: "stats-big-numbers",
  version: 1,
  category: "statistics",
  subcategory: "counters",
  name: L("أرقام كبيرة", "Big numbers"),
  description: L("لوحة ملونة بعنوان قصير وأربعة أرقام كبيرة بينها خطوط.", "A tinted panel with a short heading and four large figures between rules."),
  keywords: ["stats", "numbers", "figures", "أرقام", "إحصائيات"],
  tree: (t) =>
    t.section({ label: L("أرقامنا", "Our numbers") }, [
      t.container(
        [
          t.grid(
            [
              t.heading(L("أرقامنا تتكلم عنا", "Numbers that speak"), "h2", {
                role: "title",
                style: { fontSize: "display-sm" },
                tablet: { colSpan: 3 },
                mobile: { colSpan: 2 },
              }),
              ...FIGURES.map((f) =>
                t.stack(
                  [
                    t.heading(f.value, "h3", { style: { fontSize: "display-md", fontWeight: "extrabold", lineHeight: "tight" } }),
                    t.text(f.label, { style: { color: "muted" } }),
                  ],
                  {
                    label: L("رقم", "Stat"),
                    style: { gap: 6 },
                  },
                ),
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              role: "items",
              columns: { desktop: 5, tablet: 3, mobile: 2 },
              style: {
                gap: 24,
                alignItems: "center",
                background: "secondary",
                radius: 28,
                paddingTop: 40,
                paddingBottom: 40,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: { gap: 20, paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
