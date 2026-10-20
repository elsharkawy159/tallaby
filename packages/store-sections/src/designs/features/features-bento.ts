/**
 * Feature bento (Modular set): a large brand tile with the headline and a
 * button, and three shelf tiles each with an icon, a title and a line. For
 * landing pages where the promise is the selling point. On mobile the brand
 * tile comes first.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { BRAND_TILE, TILE, TILE_MOBILE, dotLabel, iconDisc, pillButton } from "../_modular";
import { PROMISES } from "./_shared";

export const featuresBento = defineDesign({
  id: "features-bento",
  version: 1,
  category: "features",
  subcategory: "icon-grid",
  name: L("بينتو مميزات", "Feature bento"),
  description: L("مربع كبير بلون المتجر فيه الوعد، وثلاث مربعات بالمميزات.", "A large brand tile with your promise and three feature tiles."),
  keywords: ["features", "bento", "tiles", "promise", "مميزات", "بينتو", "وعد"],
  tree: (t) =>
    t.section({ label: L("المميزات", "Features") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("وعدنا ليك", "Our promise"), { onBrand: true }),
                  t.heading(L("نشتري لك كأننا بنشتري لنفسنا", "We buy for you like we buy for ourselves"), "h2", {
                    role: "title",
                    style: {
                      fontSize: "display-sm",
                      letterSpacing: "tight",
                      ...ON_BRAND,
                    },
                  }),
                  t.spacer(8),
                  pillButton(t, L("اعرف أكتر", "Learn more"), "/about", {
                    tone: "on-brand",
                  }),
                ],
                {
                  label: L("الوعد", "Promise"),
                  style: {
                    ...BRAND_TILE,
                    colSpan: 2,
                    gap: 14,
                    alignItems: "start",
                    justifyContent: "end",
                    minHeight: 300,
                    paddingTop: 40,
                    paddingBottom: 40,
                    paddingStart: 40,
                    paddingEnd: 40,
                  },
                  mobile: { ...TILE_MOBILE, colSpan: 1, minHeight: 0 },
                },
              ),
              ...PROMISES.slice(0, 3).map((p, i) =>
                t.stack(
                  [
                    iconDisc(t, p.icon, { color: "primary" }),
                    t.heading(p.title, "h3", { style: { fontSize: "lg" } }),
                    t.paragraph(p.text, { style: { fontSize: "sm" } }),
                  ],
                  {
                    label: L("ميزة", "Feature"),
                    style: { ...TILE, gap: 10, ...(i === 2 && { colSpan: 2 }) },
                    mobile: { ...TILE_MOBILE, colSpan: 1 },
                  },
                ),
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
