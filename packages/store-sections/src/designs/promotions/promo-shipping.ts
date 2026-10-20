/**
 * Shipping goal (Modular set): a slim shelf strip with a truck, the free
 * delivery threshold and a link to small add-ons. Sits above product grids to
 * lift order value. The amount is typed by the seller (there is no live cart
 * total in a section), so the strip states the goal instead of a progress bar.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { iconDisc } from "../_modular";

export const promoShipping = defineDesign({
  id: "promo-shipping",
  version: 1,
  category: "promotions",
  subcategory: "full-width",
  name: L("هدف الشحن", "Shipping goal"),
  description: L("شريط رفيع يقول للعميل امتى التوصيل يبقى ببلاش.", "A slim strip telling shoppers when delivery becomes free."),
  keywords: ["promotions", "free shipping", "delivery", "strip", "شحن مجاني", "توصيل", "شريط"],
  tree: (t) =>
    t.section(
      {
        label: L("هدف الشحن", "Shipping goal"),
        style: { paddingTop: 20, paddingBottom: 20 },
      },
      [
        t.container(
          [
            t.row(
              [
                t.row(
                  [
                    iconDisc(t, "truck"),
                    t.paragraph(L("اطلب بـ ١٥٠٠ ج.م أو أكتر والتوصيل عليك ببلاش", "Order EGP 1,500 or more and delivery is on us"), {
                      role: "title",
                      style: { color: "foreground", fontWeight: "medium" },
                    }),
                  ],
                  {
                    label: L("الرسالة", "Message"),
                    style: { gap: 14, wrap: false },
                  },
                ),
                arrowLink(t, L("منتجات تكمل بيها", "Small add-ons"), "/products"),
              ],
              {
                label: L("الشريط", "Strip"),
                style: {
                  background: "secondary",
                  radius: 999,
                  justifyContent: "between",
                  gap: 20,
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingStart: 14,
                  paddingEnd: 24,
                },
                mobile: {
                  radius: 24,
                  direction: "column",
                  alignItems: "start",
                  gap: 12,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingStart: 16,
                  paddingEnd: 16,
                },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
