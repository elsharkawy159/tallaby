/**
 * Showcase tiles (docs/section-rules.md §4; 2026-10-27): tall category photos
 * with the name on a dark fade at their foot. Each tile is one clipped link,
 * so its photo zooms a little on hover (Theme › Hover effect).
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const categoriesShowcase = defineDesign({
  id: "categories-showcase",
  version: 1,
  category: "categories",
  subcategory: "grid",
  name: L("بطاقات طويلة", "Showcase tiles"),
  description: L("صور طويلة للأقسام، واسم كل قسم على تظليل في أسفلها.", "Tall category photos with each name on a dark fade at the bottom."),
  keywords: ["categories", "tiles", "premium", "collections", "أقسام", "مجموعات"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          sectionHead(t, {
            title: L("تسوّق حسب القسم", "Shop by category"),
            link: { href: CATEGORY_LINK, text: L("كل الأقسام", "All categories") },
          }),
          t.grid(
            CATEGORY_NAMES.slice(0, 4).map((name, i) =>
              t.link(
                CATEGORY_LINK,
                [
                  t.photo(i, name, { style: { aspectRatio: "portrait", objectFit: "cover", width: "100%" } }),
                  t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
                  t.row(
                    [t.text(name, { style: { fontWeight: "bold", fontSize: "lg", color: "white" } }), t.icon("arrow", { style: { color: "white", fontSize: "lg" } })],
                    {
                      label: L("الاسم", "Name"),
                      style: { position: "absolute", insetBottom: "20px", insetStart: "20px", insetEnd: "20px", justifyContent: "between", alignItems: "center", wrap: false },
                      mobile: { insetBottom: "14px", insetStart: "14px", insetEnd: "14px" },
                    },
                  ),
                ],
                {
                  label: L("قسم", "Category"),
                  style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 20, overflow: "hidden", background: "secondary" },
                  mobile: { radius: 14 },
                },
              ),
            ),
            { label: L("الأقسام", "Categories"), role: "items", columns: { desktop: 4, tablet: 2, mobile: 2 }, style: { gap: 20 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
