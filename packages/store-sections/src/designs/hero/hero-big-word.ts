/**
 * Big word (Modular set): one huge faint word behind a product photo, and
 * under a hairline the product's name, price and cart button on one line.
 * The product is one of the store's own (featured by default).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { PRODUCT_NAME, SHOP_LINK, priceRow, productName } from "../products/_shared";

export const heroBigWord = defineDesign({
  id: "hero-big-word",
  version: 1,
  category: "hero",
  subcategory: "product",
  name: L("كلمة كبيرة", "Big word"),
  description: L(
    "كلمة ضخمة خلف صورة منتج واحد، وتحتها الاسم والسعر وزر الشراء.",
    "A giant word behind one product photo, with its name, price and buy button below.",
  ),
  keywords: ["hero", "product", "launch", "poster", "playful", "واجهة", "منتج", "إطلاق"],
  tree: (t) =>
    t.section(
      {
        label: L("الواجهة", "Hero"),
        style: { background: "secondary", paddingTop: 40, overflow: "hidden" },
      },
      [
        t.container(
          [
            t.productList(
              [
                t.stack(
                  [
                    t.stack(
                      [
                        t.text(L("جديد", "NEW"), {
                          label: L("الكلمة", "Word"),
                          role: "word",
                          style: {
                            position: "absolute",
                            insetTop: "8%",
                            insetStart: "0px",
                            insetEnd: "0px",
                            textAlign: "center",
                            fontSize: "display-lg",
                            fontWeight: "extrabold",
                            letterSpacing: "tight",
                            color: "primary",
                            opacity: 12,
                            textTransform: "uppercase",
                          },
                        }),
                        t.stack(
                          [
                            t.link(
                              SHOP_LINK,
                              [
                                t.image("", PRODUCT_NAME, {
                                  bind: "image",
                                  style: {
                                    aspectRatio: "square",
                                    objectFit: "contain",
                                    width: "100%",
                                  },
                                }),
                              ],
                              {
                                label: L("صورة المنتج", "Product photo"),
                                bind: "href",
                                style: FLUSH,
                              },
                            ),
                          ],
                          {
                            label: L("إطار الصورة", "Photo frame"),
                            style: {
                              position: "relative",
                              zIndex: 1,
                              width: "420px",
                              maxWidth: "80%",
                            },
                          },
                        ),
                      ],
                      {
                        label: L("المسرح", "Stage"),
                        style: {
                          position: "relative",
                          minHeight: 320,
                          alignItems: "center",
                          paddingBottom: 24,
                        },
                      },
                    ),
                    t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
                    t.row(
                      [
                        t.stack(
                          [
                            productName(t, {
                              fontSize: "2xl",
                              fontWeight: "bold",
                            }),
                          ],
                          { label: L("الاسم", "Name"), style: { gap: 6 } },
                        ),
                        priceRow(t, { gap: 10 }),
                        t.addToCart({ label: L("اطلبها", "Order now") }),
                      ],
                      {
                        label: L("الشراء", "Buy row"),
                        style: {
                          justifyContent: "between",
                          alignItems: "center",
                          gap: 24,
                          paddingTop: 24,
                        },
                        mobile: {
                          direction: "column",
                          alignItems: "stretch",
                          gap: 14,
                        },
                      },
                    ),
                  ],
                  { label: L("المنتج", "Product"), style: { gap: 0 } },
                ),
              ],
              {
                label: L("المنتج المميز", "Featured product"),
                role: "product",
                source: "featured",
                limit: 1,
                columns: { desktop: 1 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
