/**
 * Tile grid (library C-a): an even grid of square photo tiles, each with the
 * name, a short line and an arrow underneath.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

export const categoriesTiles = defineDesign({
  id: "categories-tiles",
  version: 1,
  category: "categories",
  subcategory: "grid",
  name: L("شبكة صور", "Tile grid"),
  description: L("شبكة مربعات بصور الأقسام واسم كل قسم وسهم.", "An even grid of square category photos with names and arrows."),
  keywords: ["categories", "grid", "tiles", "أقسام", "شبكة"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          sectionHead(t, {
            title: L("تسوّق حسب القسم", "Shop by category"),
            subtitle: L("اختر القسم الذي يناسبك من كل ما نقدمه.", "Find what suits you across everything we stock."),
            link: { href: CATEGORY_LINK, text: L("كل الأقسام", "All categories") },
          }),
          t.grid(
            CATEGORY_NAMES.slice(0, 4).map((name, i) =>
              t.link(
                CATEGORY_LINK,
                [
                  t.photo(i, name, { style: { aspectRatio: "square", objectFit: "cover", radius: 20 } }),
                  t.row(
                    [t.text(name, { style: { fontWeight: "semibold", fontSize: "md" } }), t.icon("arrow", { style: { color: "primary", fontSize: "lg" } })],
                    { label: L("الاسم", "Name"), style: { justifyContent: "between", marginTop: 12, wrap: false } },
                  ),
                ],
                { label: L("قسم", "Category"), style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 90 } } },
              ),
            ),
            { label: L("الأقسام", "Categories"), role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 20 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
