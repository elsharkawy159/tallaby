/**
 * Ruled row (Modular set): the service promises in one hairline-ruled row of
 * four cells, each opening with a large two-digit number, then a short title
 * and one muted line. No icons. 2×2 on mobile.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";
import { BIG_NUMBER, RULED, RULED_CELL } from "../_modular";
import { PROMISES } from "./_shared";

export const featuresRuled = defineDesign({
  id: "features-ruled",
  version: 1,
  category: "features",
  subcategory: "steps",
  name: L("صف مقسم", "Ruled row"),
  description: L("وعود الخدمة في خانات بخطوط رفيعة بأرقام كبيرة بدل الأيقونات.", "Your service promises in hairline cells with big numbers instead of icons."),
  keywords: ["features", "ruled", "numbers", "minimal", "trust", "مميزات", "أرقام"],
  tree: (t) =>
    t.section(
      {
        label: L("المميزات", "Features"),
        style: { paddingTop: 40, paddingBottom: 40 },
      },
      [
        t.container(
          [
            t.grid(
              PROMISES.map((p, i) =>
                t.stack(
                  [
                    t.text(N(`0${i + 1}`), {
                      style: {
                        ...BIG_NUMBER,
                        fontSize: "4xl",
                        color: "primary",
                      },
                    }),
                    t.heading(p.title, "h3", { style: { fontSize: "lg" } }),
                    t.paragraph(p.text, { style: { fontSize: "sm" } }),
                  ],
                  {
                    label: L("ميزة", "Feature"),
                    style: {
                      ...RULED_CELL,
                      gap: 10,
                      paddingTop: 28,
                      paddingBottom: 28,
                      paddingStart: 28,
                      paddingEnd: 28,
                    },
                    mobile: {
                      paddingTop: 20,
                      paddingBottom: 20,
                      paddingStart: 18,
                      paddingEnd: 18,
                    },
                  },
                ),
              ),
              {
                label: L("المميزات", "Features"),
                role: "items",
                columns: { desktop: 4, mobile: 2 },
                style: RULED,
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
