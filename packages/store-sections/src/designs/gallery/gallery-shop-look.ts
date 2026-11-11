/**
 * Shop the look with dots (look-first pilot L5, 2026-11-11; docs/systems/plan.md
 * §10.1): one large photo with three dots on it, beside a heading, a line and
 * one button. Each dot is a `hotspot` element tied to a store product: hover,
 * focus or tap opens a small card with the product's photo, name and price, a
 * link to it and the add-to-cart button.
 *
 * Until the seller picks a product for a dot it shows the store's first,
 * second and third newest products, so the section works on a new store; the
 * seller then moves each dot onto its product in the photo (position fields)
 * and picks the product. A dot with no product is not drawn, and with no
 * products at all the section is hidden. On phones the photo comes first.
 *
 * v2 (pilot L7, 2026-11-11): the pieces are also listed beside the photo as
 * three small ruled rows (photo, name, price), so the look can be shopped
 * without finding the dots. The rows are a product list of the store's three
 * newest products, the same ones the dots show until the seller picks; a
 * seller who picks other products for the dots sets the list's source to
 * match. Calm heading, a quiet eyebrow and a 16px corner. Same field names
 * as v1 for everything v1 had.
 *
 * `about-shop-look` and `gallery-shoppable` are the earlier designs with
 * static numbered pins beside a product list.
 */
import { defineDesign } from "../builder";
import { EYEBROW } from "../_editorial";
import { L } from "../_kit";
import { HEAD_TITLE, PRODUCTS_SECTION, PRODUCT_NAME, SHOP_LINK, premiumPrice } from "../products/_shared";

/** Percent from the photo's left and top. */
const DOTS = [
  { x: 34, y: 30 },
  { x: 64, y: 54 },
  { x: 28, y: 74 },
] as const;

const NO_PAD = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } as const;

export const galleryShopLook = defineDesign({
  id: "gallery-shop-look",
  version: 2,
  category: "gallery",
  subcategory: "lookbook",
  name: L("تسوّق اللوك بالنقط", "Shop the look with dots"),
  description: L(
    "صورة كبيرة عليها نقط، كل نقطة تفتح منتج من المتجر بصورته وسعره وزر السلة، وجنبها نفس القطع في صفوف صغيرة.",
    "A large photo with dots; each dot opens a store product with its photo, price and cart button, with the same pieces listed beside it.",
  ),
  keywords: ["gallery", "shop the look", "lookbook", "shoppable", "hotspots", "dots", "معرض", "تسوق اللوك", "نقط", "صورة"],
  tree: (t) =>
    t.section({ label: L("تسوّق اللوك بالنقط", "Shop the look with dots"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.photo(0, L("صورة اللوك", "Look photo"), {
                    role: "image",
                    style: { objectFit: "cover", width: "100%", aspectRatio: "portrait", radius: 0 },
                    mobile: { aspectRatio: "square" },
                  }),
                  ...DOTS.map((at, i) => t.hotspot(at, { kind: "product", productIndex: i + 1 }, { label: L("نقطة منتج", "Product dot") })),
                ],
                { label: L("الصورة", "Photo"), style: { position: "relative", overflow: "hidden", radius: 16, background: "secondary" }, mobile: { radius: 12 } },
              ),
              t.stack(
                [
                  t.text(L("تسوّق اللوك", "Shop the look"), { role: "eyebrow", style: EYEBROW }),
                  t.heading(L("كل اللي في الصورة", "Everything in the photo"), "h2", { role: "title", ...HEAD_TITLE, motion: { reveal: "words" } }),
                  t.paragraph(L("دوس على أي نقطة في الصورة وشوف القطعة وسعرها، وضيفها للسلة على طول.", "Tap any dot on the photo to see the piece and its price, and add it straight to your cart."), {
                    role: "subtitle",
                    style: { fontSize: "md", lineHeight: "relaxed", maxWidth: "440px" },
                    mobile: { fontSize: "sm" },
                  }),
                  t.productList(
                    [
                      t.stack(
                        [
                          t.row(
                            [
                              t.link(SHOP_LINK, [t.image("", PRODUCT_NAME, { label: L("صورة القطعة", "Piece photo"), bind: "image", style: { aspectRatio: "square", objectFit: "cover", width: "100%" } })], {
                                label: L("صورة المنتج", "Product photo"),
                                bind: "href",
                                style: { ...NO_PAD, width: "64px", radius: 8, overflow: "hidden", background: "secondary" },
                              }),
                              t.stack(
                                [
                                  t.link(SHOP_LINK, [t.text(PRODUCT_NAME, { bind: "title", style: { fontSize: "sm", fontWeight: "medium", lineHeight: "snug", lineClamp: 2 } })], {
                                    label: L("اسم المنتج", "Product name"),
                                    bind: "href",
                                    style: { ...NO_PAD, color: "foreground" },
                                  }),
                                  premiumPrice(t),
                                ],
                                { label: L("المعلومات", "Details"), style: { gap: 4 } },
                              ),
                            ],
                            { label: L("محتوى القطعة", "Piece content"), style: { gap: 14, wrap: false, alignItems: "center", paddingTop: 14, paddingBottom: 14 } },
                          ),
                          t.divider({ label: L("خط", "Rule") }),
                        ],
                        { label: L("قطعة", "Piece"), style: { gap: 0 } },
                      ),
                    ],
                    {
                      label: L("قطع اللوك", "Pieces in the look"),
                      role: "pieces",
                      source: "newest",
                      limit: 3,
                      optional: true,
                      columns: { desktop: 1, tablet: 1, mobile: 1 },
                      style: { gap: 0, width: "100%", maxWidth: "440px", marginTop: 8 },
                    },
                  ),
                  t.button(L("تسوّق الكل", "Shop all"), "/products", "solid", { role: "cta", style: { marginTop: 12 } }),
                ],
                { label: L("النص", "Copy"), role: "intro", style: { gap: 12, alignItems: "start", justifyContent: "center" }, motion: { reveal: "none" } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              tablet: { gap: 32 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
