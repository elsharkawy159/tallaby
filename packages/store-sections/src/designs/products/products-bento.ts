/**
 * Product bento (Modular set): the first product in a large shelf tile with a
 * big photo, name, price and cart button, and the next four in smaller tiles
 * beside it. On mobile the large tile comes first, then a 2×2 grid.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { TILE, TILE_MOBILE, modHead } from "../_modular";
import { SHOP_LINK, priceRow, productName, productPhoto } from "./_shared";

export const productsBento = defineDesign({
  id: "products-bento",
  version: 1,
  category: "products",
  subcategory: "best-sellers",
  name: L("بينتو منتجات", "Product bento"),
  description: L("منتج كبير في المقدمة وأربعة أصغر بجانبه في مربعات.", "One large lead product with four smaller ones beside it, in tiles."),
  keywords: ["products", "bento", "best sellers", "tiles", "منتجات", "بينتو", "الأكثر طلبا"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          modHead(t, {
            label: L("الأكثر طلبًا", "Most wanted"),
            title: L("الكل بيسأل عليهم", "Everyone is asking for these"),
            link: { text: L("عرض الكل", "View all"), href: SHOP_LINK },
          }),
          t.grid(
            [
              t.productList(
                [
                  t.stack(
                    [
                      productPhoto(t, { ratio: "square", radius: 18 }),
                      productName(t, { fontSize: "2xl", fontWeight: "bold" }),
                      t.row([priceRow(t, { gap: 10 }), t.addToCart({ label: L("أضف للسلة", "Add to cart") })], {
                        label: L("الشراء", "Buy row"),
                        style: {
                          justifyContent: "between",
                          alignItems: "center",
                          gap: 12,
                        },
                      }),
                    ],
                    {
                      label: L("المنتج الكبير", "Lead product"),
                      style: { ...TILE, gap: 14 },
                      mobile: TILE_MOBILE,
                    },
                  ),
                ],
                {
                  label: L("المنتج الأول", "Lead product"),
                  role: "lead",
                  source: "best-sellers",
                  limit: 1,
                  columns: { desktop: 1 },
                  style: { colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
              t.productList(
                [
                  t.stack(
                    [
                      productPhoto(t, {
                        ratio: "landscape",
                        radius: 12,
                        chip: false,
                      }),
                      productName(t, { fontSize: "sm" }),
                      priceRow(t),
                    ],
                    {
                      label: L("منتج", "Product"),
                      style: {
                        ...TILE,
                        gap: 8,
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingStart: 16,
                        paddingEnd: 16,
                      },
                      mobile: {
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingStart: 12,
                        paddingEnd: 12,
                      },
                    },
                  ),
                ],
                {
                  label: L("باقي المنتجات", "More products"),
                  role: "items",
                  source: "best-sellers",
                  limit: 4,
                  offset: 1,
                  optional: true,
                  columns: { desktop: 2, mobile: 2 },
                  style: { gap: 12, colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              columns: { desktop: 4, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
