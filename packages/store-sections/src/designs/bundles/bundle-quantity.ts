/**
 * Quantity tiers (O-g): one product's photo on the start side; on the end
 * side its name and price, three tier cards (1, 2, 3 pieces) each with the
 * seller's saving tag, the middle one marked "most picked", and the cart
 * button. Per-unit prices would need maths a tree cannot do, and a card
 * cannot set the cart quantity, so the tiers are a still offer: the shopper
 * changes the quantity in the cart. Mobile puts the photo above.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { productName, productPhoto, priceRow } from "../products/_shared";
import { smallLabel } from "./_shared";

const TIERS = [
  { qty: L("قطعة واحدة", "1 piece"), note: L("السعر العادي", "Regular price"), save: null },
  { qty: L("قطعتين", "2 pieces"), note: L("على القطعة التانية", "On the second piece"), save: L("وفّر ١٠٪", "Save 10%") },
  { qty: L("٣ قطع", "3 pieces"), note: L("على الطلب كله", "On the whole order"), save: L("وفّر ١٨٪", "Save 18%") },
];

export const bundleQuantity = defineDesign({
  id: "bundle-quantity",
  version: 1,
  category: "bundles",
  subcategory: "quantity",
  name: L("اشتري أكتر ووفّر", "Quantity tiers"),
  description: L("منتج واحد بخصم أكبر كل ما تزود القطع.", "One product with a bigger saving the more pieces you buy."),
  keywords: ["bundles", "quantity", "tiers", "buy more save more", "باقة", "كمية", "وفر"],
  tree: (t) =>
    t.section({ label: L("اشتري أكتر ووفّر", "Quantity tiers") }, [
      t.container(
        [
          t.productList(
            [
              t.grid(
                [
                  productPhoto(t, { ratio: "square", radius: 24, chip: false }),
                  t.stack(
                    [
                      smallLabel(t, L("وفّر مع الكمية", "Save with quantity")),
                      productName(t, { fontSize: "3xl", fontWeight: "bold", letterSpacing: "tight" }),
                      priceRow(t),
                      t.stack(
                        TIERS.map((tier, i) => {
                          const on = i === 1;
                          return t.row(
                            [
                              t.box([], {
                                label: L("الدائرة", "Radio"),
                                style: {
                                  width: "22px",
                                  minHeight: 22,
                                  radius: 999,
                                  borderWidth: on ? 7 : 2,
                                  borderColor: on ? "primary" : "border",
                                },
                              }),
                              t.stack(
                                [
                                  t.text(tier.qty, { style: { fontWeight: "semibold", fontSize: "lg" } }),
                                  t.text(tier.note, { style: { color: "muted", fontSize: "sm" } }),
                                ],
                                { label: L("الكمية", "Quantity"), style: { gap: 0 } },
                              ),
                              ...(tier.save ? [t.badge(tier.save, { style: { background: "accent", color: "foreground", fontWeight: "semibold", marginStart: 8 } })] : []),
                              ...(on
                                ? [
                                    t.badge(L("الأكتر طلبًا", "Most picked"), {
                                      style: { position: "absolute", insetTop: "-11px", insetEnd: "20px", background: "primary", color: "primaryInk", fontWeight: "semibold" },
                                    }),
                                  ]
                                : []),
                            ],
                            {
                              label: L("شريحة", "Tier"),
                              style: {
                                position: "relative",
                                alignItems: "center",
                                gap: 16,
                                wrap: false,
                                minHeight: 76,
                                radius: 20,
                                borderWidth: on ? 2 : 1,
                                borderColor: on ? "primary" : "border",
                                background: on ? "secondary" : "background",
                                paddingTop: 12,
                                paddingBottom: 12,
                                paddingStart: 20,
                                paddingEnd: 20,
                              },
                              mobile: { gap: 12, paddingStart: 16, paddingEnd: 16 },
                            },
                          );
                        }),
                        { label: L("الشرائح", "Tiers"), role: "items", style: { gap: 12, marginTop: 8 } },
                      ),
                      t.text(L("اختار عدد القطع من السلة.", "Choose how many pieces in your cart."), {
                        style: { color: "muted", fontSize: "sm" },
                      }),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    { label: L("العرض", "Offer"), style: { gap: 12 } },
                  ),
                ],
                {
                  label: L("التخطيط", "Layout"),
                  columns: { desktop: 2, mobile: 1 },
                  style: { gap: 56, alignItems: "center" },
                  mobile: { gap: 24 },
                },
              ),
            ],
            { label: L("المنتج", "Product"), source: "newest", limit: 1, columns: { desktop: 1 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
