/**
 * Flash sticker (Modular set): one discounted product of the store on a shelf
 * panel, with a round sun sticker showing its discount over the photo's corner
 * and the name, prices and cart button on the start side. The sticker reads
 * the product's own discount. On mobile the photo comes first.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { TILE_MOBILE, dotLabel } from "../_modular";
import { PRODUCT_NAME, SHOP_LINK, priceRow, productName } from "../products/_shared";

export const promoSticker = defineDesign({
  id: "promo-sticker",
  version: 1,
  category: "promotions",
  subcategory: "countdown",
  name: L("ستيكر خصم", "Flash sticker"),
  description: L("منتج واحد عليه خصم، بستيكر دائري بنسبة الخصم.", "One discounted product with a round sticker showing its discount."),
  keywords: ["promotions", "deal", "flash", "sticker", "discount", "عرض اليوم", "خصم", "ستيكر"],
  tree: (t) =>
    t.section({ label: L("عرض اليوم", "Deal of the day") }, [
      t.container(
        [
          t.productList(
            [
              t.grid(
                [
                  t.stack(
                    [
                      dotLabel(t, L("عرض اليوم بس", "Today only")),
                      productName(t, {
                        fontSize: "display-sm",
                        fontWeight: "bold",
                        letterSpacing: "tight",
                      }),
                      priceRow(t, { gap: 12 }),
                      t.addToCart({ label: L("الحق العرض", "Grab the deal") }),
                    ],
                    {
                      label: L("النص", "Copy"),
                      style: { gap: 14, alignItems: "start" },
                    },
                  ),
                  t.stack(
                    [
                      t.link(
                        SHOP_LINK,
                        [
                          t.image("", PRODUCT_NAME, {
                            bind: "image",
                            style: {
                              aspectRatio: "square",
                              objectFit: "cover",
                              width: "100%",
                              radius: 20,
                            },
                          }),
                        ],
                        {
                          label: L("صورة المنتج", "Product photo"),
                          bind: "href",
                          style: {
                            paddingTop: 0,
                            paddingBottom: 0,
                            paddingStart: 0,
                            paddingEnd: 0,
                          },
                        },
                      ),
                      t.stack(
                        [
                          t.text(L("-٢٠٪", "-20%"), {
                            bind: "discount",
                            style: {
                              fontSize: "3xl",
                              fontWeight: "bold",
                              textAlign: "center",
                              color: "foreground",
                            },
                            mobile: { fontSize: "2xl" },
                          }),
                          t.text(L("خصم", "off"), {
                            style: {
                              fontWeight: "semibold",
                              textAlign: "center",
                              color: "foreground",
                            },
                          }),
                        ],
                        {
                          label: L("الستيكر", "Sticker"),
                          style: {
                            position: "absolute",
                            insetTop: "-16px",
                            insetEnd: "-16px",
                            background: "accent",
                            radius: 999,
                            width: "120px",
                            minHeight: 120,
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 0,
                            shadow: "md",
                          },
                          mobile: {
                            width: "92px",
                            minHeight: 92,
                            insetTop: "-8px",
                            insetEnd: "-8px",
                          },
                        },
                      ),
                    ],
                    {
                      label: L("الصورة", "Photo"),
                      style: {
                        position: "relative",
                        width: "100%",
                        maxWidth: "360px",
                      },
                      mobile: { order: -1, maxWidth: "260px" },
                    },
                  ),
                ],
                {
                  label: L("اللوحة", "Panel"),
                  columns: { desktop: 2, mobile: 1 },
                  style: {
                    background: "secondary",
                    radius: 24,
                    gap: 40,
                    alignItems: "center",
                    paddingTop: 48,
                    paddingBottom: 48,
                    paddingStart: 56,
                    paddingEnd: 56,
                  },
                  mobile: { ...TILE_MOBILE, gap: 20 },
                },
              ),
            ],
            {
              label: L("المنتج", "Product"),
              role: "product",
              source: "discounted",
              limit: 1,
              columns: { desktop: 1 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
