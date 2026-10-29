/**
 * Circles with counts (2026-10-29, after the WoodMart "Accessories" demo):
 * six category photos in soft grey circles, no ring, with the name and the
 * number of products under each. Phones show two rows of three.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { CATEGORY_LINK } from "./_shared";

export const categoriesCounts = defineDesign({
  id: "categories-counts",
  version: 1,
  category: "categories",
  subcategory: "circles",
  name: L("دوائر بعدد المنتجات", "Circles with counts"),
  description: L("صور الأقسام في دوائر رمادي فاتح، وتحت كل واحدة اسمها وعدد منتجاتها.", "Category photos in light grey circles, each with its name and product count."),
  keywords: ["categories", "circles", "count", "round", "أقسام", "دوائر", "عدد"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), style: { paddingTop: 48, paddingBottom: 48 } }, [
      t.container(
        [
          t.categoryList(
            [
              t.link(
                CATEGORY_LINK,
                [
                  t.stack(
                    [
                      t.image("", L("صورة القسم", "Category photo"), {
                        bind: "image",
                        role: "image",
                        style: { aspectRatio: "square", objectFit: "cover", width: "100%", maxWidth: "140px", radius: 999, background: "secondary" },
                        mobile: { maxWidth: "96px" },
                      }),
                      t.stack(
                        [
                          t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontWeight: "semibold", textAlign: "center" }, mobile: { fontSize: "sm" } }),
                          t.row(
                            [
                              t.text(L("١٢", "12"), { bind: "productCount", style: { color: "muted", fontSize: "sm" } }),
                              t.text(L("منتج", "products"), { style: { color: "muted", fontSize: "sm" } }),
                            ],
                            { label: L("العدد", "Count"), style: { gap: 4, justifyContent: "center", wrap: false } },
                          ),
                        ],
                        { label: L("النص", "Copy"), style: { gap: 2, alignItems: "center" } },
                      ),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "center" }, mobile: { gap: 8 } },
                  ),
                ],
                { label: L("قسم", "Category"), bind: "href", style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 85 } } },
              ),
            ],
            {
              label: L("الأقسام", "Categories"),
              role: "items",
              limit: 6,
              columns: { desktop: 6, tablet: 3, mobile: 3 },
              style: { gap: 24 },
              mobile: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
