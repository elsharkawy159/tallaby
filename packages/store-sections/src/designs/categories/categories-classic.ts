/**
 * Classic categories (library C, Classic template): a heading with "view all",
 * then a row of bordered circles holding each category photo with the name
 * underneath; the ring turns brand on hover.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

export const categoriesClassic = defineDesign({
  id: "categories-classic",
  version: 1,
  category: "categories",
  subcategory: "circles",
  name: L("أقسام كلاسيك", "Classic categories"),
  description: L("صف من الدوائر بصور الأقسام وأسمائها.", "A row of circles with each category's photo and name."),
  keywords: ["categories", "circles", "classic", "أقسام", "دوائر", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          sectionHead(t, { title: L("تسوّق حسب القسم", "Shop by category"), link: { href: CATEGORY_LINK } }),
          t.grid(
            CATEGORY_NAMES.slice(0, 6).map((name, i) =>
              t.link(
                CATEGORY_LINK,
                [
                  t.photo(i + 2, name, {
                    style: { aspectRatio: "square", objectFit: "cover", radius: 999, borderWidth: 4, borderColor: "background", shadow: "sm" },
                  }),
                  t.text(name, { style: { fontWeight: "semibold", textAlign: "center", marginTop: 12 } }),
                ],
                {
                  label: L("قسم", "Category"),
                  style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 999, hover: { opacity: 90 } },
                },
              ),
            ),
            { label: L("الأقسام", "Categories"), role: "items", columns: { desktop: 6, tablet: 4, mobile: 3 }, style: { gap: 24 }, mobile: { gap: 14 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
