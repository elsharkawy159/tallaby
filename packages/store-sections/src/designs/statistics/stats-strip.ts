/**
 * Number strip (library S-e): one white rounded strip split into four equal
 * cells, each a brand figure over a muted label; no heading. Mobile is 2×2.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD } from "../_kit";
import { FIGURES } from "./_shared";

export const statsStrip = defineDesign({
  id: "stats-strip",
  version: 1,
  category: "statistics",
  subcategory: "trust-badges",
  name: L("شريط أرقام", "Number strip"),
  description: L("شريط أبيض بأربعة أرقام صغيرة، مناسب تحت الواجهة.", "A compact white strip of four figures, good under the hero."),
  keywords: ["stats", "trust", "strip", "numbers", "ثقة", "أرقام", "شريط"],
  tree: (t) =>
    t.section({ label: L("شريط الأرقام", "Number strip"), style: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            FIGURES.map((f) =>
              t.stack(
                [
                  t.heading(f.value, "h3", { style: { fontSize: "3xl", fontWeight: "extrabold", color: "primary", textAlign: "center" } }),
                  t.text(f.label, { style: { color: "muted", textAlign: "center" } }),
                ],
                { label: L("رقم", "Stat"), style: { gap: 4, paddingTop: 20, paddingBottom: 20 } },
              ),
            ),
            {
              label: L("الشريط", "Strip"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { ...PAPER_CARD, gap: 0, paddingStart: 16, paddingEnd: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
