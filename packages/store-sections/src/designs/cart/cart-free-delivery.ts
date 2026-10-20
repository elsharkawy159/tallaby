/**
 * Free delivery goal (library J-e): a full-width brand band with the
 * free-delivery threshold in very large figures, a thick bar from zero to the
 * goal with a truck on its end, and a "keep shopping" link. A tree cannot read
 * the live cart total, so the band states the goal (typed by the seller)
 * instead of the amount left, and the bar is a scale, not progress.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BIG_NUMBER, FLUSH, arrowText } from "../_modular";

export const cartFreeDelivery = defineDesign({
  id: "cart-free-delivery",
  version: 1,
  category: "cart",
  subcategory: "delivery",
  name: L("هدف التوصيل المجاني", "Free delivery goal"),
  description: L("شريط بلون المتجر يقول من كام التوصيل مجاني.", "A brand band that says from what order total delivery is free."),
  keywords: ["cart", "free delivery", "free shipping", "threshold", "سلة", "توصيل مجاني", "شحن مجاني"],
  tree: (t) =>
    t.section({ label: L("التوصيل المجاني", "Free delivery"), style: { background: "primary", paddingTop: 56, paddingBottom: 56 }, mobile: { paddingTop: 40, paddingBottom: 40 } }, [
      t.container(
        [
          t.row(
            [
              t.text(L("اطلب بـ", "Order"), { style: { fontSize: "lg", ...ON_BRAND } }),
              t.text(L("١٥٠٠ ج.م", "EGP 1,500"), {
                role: "value",
                style: { ...BIG_NUMBER, fontSize: "6xl", color: "accent", lineHeight: "snug" },
                mobile: { fontSize: "5xl" },
              }),
              t.text(L("والتوصيل عليك مجاني", "and delivery is on us"), {
                role: "title",
                style: { fontSize: "2xl", fontWeight: "semibold", fontFamily: "heading", ...ON_BRAND },
                mobile: { fontSize: "lg" },
              }),
            ],
            {
              label: L("الهدف", "Goal"),
              style: { gap: 18, alignItems: "end", marginBottom: 28 },
              mobile: { gap: 8, marginBottom: 20 },
            },
          ),
          t.row(
            [
              t.box([], {
                label: L("الشريط", "Bar"),
                style: { background: "accent", radius: 999, minHeight: 16, width: "100%" },
              }),
              t.box([t.icon("truck", { style: { fontSize: "xl", color: "foreground" } })], {
                label: L("علامة العربية", "Truck marker"),
                style: {
                  background: "background",
                  radius: 999,
                  width: "48px",
                  paddingTop: 11,
                  paddingBottom: 9,
                  textAlign: "center",
                  shadow: "md",
                  marginStart: -24,
                },
                mobile: { width: "40px", paddingTop: 7, paddingBottom: 5, marginStart: -20 },
              }),
            ],
            { label: L("المقياس", "Scale"), style: { gap: 0, wrap: false, alignItems: "center" } },
          ),
          t.row(
            [
              t.text(L("٠ ج.م", "EGP 0"), { style: { fontSize: "sm", ...ON_BRAND_BODY } }),
              t.link("/products", [arrowText(t, L("كمّل تسوق", "Keep shopping"), "primaryInk")], {
                label: L("رابط", "Link"),
                role: "link",
                style: { ...FLUSH, color: "primaryInk", hover: { opacity: 85 } },
              }),
              t.text(L("١٥٠٠ ج.م", "EGP 1,500"), { style: { fontSize: "sm", ...ON_BRAND_BODY } }),
            ],
            {
              label: L("الأطراف", "Ends"),
              style: { justifyContent: "between", alignItems: "center", gap: 12, marginTop: 16, wrap: false },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
