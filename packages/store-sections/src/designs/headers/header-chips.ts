/**
 * Chip rail header (Modular set): logo, a wide search pill and the cart on the
 * top row; under it a row of the store's categories as chips, each with a
 * round photo. With no categories the second row draws nothing.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { cartLink, logo } from "./_shared";

export const headerChips = defineDesign({
  id: "header-chips",
  version: 1,
  category: "headers",
  subcategory: "mega-menu",
  name: L("هيدر بأقسام", "Chip rail header"),
  description: L("بحث عريض وتحته أقسام متجرك كشرائح بصور صغيرة.", "A wide search with your store's categories as photo chips underneath."),
  keywords: ["header", "categories", "chips", "search", "هيدر", "أقسام", "بحث"],
  tree: (t) =>
    t.section(
      {
        label: L("الهيدر", "Header"),
        style: { paddingTop: 0, paddingBottom: 0, background: "background" },
        mobile: { paddingTop: 0, paddingBottom: 0 },
      },
      [
        t.container(
          [
            t.row(
              [
                logo(t),
                t.stack(
                  [
                    t.link(
                      "/products",
                      [
                        t.row(
                          [
                            t.icon("search", {
                              style: { fontSize: "lg", color: "muted" },
                            }),
                            t.text(L("ابحث عن منتج…", "Search products…"), {
                              style: { color: "muted" },
                            }),
                          ],
                          {
                            label: L("المحتوى", "Content"),
                            style: { gap: 10, wrap: false },
                          },
                        ),
                      ],
                      {
                        label: L("البحث", "Search"),
                        role: "search",
                        style: {
                          background: "secondary",
                          radius: 999,
                          paddingTop: 12,
                          paddingBottom: 12,
                          paddingStart: 18,
                          paddingEnd: 18,
                          hover: { opacity: 85 },
                        },
                      },
                    ),
                  ],
                  {
                    label: L("خانة البحث", "Search box"),
                    style: { width: "56%" },
                    mobile: { width: "100%", order: 3 },
                  },
                ),
                cartLink(t),
              ],
              {
                label: L("الصف العلوي", "Top row"),
                style: {
                  justifyContent: "between",
                  gap: 24,
                  paddingTop: 16,
                  paddingBottom: 14,
                },
                mobile: { gap: 10 },
              },
            ),
            t.categoryList(
              [
                t.link(
                  "/products",
                  [
                    t.row(
                      [
                        t.image("", L("صورة القسم", "Category photo"), {
                          bind: "image",
                          style: {
                            aspectRatio: "square",
                            objectFit: "cover",
                            radius: 999,
                            width: "30px",
                          },
                        }),
                        t.text(L("اسم القسم", "Category"), {
                          bind: "name",
                          style: { fontWeight: "semibold", fontSize: "sm" },
                        }),
                      ],
                      {
                        label: L("المحتوى", "Content"),
                        style: { gap: 8, wrap: false },
                      },
                    ),
                  ],
                  {
                    label: L("شريحة القسم", "Category chip"),
                    bind: "href",
                    style: {
                      ...FLUSH,
                      paddingTop: 6,
                      paddingBottom: 6,
                      paddingStart: 6,
                      paddingEnd: 16,
                      radius: 999,
                      borderWidth: 1,
                      borderColor: "border",
                      hover: { borderColor: "primary" },
                    },
                  },
                ),
              ],
              {
                label: L("الأقسام", "Categories"),
                role: "items",
                limit: 8,
                optional: true,
                columns: { desktop: 8, tablet: 4, mobile: 2 },
                style: { gap: 8, paddingBottom: 14 },
              },
            ),
          ],
          {
            label: L("الحاوية", "Container"),
            style: { paddingTop: 0, paddingBottom: 0 },
          },
        ),
        t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
      ],
    ),
});
