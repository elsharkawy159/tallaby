/**
 * Promise ticker (Modular set): a full-width sun band with the promises in
 * one centred row, separated by small stars. A lively divider between
 * sections. Drawn as a still row (no motion), which wraps on small screens.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { PROMISES } from "./_shared";

export const featuresTicker = defineDesign({
  id: "features-ticker",
  version: 1,
  category: "features",
  subcategory: "benefits-bar",
  name: L("شريط وعود", "Promise ticker"),
  description: L("شريط ملوّن فيه وعود الخدمة بينها نجوم صغيرة.", "A bright band with your promises separated by small stars."),
  keywords: ["features", "ticker", "band", "strip", "playful", "مميزات", "شريط"],
  tree: (t) =>
    t.section(
      {
        label: L("شريط الوعود", "Promise band"),
        style: { background: "accent", paddingTop: 18, paddingBottom: 18 },
      },
      [
        t.container(
          [
            t.row(
              PROMISES.flatMap((p, i) => [
                ...(i
                  ? [
                      t.icon("star", {
                        style: {
                          fontSize: "sm",
                          color: "foreground",
                          opacity: 60,
                        },
                      }),
                    ]
                  : []),
                t.row(
                  [
                    t.icon(p.icon, {
                      style: { fontSize: "lg", color: "foreground" },
                    }),
                    t.text(p.title, {
                      style: { fontWeight: "semibold", color: "foreground" },
                    }),
                  ],
                  {
                    label: L("وعد", "Promise"),
                    style: { gap: 8, wrap: false },
                  },
                ),
              ]),
              {
                label: L("الوعود", "Promises"),
                role: "items",
                style: { justifyContent: "center", gap: 28 },
                mobile: { gap: 14 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
