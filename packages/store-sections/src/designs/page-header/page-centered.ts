/**
 * Centered (Modular set): a centred breadcrumb, title and one-line
 * description, with the store's categories as text tabs underneath and a thin
 * rule. A light header that leaves the products to speak.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { crumbs } from "./_crumbs";

export const pageCentered = defineDesign({
  id: "page-centered",
  version: 1,
  category: "page-header",
  subcategory: "subcategories",
  name: L("في النص", "Centered"),
  description: L("عنوان في المنتصف وتحته أقسام المتجر كتبويبات.", "A centred title with your categories as tabs underneath."),
  keywords: ["page header", "centered", "categories", "tabs", "minimal", "عنوان", "أقسام"],
  tree: (t) =>
    t.section(
      {
        label: L("عنوان الصفحة", "Page header"),
        style: { paddingTop: 40, paddingBottom: 0 },
      },
      [
        t.container(
          [
            t.stack(
              [
                crumbs(t, [], L("المتجر", "Shop")),
                t.heading(L("كل المنتجات", "All products"), "h1", {
                  role: "title",
                  style: {
                    fontSize: "display-md",
                    letterSpacing: "tight",
                    textAlign: "center",
                  },
                }),
                t.paragraph(L("منتجات أصلية بضمان، توصلك لحد البيت.", "Genuine products with warranty, delivered to your door."), {
                  role: "subtitle",
                  style: { textAlign: "center" },
                }),
              ],
              {
                label: L("العنوان", "Heading"),
                style: { gap: 12, alignItems: "center", marginBottom: 24 },
              },
            ),
            t.stack(
              [
                t.categoryList(
                  [
                    t.link(
                      "/products",
                      [
                        t.text(L("اسم القسم", "Category"), {
                          bind: "name",
                          style: { fontWeight: "medium", textAlign: "center" },
                        }),
                      ],
                      {
                        label: L("تبويب", "Tab"),
                        bind: "href",
                        style: {
                          ...FLUSH,
                          paddingTop: 12,
                          paddingBottom: 14,
                          color: "muted",
                          hover: { color: "foreground" },
                        },
                      },
                    ),
                  ],
                  {
                    label: L("الأقسام", "Categories"),
                    role: "items",
                    limit: 6,
                    optional: true,
                    columns: { desktop: 6, mobile: 3 },
                    style: { gap: 8, width: "100%", maxWidth: "820px" },
                  },
                ),
              ],
              {
                label: L("المحاذاة", "Alignment"),
                style: { alignItems: "center" },
              },
            ),
            t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
