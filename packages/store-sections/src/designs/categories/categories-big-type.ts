/**
 * Big type list (Modular set): the store's categories as a stacked list of
 * very large names between hairline rules, each with its product count and a
 * round photo on the end side. On mobile the photo hides.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { CATEGORY_LINK } from "./_shared";

export const categoriesBigType = defineDesign({
  id: "categories-big-type",
  version: 1,
  category: "categories",
  subcategory: "editorial",
  name: L("قائمة بخط كبير", "Big type list"),
  description: L("أسماء أقسامك بخط ضخم في قائمة بخطوط رفيعة وصورة صغيرة.", "Your category names in very large type between hairlines, with a small photo."),
  keywords: ["categories", "typography", "list", "premium", "أقسام", "خط كبير"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.categoryList(
            [
              t.link(
                CATEGORY_LINK,
                [
                  t.row(
                    [
                      t.text(L("اسم القسم", "Category"), {
                        bind: "name",
                        style: {
                          fontSize: "display-md",
                          fontWeight: "bold",
                          letterSpacing: "tight",
                          lineHeight: "tight",
                        },
                      }),
                      t.row(
                        [
                          t.row(
                            [
                              t.text(L("١٢", "12"), {
                                bind: "productCount",
                                style: { color: "muted", fontSize: "sm" },
                              }),
                              t.text(L("منتج", "items"), {
                                style: { color: "muted", fontSize: "sm" },
                              }),
                            ],
                            {
                              label: L("العدد", "Count"),
                              style: { gap: 4, wrap: false },
                            },
                          ),
                          t.image("", L("صورة القسم", "Category photo"), {
                            bind: "image",
                            style: {
                              aspectRatio: "square",
                              objectFit: "cover",
                              radius: 999,
                              width: "88px",
                              background: "secondary",
                            },
                            mobile: { hidden: true },
                          }),
                        ],
                        {
                          label: L("النهاية", "End"),
                          style: { gap: 24, wrap: false },
                        },
                      ),
                    ],
                    {
                      label: L("السطر", "Row"),
                      style: {
                        justifyContent: "between",
                        gap: 24,
                        wrap: false,
                      },
                      mobile: { gap: 12 },
                    },
                  ),
                ],
                {
                  label: L("قسم", "Category"),
                  bind: "href",
                  style: {
                    ...FLUSH,
                    background: "background",
                    paddingTop: 16,
                    paddingBottom: 16,
                    hover: { color: "primary" },
                  },
                },
              ),
            ],
            {
              label: L("الأقسام", "Categories"),
              role: "items",
              limit: 6,
              columns: { desktop: 1 },
              style: {
                gap: 1,
                background: "border",
                paddingTop: 1,
                paddingBottom: 1,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
