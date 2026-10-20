/**
 * Classic features (library F-a, Classic template): four bordered cards in a
 * row, each with a tinted icon tile beside a bold title and a muted line.
 */
import { defineDesign } from "../builder";
import { L, iconTile } from "../_kit";
import { PROMISES } from "./_shared";

export const featuresClassic = defineDesign({
  id: "features-classic",
  version: 1,
  category: "features",
  subcategory: "benefits-bar",
  name: L("مميزات كلاسيك", "Classic features"),
  description: L("أربع بطاقات بأيقونة وعنوان وسطر لوعود الخدمة.", "Four cards with an icon, a title and a line for your service promises."),
  keywords: ["features", "benefits", "trust", "classic", "مميزات", "خدمة", "كلاسيك"],
  tree: (t) =>
    t.section(
      {
        label: L("المميزات", "Features"),
        style: { paddingTop: 32, paddingBottom: 32 },
      },
      [
        t.container(
          [
            t.grid(
              PROMISES.map((p) =>
                t.card(
                  [
                    t.row(
                      [
                        iconTile(t, p.icon),
                        t.stack(
                          [
                            t.text(p.title, {
                              style: { fontWeight: "bold", fontSize: "md" },
                            }),
                            t.text(p.text, { style: { color: "muted" } }),
                          ],
                          {
                            label: L("النص", "Copy"),
                            style: { gap: 2 },
                          },
                        ),
                      ],
                      {
                        label: L("المحتوى", "Content"),
                        style: { gap: 14, wrap: false },
                        mobile: {
                          direction: "column",
                          alignItems: "start",
                          gap: 10,
                        },
                      },
                    ),
                  ],
                  {
                    label: L("ميزة", "Feature"),
                    style: {
                      paddingTop: 18,
                      paddingBottom: 18,
                      paddingStart: 18,
                      paddingEnd: 18,
                    },
                  },
                ),
              ),
              {
                label: L("المميزات", "Features"),
                role: "items",
                columns: { desktop: 4, tablet: 2, mobile: 2 },
                style: { gap: 16 },
                mobile: { gap: 10 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
