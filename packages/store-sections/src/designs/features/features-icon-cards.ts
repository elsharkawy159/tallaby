/**
 * Icon cards (library F-c): a centred heading over four cards; each card has
 * an accent circle icon breaking out of its top edge, a title and two lines.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { PROMISES } from "./_shared";

export const featuresIconCards = defineDesign({
  id: "features-icon-cards",
  version: 1,
  category: "features",
  subcategory: "icon-grid",
  name: L("بطاقات بأيقونات", "Icon cards"),
  description: L("عنوان في المنتصف وأربع بطاقات بأيقونة دائرية بارزة.", "A centred heading over four cards with a round icon on top."),
  keywords: ["features", "icons", "why us", "مميزات", "أيقونات", "لماذا نحن"],
  tree: (t) =>
    t.section({ label: L("لماذا نحن", "Why us") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("لماذا تشتري منا", "Why shop with us"),
            title: L("تسوّق وأنت مطمئن", "Shop with peace of mind"),
            align: "center",
          }),
          t.grid(
            PROMISES.map((p) =>
              t.card(
                [
                  t.stack(
                    [
                      t.box(
                        [
                          t.icon(p.icon, {
                            style: { fontSize: "2xl", color: "foreground" },
                          }),
                        ],
                        {
                          label: L("الأيقونة", "Icon"),
                          style: {
                            background: "accent",
                            radius: 999,
                            width: "64px",
                            paddingTop: 18,
                            paddingBottom: 14,
                            textAlign: "center",
                            marginTop: -56,
                            borderWidth: 6,
                            borderColor: "background",
                          },
                        },
                      ),
                      t.heading(p.title, "h3", {
                        style: { fontSize: "lg", textAlign: "center" },
                      }),
                      t.paragraph(p.text, {
                        style: { textAlign: "center", fontSize: "sm" },
                      }),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: { alignItems: "center", gap: 10 },
                    },
                  ),
                ],
                { label: L("بطاقة", "Card"), style: { paddingTop: 32 } },
              ),
            ),
            {
              label: L("البطاقات", "Cards"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 1 },
              style: { gap: 20, marginTop: 56 },
              mobile: { gap: 44, marginTop: 44 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
