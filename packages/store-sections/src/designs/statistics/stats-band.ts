/**
 * Number band (Modular set): a full-width brand band with the figures in one
 * line, each value large with its label beneath, separated by sun dots. A bold
 * proof strip between home page sections; 2×2 on mobile.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BIG_NUMBER } from "../_modular";
import { FIGURES } from "./_shared";

export const statsBand = defineDesign({
  id: "stats-band",
  version: 1,
  category: "statistics",
  subcategory: "trust-badges",
  name: L("شريط أرقام", "Number band"),
  description: L("شريط بلون المتجر فيه الأرقام على سطر واحد.", "A brand-coloured band with your figures on one line."),
  keywords: ["stats", "band", "numbers", "bold", "strip", "أرقام", "شريط"],
  tree: (t) =>
    t.section(
      {
        label: L("الأرقام", "Stats"),
        style: { background: "primary", paddingTop: 48, paddingBottom: 48 },
      },
      [
        t.container(
          [
            t.row(
              FIGURES.flatMap((f, i) => [
                ...(i
                  ? [
                      t.box([], {
                        label: L("فاصل", "Separator"),
                        style: {
                          background: "accent",
                          radius: 999,
                          width: "8px",
                          minHeight: 8,
                        },
                        mobile: { hidden: true },
                      }),
                    ]
                  : []),
                t.stack(
                  [
                    t.text(f.value, {
                      role: "value",
                      style: {
                        ...BIG_NUMBER,
                        fontSize: "5xl",
                        textAlign: "center",
                        ...ON_BRAND,
                      },
                      mobile: { fontSize: "4xl" },
                    }),
                    t.text(f.label, {
                      style: {
                        fontSize: "sm",
                        textAlign: "center",
                        ...ON_BRAND_BODY,
                      },
                    }),
                  ],
                  {
                    label: L("رقم", "Stat"),
                    style: { gap: 6, alignItems: "center" },
                    mobile: { width: "44%" },
                  },
                ),
              ]),
              {
                label: L("الأرقام", "Stats"),
                role: "items",
                style: {
                  justifyContent: "around",
                  alignItems: "center",
                  gap: 24,
                },
                mobile: { justifyContent: "center", gap: 20 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
