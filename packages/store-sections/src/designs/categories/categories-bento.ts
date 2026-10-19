/**
 * Bento (library C-d): one large star tile with a big name and a button on
 * the start half, and four smaller tiles with name chips packed beside it.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

const PLAIN = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } as const;

export const categoriesBento = defineDesign({
  id: "categories-bento",
  version: 1,
  category: "categories",
  subcategory: "collections",
  name: L("بينتو", "Bento"),
  description: L("قسم نجم في مربع كبير وأربعة أقسام صغيرة بجانبه.", "One star category in a big tile with four smaller ones beside it."),
  keywords: ["categories", "bento", "collections", "مجموعات", "أقسام"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          sectionHead(t, { title: L("أقسامنا", "Our aisles"), link: { href: CATEGORY_LINK } }),
          t.grid(
            [
              t.link(
                CATEGORY_LINK,
                [
                  t.photo(0, CATEGORY_NAMES[1], { style: { aspectRatio: "square", objectFit: "cover", radius: 28 } }),
                  t.stack(
                    [
                      t.badge(L("الأكثر طلبًا", "Most wanted"), { style: { background: "accent" } }),
                      t.heading(CATEGORY_NAMES[1], "h3", { role: "title", style: { fontSize: "display-sm", fontWeight: "extrabold" } }),
                      t.row([t.text(L("تسوّق", "Shop"), { style: { fontWeight: "semibold" } }), t.icon("arrow", { style: { fontSize: "md" } })], {
                        label: L("زر", "Button"),
                        style: {
                          gap: 6,
                          background: "foreground",
                          color: "background",
                          radius: 999,
                          paddingTop: 10,
                          paddingBottom: 10,
                          paddingStart: 18,
                          paddingEnd: 18,
                        },
                      }),
                    ],
                    {
                      label: L("لوحة النص", "Text plate"),
                      style: {
                        position: "absolute",
                        insetBottom: "20px",
                        insetStart: "20px",
                        background: "background",
                        radius: 20,
                        gap: 10,
                        alignItems: "start",
                        paddingTop: 20,
                        paddingBottom: 20,
                        paddingStart: 20,
                        paddingEnd: 20,
                      },
                    },
                  ),
                ],
                { label: L("القسم الكبير", "Big tile"), style: { ...PLAIN, position: "relative" } },
              ),
              t.grid(
                CATEGORY_NAMES.slice(2, 6).map((name, i) =>
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.photo(i + 1, name, { style: { aspectRatio: "square", objectFit: "cover", radius: 20 } }),
                      t.row([t.text(name, { style: { fontWeight: "semibold" } }), t.icon("arrow", { style: { fontSize: "sm", color: "primary" } })], {
                        label: L("الاسم", "Chip"),
                        style: {
                          position: "absolute",
                          insetBottom: "12px",
                          insetStart: "12px",
                          gap: 6,
                          wrap: false,
                          background: "background",
                          radius: 999,
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingStart: 14,
                          paddingEnd: 14,
                        },
                      }),
                    ],
                    { label: L("قسم", "Category"), style: { ...PLAIN, position: "relative", hover: { opacity: 92 } } },
                  ),
                ),
                { label: L("الأقسام الصغيرة", "Small tiles"), role: "items", columns: { desktop: 2, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 12 } },
              ),
            ],
            { label: L("البينتو", "Bento"), columns: { desktop: 2, mobile: 1 }, style: { gap: 16 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
