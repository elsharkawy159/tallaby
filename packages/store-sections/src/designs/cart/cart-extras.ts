/**
 * Order extras (library J-c): a short heading with a muted reason line, then
 * compact product cards in a hairline row: a small photo, the name, the price
 * and the cart button. For small add-ons beside or under the cart. The
 * products come from the store (the seller picks the source); there is no
 * "related to the cart" source, so it starts from the best sellers.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { priceRow, productName, productPhoto } from "../products/_shared";

export const cartExtras = defineDesign({
  id: "cart-extras",
  version: 1,
  category: "cart",
  subcategory: "upsell",
  name: L("كمّل طلبك", "Complete your order"),
  description: L("منتجات صغيرة تتضاف للطلب بضغطة، بصورة واسم وسعر.", "Small products to add to the order in one tap, with photo, name and price."),
  keywords: ["cart", "upsell", "extras", "add-ons", "cross-sell", "سلة", "إضافات", "كمل طلبك"],
  tree: (t) =>
    t.section({ label: L("كمّل طلبك", "Complete your order") }, [
      t.container(
        [
          t.row(
            [
              t.heading(L("ينفع معاها", "Goes well with it"), "h2", {
                role: "title",
                style: { fontSize: "2xl", fontWeight: "bold" },
              }),
              t.text(L("إضافات صغيرة لطلبك", "Small extras for your order"), {
                role: "subtitle",
                style: { color: "muted", fontSize: "sm" },
              }),
            ],
            {
              label: L("العنوان", "Heading"),
              role: "intro",
              style: { gap: 16, alignItems: "end", marginBottom: 16 },
              mobile: { gap: 6 },
            },
          ),
          t.productList(
            [
              t.row(
                [
                  t.stack([productPhoto(t, { radius: 10, chip: false })], {
                    label: L("الصورة", "Photo"),
                    style: { width: "64px" },
                  }),
                  t.stack([productName(t, { fontSize: "sm", fontWeight: "medium" }), priceRow(t, { gap: 6 })], {
                    label: L("المعلومات", "Details"),
                    style: { gap: 4, width: "50%" },
                  }),
                  t.addToCart({ label: L("أضف", "Add") }),
                ],
                {
                  label: L("الإضافة", "Extra"),
                  style: {
                    background: "background",
                    borderWidth: 1,
                    borderColor: "border",
                    radius: 20,
                    gap: 14,
                    wrap: false,
                    alignItems: "center",
                    justifyContent: "between",
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingStart: 10,
                    paddingEnd: 14,
                  },
                  mobile: { gap: 12 },
                },
              ),
            ],
            {
              label: L("الإضافات", "Extras"),
              role: "items",
              source: "best-sellers",
              limit: 6,
              columns: { desktop: 3, tablet: 2, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
