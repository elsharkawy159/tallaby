/**
 * Feature and four (library P-c): one featured product large on the start
 * side, and a 2×2 grid of newer products beside it. Without a featured
 * product the grid shows alone.
 *
 * v2 (look-first pilot, 2026-11-11): the featured product is one big photo
 * with a small eyebrow, a large name, the price and the cart button under it
 * (no tinted panel), beside four premium cards (`_shared.ts`); the heading
 * rises word by word (motion v2) and every photo sits on the site's product
 * stage when it has one.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { PRODUCTS_SECTION, PRODUCT_NAME, SHOP_LINK, premiumCard, premiumPrice, productsHead } from "./_shared";

const NO_PAD = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } as const;

export const productsFeature = defineDesign({
  id: "products-feature",
  version: 2,
  category: "products",
  subcategory: "featured",
  name: L("منتج مميز وأربعة", "Feature and four"),
  description: L("منتج مميز كبير وبجانبه أربعة منتجات.", "One featured product large, with four more beside it."),
  keywords: ["products", "featured", "spotlight", "منتج مميز", "منتجات"],
  tree: (t) =>
    t.section({ label: L("منتج مميز", "Featured product"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          productsHead(t, { title: L("اختيارنا ليك", "Picked for you") }),
          t.grid(
            [
              t.productList(
                [
                  t.stack(
                    [
                      t.box(
                        [
                          t.link(
                            SHOP_LINK,
                            [t.image("", PRODUCT_NAME, { label: L("صورة البطاقة", "Card photo"), bind: "image", style: { aspectRatio: "square", objectFit: "cover", width: "100%" } })],
                            { label: L("صورة المنتج", "Product photo"), bind: "href", style: { ...NO_PAD, radius: 12, overflow: "hidden", background: "secondary" } },
                          ),
                        ],
                        { label: L("الصورة", "Photo"), style: { position: "relative", ...NO_PAD, background: "transparent" } },
                      ),
                      t.text(L("اختيار الأسبوع", "Pick of the week"), {
                        role: "eyebrow",
                        style: { color: "muted", fontSize: "xs", fontWeight: "semibold", letterSpacing: "wider", textTransform: "uppercase", marginTop: 6 },
                      }),
                      t.link(
                        SHOP_LINK,
                        [t.text(PRODUCT_NAME, { bind: "title", style: { fontSize: "2xl", fontWeight: "medium", lineHeight: "snug", lineClamp: 2, fontFamily: "heading" }, mobile: { fontSize: "xl" } })],
                        { label: L("اسم المنتج", "Product name"), bind: "href", style: { ...NO_PAD, color: "foreground" } },
                      ),
                      premiumPrice(t, { large: true }),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    { label: L("المنتج المميز", "Featured product"), style: { gap: 10 } },
                  ),
                ],
                { label: L("المنتج المميز", "Featured product"), source: "featured", limit: 1, optional: true, columns: { desktop: 1 } },
              ),
              t.productList([premiumCard(t, { ratio: "square" })], {
                label: L("منتجات أخرى", "More products"),
                role: "items",
                source: "newest",
                limit: 4,
                columns: { desktop: 2, mobile: 2 },
                style: { gap: 28 },
                tablet: { gap: 20 },
                mobile: { gap: 12 },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 40, alignItems: "start" }, tablet: { gap: 28 }, mobile: { gap: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
