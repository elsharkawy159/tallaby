/**
 * Captioned collections (Claude Design premium set, `categoryCaption`): the
 * store's categories as rounded portrait photos, with the name at the start
 * and the product count at the end on one line underneath. Clean enough for
 * electronics, beauty and sports stores. A start-aligned heading with a
 * "View all" link; a swipe row on phones, five across on desktop. The photo
 * is a clipped link, so it zooms a little on hover.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK } from "./_shared";

export const categoriesCaptioned = defineDesign({
  id: "categories-captioned",
  version: 1,
  category: "categories",
  subcategory: "grid",
  name: L("أقسام بعناوين", "Captioned collections"),
  description: L(
    "صور أقسام بحواف مدوّرة، وتحت كل صورة اسم القسم وعدد منتجاته في سطر واحد.",
    "Rounded category photos with the name and product count on one line underneath.",
  ),
  keywords: ["categories", "collections", "caption", "count", "rail", "premium", "أقسام", "مجموعات", "عدد المنتجات"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.stack(
            [
              sectionHead(t, {
                title: L("اكتشف الأقسام", "Explore collections"),
                link: { href: CATEGORY_LINK, text: L("كل الأقسام", "All categories") },
              }),
              t.categoryList(
                [
                  t.stack(
                    [
                      t.link(
                        CATEGORY_LINK,
                        [
                          t.image("", L("صورة القسم", "Category photo"), {
                            bind: "image",
                            role: "image",
                            style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", background: "secondary" },
                          }),
                        ],
                        {
                          label: L("الصورة", "Photo"),
                          bind: "href",
                          style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 16, overflow: "hidden", background: "secondary" },
                          mobile: { radius: 12 },
                        },
                      ),
                      t.link(
                        CATEGORY_LINK,
                        [
                          t.row(
                            [
                              t.text(L("اسم القسم", "Category"), {
                                bind: "name",
                                style: { fontWeight: "semibold", fontSize: "md" },
                                mobile: { fontSize: "sm" },
                              }),
                              t.row(
                                [
                                  t.text(L("١٢", "12"), { bind: "productCount", style: { color: "muted", fontSize: "xs" } }),
                                  t.text(L("منتج", "items"), { style: { color: "muted", fontSize: "xs" } }),
                                ],
                                { label: L("العدد", "Count"), style: { gap: 4, wrap: false } },
                              ),
                            ],
                            { label: L("التعليق", "Caption"), style: { justifyContent: "between", alignItems: "center", gap: 8, wrap: false } },
                          ),
                        ],
                        {
                          label: L("الاسم", "Name"),
                          bind: "href",
                          style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground", hover: { color: "primary" } },
                        },
                      ),
                    ],
                    { label: L("قسم", "Category"), style: { gap: 12 }, mobile: { gap: 10 } },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 5,
                  mobileRail: true,
                  columns: { desktop: 5, tablet: 3, mobile: 2 },
                  style: { gap: 24 },
                  tablet: { gap: 20 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 8 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
