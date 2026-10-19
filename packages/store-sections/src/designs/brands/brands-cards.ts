/**
 * Brand cards (Modular set): rounded shelf cards, four across; each shows the
 * brand wordmark, a product count and an arrow at the bottom. For stores where
 * shoppers browse by brand. Two across on mobile.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";
import { FLUSH, TILE, modHead } from "../_modular";
import { wordmark } from "./_shared";

const COUNTS = ["42", "18", "27", "9"];

export const brandsCards = defineDesign({
  id: "brands-cards",
  version: 1,
  category: "brands",
  subcategory: "brand-cards",
  name: L("كروت ماركات", "Brand cards"),
  description: L("كارت لكل ماركة فيه الشعار وعدد المنتجات.", "A card per brand with its logo and product count."),
  keywords: ["brands", "cards", "shop by brand", "ماركات", "تسوق بالماركة"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands") }, [
      t.container(
        [
          modHead(t, {
            label: L("الماركات", "Brands"),
            title: L("تسوق بالماركة", "Shop by brand"),
            link: { text: L("كل الماركات", "All brands"), href: "/products" },
          }),
          t.grid(
            COUNTS.map((count, i) =>
              t.link(
                "/products",
                [
                  t.stack(
                    [
                      t.stack([wordmark(t, i)], {
                        label: L("الشعار", "Logo"),
                        style: {
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 120,
                        },
                        mobile: { minHeight: 80 },
                      }),
                      t.row(
                        [
                          t.row(
                            [
                              t.text(N(count), {
                                style: { color: "muted", fontSize: "sm" },
                              }),
                              t.text(L("منتج", "products"), {
                                style: { color: "muted", fontSize: "sm" },
                              }),
                            ],
                            {
                              label: L("العدد", "Count"),
                              style: { gap: 4 },
                            },
                          ),
                          t.icon("arrow", {
                            style: { color: "primary", fontSize: "md" },
                          }),
                        ],
                        {
                          label: L("السطر الأخير", "Footer"),
                          style: { justifyContent: "between", wrap: false },
                        },
                      ),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 16 } },
                  ),
                ],
                {
                  label: L("ماركة", "Brand"),
                  style: {
                    ...FLUSH,
                    ...TILE,
                    paddingTop: 22,
                    paddingBottom: 22,
                    paddingStart: 22,
                    paddingEnd: 22,
                    hover: { shadow: "md" },
                  },
                },
              ),
            ),
            {
              label: L("الماركات", "Brands"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 16 },
              mobile: { gap: 10 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
