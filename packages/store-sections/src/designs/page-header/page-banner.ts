/**
 * Classic category banner (library Cb-b, Classic template category pages): a
 * breadcrumb, then a rounded tinted panel with the category name large and a
 * line on the start side and its photo in a circle on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { crumbs } from "./_crumbs";

export const pageBanner = defineDesign({
  id: "page-banner",
  version: 1,
  category: "page-header",
  subcategory: "category-banner",
  name: L("بانر القسم كلاسيك", "Classic category banner"),
  description: L("لوحة ملونة باسم القسم ووصفه وصورته في دائرة.", "A tinted panel with the category name, a line and its photo in a circle."),
  keywords: ["category banner", "collection", "page header", "بانر", "قسم", "عنوان"],
  tree: (t) =>
    t.section({ label: L("بانر القسم", "Category banner"), style: { paddingTop: 32, paddingBottom: 24 } }, [
      t.container(
        [
          crumbs(t, [{ text: L("المتجر", "Shop") }], L("اسم القسم", "Category")),
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("اسم القسم", "Category name"), "h1", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold" } }),
                  t.paragraph(L("سطر قصير يصف ما يجده العميل في هذا القسم.", "A short line describing what customers find in this category."), {
                    role: "subtitle",
                    style: { fontSize: "lg" },
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 10, colSpan: 2 } },
              ),
              t.photo(2, L("صورة القسم", "Category photo"), {
                role: "image",
                style: { aspectRatio: "square", objectFit: "cover", radius: 999, maxWidth: "200px", borderWidth: 6, borderColor: "background" },
                mobile: { maxWidth: "110px" },
              }),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 3, mobile: 3 },
              style: {
                gap: 24,
                alignItems: "center",
                background: "secondary",
                radius: 28,
                paddingTop: 32,
                paddingBottom: 32,
                paddingStart: 40,
                paddingEnd: 40,
                marginTop: 16,
              },
              mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
