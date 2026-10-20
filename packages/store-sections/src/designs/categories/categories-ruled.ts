/**
 * Ruled grid (Modular set): the store's categories in a hairline-ruled grid,
 * four across; each cell has the name and product count on the start side and
 * a small round photo on the end side, so poor photos barely matter.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, RULED, RULED_CELL, modHead } from "../_modular";
import { CATEGORY_LINK } from "./_shared";

export const categoriesRuled = defineDesign({
  id: "categories-ruled",
  version: 1,
  category: "categories",
  subcategory: "grid",
  name: L("شبكة مقسمة", "Ruled grid"),
  description: L(
    "أقسام متجرك في خانات بخطوط رفيعة، بالاسم والعدد وصورة دائرية صغيرة.",
    "Your categories in hairline cells with name, count and a small round photo.",
  ),
  keywords: ["categories", "grid", "ruled", "minimal", "أقسام", "شبكة"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          modHead(t, {
            label: L("الأقسام", "Categories"),
            title: L("تسوق بالقسم", "Shop by category"),
          }),
          t.categoryList(
            [
              t.link(
                CATEGORY_LINK,
                [
                  t.row(
                    [
                      t.stack(
                        [
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: { fontWeight: "semibold", fontSize: "lg" },
                          }),
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
                            { label: L("العدد", "Count"), style: { gap: 4 } },
                          ),
                        ],
                        { label: L("الاسم", "Name"), style: { gap: 4 } },
                      ),
                      t.image("", L("صورة القسم", "Category photo"), {
                        bind: "image",
                        style: {
                          aspectRatio: "square",
                          objectFit: "cover",
                          radius: 999,
                          width: "72px",
                          background: "secondary",
                        },
                        mobile: { width: "56px", order: -1 },
                      }),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: {
                        justifyContent: "between",
                        gap: 14,
                        wrap: false,
                      },
                      mobile: {
                        direction: "column",
                        alignItems: "start",
                        gap: 10,
                      },
                    },
                  ),
                ],
                {
                  label: L("قسم", "Category"),
                  bind: "href",
                  style: {
                    ...FLUSH,
                    ...RULED_CELL,
                    paddingTop: 22,
                    paddingBottom: 22,
                    paddingStart: 22,
                    paddingEnd: 22,
                    minHeight: 116,
                    hover: { background: "secondary" },
                  },
                  mobile: {
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingStart: 16,
                    paddingEnd: 16,
                  },
                },
              ),
            ],
            {
              label: L("الأقسام", "Categories"),
              role: "items",
              limit: 8,
              columns: { desktop: 4, mobile: 2 },
              style: RULED,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
