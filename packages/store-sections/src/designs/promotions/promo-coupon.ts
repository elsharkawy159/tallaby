/**
 * Coupon ticket (library M-d): a wide paper ticket with the big percentage on
 * the start stub, a dashed divider, and the offer, conditions and code on the
 * main part. On mobile the stub moves on top.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const promoCoupon = defineDesign({
  id: "promo-coupon",
  version: 1,
  category: "promotions",
  subcategory: "coupon",
  name: L("تذكرة كوبون", "Coupon ticket"),
  description: L("تذكرة بنسبة الخصم والشروط وكود الكوبون.", "A ticket with the discount, the conditions and the coupon code."),
  keywords: ["coupon", "code", "discount", "welcome", "كوبون", "كود", "خصم"],
  tree: (t) =>
    t.section({ label: L("الكوبون", "Coupon") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("٢٠٪", "20%"), "h3", {
                    role: "value",
                    style: { fontSize: "6xl", fontWeight: "extrabold", lineHeight: "tight", color: "primaryInk" },
                  }),
                  t.text(L("خصم", "off"), { style: { color: "primaryInk", fontWeight: "semibold", fontSize: "lg" } }),
                ],
                {
                  label: L("الكعب", "Stub"),
                  style: { background: "primary", alignItems: "center", justifyContent: "center", gap: 0, paddingTop: 32, paddingBottom: 32, radius: 24 },
                },
              ),
              t.stack(
                [
                  t.heading(L("خصم على أول طلب لك", "Off your very first order"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("للطلبات فوق ٨٠٠ ج.م · حتى ٣٠ نوفمبر", "Orders over EGP 800 · until 30 November"), { role: "body" }),
                  t.row(
                    [
                      t.icon("copy", { style: { fontSize: "md", color: "primary" } }),
                      t.text(L("الكود: WELCOME20", "Code: WELCOME20"), { role: "coupon", style: { fontWeight: "bold", letterSpacing: "wide" } }),
                    ],
                    {
                      label: L("الكود", "Code"),
                      style: {
                        gap: 8,
                        borderWidth: 2,
                        borderColor: "primary",
                        radius: 14,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingStart: 18,
                        paddingEnd: 18,
                        wrap: false,
                      },
                    },
                  ),
                ],
                {
                  label: L("التذكرة", "Ticket"),
                  style: { gap: 12, alignItems: "start", justifyContent: "center", colSpan: 2, paddingStart: 32 },
                  mobile: { colSpan: 1, paddingStart: 0 },
                },
              ),
            ],
            {
              label: L("الكوبون", "Coupon"),
              columns: { desktop: 3, mobile: 1 },
              style: {
                gap: 0,
                background: "background",
                borderWidth: 2,
                borderColor: "border",
                radius: 28,
                paddingTop: 12,
                paddingBottom: 12,
                paddingStart: 12,
                paddingEnd: 32,
                shadow: "md",
                maxWidth: "960px",
              },
              mobile: { gap: 20, paddingEnd: 12, paddingBottom: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
