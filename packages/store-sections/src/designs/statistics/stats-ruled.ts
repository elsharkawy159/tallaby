/**
 * Ruled grid (Modular set): a short title on the start side and a 2×2
 * hairline grid of very large numbers with small labels on the end side. A
 * calm, factual block for About pages.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, RULED, RULED_CELL, dotLabel } from "../_modular";
import { FIGURES } from "./_shared";

export const statsRuled = defineDesign({
  id: "stats-ruled",
  version: 1,
  category: "statistics",
  subcategory: "stats-content",
  name: L("شبكة أرقام", "Ruled grid"),
  description: L("عنوان قصير بجانب شبكة ٢×٢ بأرقام كبيرة.", "A short title beside a 2×2 grid of big numbers."),
  keywords: ["stats", "numbers", "ruled", "about", "أرقام", "إحصائيات"],
  tree: (t) =>
    t.section({ label: L("الأرقام", "Stats") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("بالأرقام", "In numbers")),
                  t.heading(L("ثمان سنين من الطلبات", "Eight years of orders"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 10 } },
              ),
              t.grid(
                FIGURES.map((f) =>
                  t.stack(
                    [
                      t.text(f.value, {
                        role: "value",
                        style: { ...BIG_NUMBER, fontSize: "5xl" },
                        mobile: { fontSize: "4xl" },
                      }),
                      t.text(f.label, {
                        style: { color: "muted", fontSize: "sm" },
                      }),
                    ],
                    {
                      label: L("رقم", "Stat"),
                      style: {
                        ...RULED_CELL,
                        gap: 8,
                        paddingTop: 32,
                        paddingBottom: 32,
                        paddingStart: 28,
                        paddingEnd: 28,
                      },
                      mobile: {
                        paddingTop: 22,
                        paddingBottom: 22,
                        paddingStart: 18,
                        paddingEnd: 18,
                      },
                    },
                  ),
                ),
                {
                  label: L("الأرقام", "Stats"),
                  role: "items",
                  columns: { desktop: 2, mobile: 2 },
                  style: RULED,
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
