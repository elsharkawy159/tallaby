/**
 * Title and sub-categories (library Cb-d): the breadcrumb and title on one row,
 * then a row of sub-category chips with small round photos.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { crumbs } from "./_crumbs";

const SUBS = [L("وصل حديثًا", "New in"), L("الأكثر مبيعًا", "Best sellers"), L("العروض", "Offers"), L("هدايا", "Gifts"), L("إكسسوارات", "Accessories")];

export const pageSubcategories = defineDesign({
  id: "page-subcategories",
  version: 1,
  category: "page-header",
  subcategory: "subcategories",
  name: L("عنوان وأقسام فرعية", "Title and sub-categories"),
  description: L("عنوان الصفحة وتحته روابط أقسام فرعية بصور صغيرة.", "The page title over sub-category chips with small photos."),
  keywords: ["page header", "subcategories", "chips", "أقسام فرعية", "عنوان"],
  tree: (t) =>
    t.section({ label: L("عنوان وأقسام", "Title and sub-categories"), style: { paddingTop: 32, paddingBottom: 24 } }, [
      t.container(
        [
          crumbs(t, [], L("اسم القسم", "Category")),
          t.heading(L("اسم القسم", "Category name"), "h1", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold", marginTop: 12 } }),
          t.row(
            SUBS.map((name, i) =>
              t.link(
                "/products",
                [
                  t.row(
                    [
                      t.photo(i, name, { style: { aspectRatio: "square", objectFit: "cover", radius: 999, width: "36px" } }),
                      t.text(name, { style: { fontWeight: "semibold" } }),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 10, wrap: false } },
                  ),
                ],
                {
                  label: L("قسم فرعي", "Sub-category"),
                  style: {
                    borderWidth: 1,
                    borderColor: "border",
                    radius: 999,
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingStart: 6,
                    paddingEnd: 16,
                    hover: { borderColor: "primary" },
                  },
                },
              ),
            ),
            { label: L("الأقسام الفرعية", "Sub-categories"), role: "items", style: { gap: 10, marginTop: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
