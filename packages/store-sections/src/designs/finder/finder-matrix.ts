/**
 * Spec matrix (Product finder E-e): a framed comparison table. The top row
 * holds up to four products (photo, name, price) from a product list; under
 * it, feature rows with a tick or a dash per product column, typed by the
 * seller in the same order as the products. The design's table scrolls inside
 * itself with a pinned first column; here the columns shrink on small screens
 * instead (no horizontal scroll style exists).
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";
import { productName, productPhoto, SHOP_LINK } from "../products/_shared";

const ROWS = [
  { label: L("لاسلكي", "Wireless"), marks: [1, 1, 1, 1] },
  { label: L("عزل الضوضاء", "Noise cancelling"), marks: [1, 0, 0, 1] },
  { label: L("مقاوم للمية", "Water resistant"), marks: [1, 1, 0, 1] },
  { label: L("شحن سريع", "Fast charging"), marks: [0, 1, 1, 1] },
  { label: L("ضمان سنتين", "2-year warranty"), marks: [1, 1, 1, 0] },
];

const CELL = {
  paddingTop: 14,
  paddingBottom: 14,
  paddingStart: 16,
  paddingEnd: 16,
  background: "background",
} as const;
const CELL_MOBILE = {
  paddingTop: 10,
  paddingBottom: 10,
  paddingStart: 6,
  paddingEnd: 6,
} as const;

function mark(t: TreeBuilder, yes: boolean): NodeTemplate {
  return t.stack(
    [
      yes
        ? t.box(
            [
              t.icon("check", {
                style: { fontSize: "md", color: "primaryInk" },
              }),
            ],
            {
              label: L("أيوه", "Yes"),
              style: {
                background: "primary",
                radius: 999,
                width: "32px",
                paddingTop: 5,
                paddingBottom: 3,
                textAlign: "center",
              },
            },
          )
        : t.text(L("لأ", "No"), { style: { color: "muted", fontSize: "sm" } }),
    ],
    {
      label: L("الخانة", "Cell"),
      style: { ...CELL, alignItems: "center", justifyContent: "center" },
      mobile: CELL_MOBILE,
    },
  );
}

export const finderMatrix = defineDesign({
  id: "finder-matrix",
  version: 1,
  category: "finder",
  subcategory: "compare",
  name: L("جدول المواصفات", "Spec matrix"),
  description: L(
    "جدول مقارنة: المنتجات فوق، والمزايا بعلامة صح أو شرطة لكل منتج.",
    "A comparison table: products across the top, features ticked per product.",
  ),
  keywords: [
    "finder",
    "compare",
    "table",
    "specs",
    "matrix",
    "مقارنة",
    "جدول",
    "مواصفات",
  ],
  tree: (t) =>
    t.section({ label: L("جدول المواصفات", "Spec matrix") }, [
      t.container(
        [
          modHead(t, {
            title: L("قارن الموديلات", "Compare models"),
            link: { text: L("كل المنتجات", "All products"), href: SHOP_LINK },
          }),
          t.stack(
            [
              t.grid(
                [
                  t.box([], {
                    label: L("الخانة الأولى", "Corner cell"),
                    style: { background: "background" },
                  }),
                  t.productList(
                    [
                      t.stack(
                        [
                          t.box(
                            [
                              productPhoto(t, {
                                ratio: "square",
                                radius: 12,
                                chip: false,
                              }),
                            ],
                            {
                              label: L("الإطار", "Frame"),
                              style: { width: "96px" },
                              mobile: { width: "56px" },
                            },
                          ),
                          productName(t, {
                            fontSize: "sm",
                            textAlign: "center",
                          }),
                          t.text(L("٢٥٠ ج.م", "EGP 250"), {
                            bind: "price",
                            style: { fontSize: "sm", color: "muted" },
                          }),
                        ],
                        {
                          label: L("المنتج", "Product"),
                          style: { ...CELL, gap: 6, alignItems: "center" },
                          mobile: CELL_MOBILE,
                        },
                      ),
                    ],
                    {
                      label: L("المنتجات", "Products"),
                      role: "products",
                      source: "best-sellers",
                      limit: 4,
                      columns: { desktop: 4 },
                      style: { gap: 1, colSpan: 4 },
                    },
                  ),
                ],
                {
                  label: L("رأس الجدول", "Table head"),
                  columns: { desktop: 5 },
                  style: { gap: 1 },
                },
              ),
              ...ROWS.map((r) =>
                t.grid(
                  [
                    t.stack(
                      [
                        t.text(r.label, {
                          style: { fontWeight: "semibold", fontSize: "sm" },
                          mobile: { fontSize: "xs" },
                        }),
                      ],
                      {
                        label: L("الميزة", "Feature"),
                        style: { ...CELL, justifyContent: "center" },
                        mobile: CELL_MOBILE,
                      },
                    ),
                    ...r.marks.map((m) => mark(t, m === 1)),
                  ],
                  {
                    label: L("سطر", "Row"),
                    columns: { desktop: 5 },
                    style: { gap: 1 },
                  },
                ),
              ),
            ],
            {
              label: L("الجدول", "Table"),
              role: "items",
              style: {
                gap: 1,
                background: "border",
                borderWidth: 1,
                borderColor: "border",
                radius: 24,
                overflow: "hidden",
              },
              mobile: { radius: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
