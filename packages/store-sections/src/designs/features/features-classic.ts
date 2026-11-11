/**
 * Classic features (library F-a, Classic template): the four service promises
 * in one row, each an icon beside a bold title and a muted line.
 *
 * v2 (look-first pilot L7, 2026-11-11): a ruled row. The bordered cards and
 * the tinted icon tiles are gone: the promises sit between two hairlines with
 * a thin icon, a small title and one quiet line, and air instead of boxes.
 * Four across on desktop, 2×2 on tablets and phones (the icon above the
 * text). Same nodes and field names as v1, plus the two rules.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { PROMISES } from "./_shared";

const NO_PAD = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } as const;

export const featuresClassic = defineDesign({
  id: "features-classic",
  version: 2,
  category: "features",
  subcategory: "benefits-bar",
  name: L("مميزات كلاسيك", "Classic features"),
  description: L("أربع وعود خدمة في صف هادي بين خطين رفيعين: أيقونة وعنوان وسطر.", "Four service promises in a quiet row between two hairlines: an icon, a title and a line."),
  keywords: ["features", "benefits", "trust", "classic", "ruled", "مميزات", "خدمة", "كلاسيك"],
  tree: (t) =>
    t.section(
      {
        label: L("المميزات", "Features"),
        style: { paddingTop: 40, paddingBottom: 40 },
        mobile: { paddingTop: 28, paddingBottom: 28 },
      },
      [
        t.container(
          [
            t.divider({ label: L("خط", "Rule") }),
            t.grid(
              PROMISES.map((p) =>
                t.card(
                  [
                    t.row(
                      [
                        t.box([t.icon(p.icon, { style: { fontSize: "2xl", color: "foreground" } })], { label: L("أيقونة", "Icon tile"), style: { ...NO_PAD } }),
                        t.stack(
                          [
                            t.text(p.title, { style: { fontWeight: "semibold", fontSize: "md", lineHeight: "snug" }, mobile: { fontSize: "sm" } }),
                            t.text(p.text, { style: { color: "muted", fontSize: "sm", lineHeight: "snug" }, mobile: { fontSize: "xs" } }),
                          ],
                          { label: L("النص", "Copy"), style: { gap: 2 } },
                        ),
                      ],
                      {
                        label: L("المحتوى", "Content"),
                        style: { gap: 14, wrap: false, alignItems: "center" },
                        mobile: { direction: "column", alignItems: "start", gap: 8 },
                      },
                    ),
                  ],
                  {
                    label: L("ميزة", "Feature"),
                    style: { ...NO_PAD, background: "transparent", borderWidth: 0, shadow: "none", radius: 0 },
                  },
                ),
              ),
              {
                label: L("المميزات", "Features"),
                role: "items",
                columns: { desktop: 4, tablet: 2, mobile: 2 },
                style: { gap: 32, paddingTop: 28, paddingBottom: 28 },
                mobile: { gap: 20, paddingTop: 20, paddingBottom: 20 },
              },
            ),
            t.divider({ label: L("خط", "Rule") }),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
