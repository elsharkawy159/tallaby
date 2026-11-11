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
 * `about-shop-look` and `gallery-shoppable` are the earlier designs with
 * static numbered pins beside a product list.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

/** Percent from the photo's left and top. */
const DOTS = [
  { x: 34, y: 30 },
  { x: 64, y: 54 },
  { x: 28, y: 74 },
] as const;

export const galleryShopLook = defineDesign({
  id: "gallery-shop-look",
  version: 1,
  category: "gallery",
  subcategory: "lookbook",
  name: L("تسوّق اللوك بالنقط", "Shop the look with dots"),
  description: L(
    "صورة كبيرة عليها نقط، كل نقطة تفتح منتج من المتجر بصورته وسعره وزر السلة.",
    "A large photo with dots; each dot opens a store product with its photo, price and cart button.",
  ),
  keywords: ["gallery", "shop the look", "lookbook", "shoppable", "hotspots", "dots", "معرض", "تسوق اللوك", "نقط", "صورة"],
  tree: (t) =>
    t.section({ label: L("تسوّق اللوك بالنقط", "Shop the look with dots") }, [
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
                { label: L("الصورة", "Photo"), style: { position: "relative", overflow: "hidden", radius: 24, background: "secondary" }, mobile: { radius: 16 } },
              ),
              t.stack(
                [
                  t.text(L("تسوّق اللوك", "Shop the look"), {
                    role: "eyebrow",
                    style: { fontSize: "sm", fontWeight: "semibold", color: "primary" },
                  }),
                  t.heading(L("كل اللي في الصورة", "Everything in the photo"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", lineHeight: "tight" },
                  }),
                  t.paragraph(L("دوس على أي نقطة في الصورة وشوف القطعة وسعرها، وضيفها للسلة على طول.", "Tap any dot on the photo to see the piece and its price, and add it straight to your cart."), {
                    role: "subtitle",
                    style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "480px" },
                    mobile: { fontSize: "md" },
                  }),
                  t.button(L("تسوّق الكل", "Shop all"), "/products", "solid", { role: "cta" }),
                ],
                { label: L("النص", "Copy"), role: "intro", style: { gap: 16, alignItems: "start", justifyContent: "center" }, mobile: { gap: 14 } },
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
