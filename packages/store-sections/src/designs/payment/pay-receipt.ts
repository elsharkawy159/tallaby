/**
 * Cash receipt (U-j): a headline and two ticked reassurance lines beside a
 * shelf "receipt" card marked as an example: items, delivery and the
 * "pay at the door" total in large type, with dashed-style rules. Makes cash
 * on delivery feel simple. The amounts are a typed example, not a real cart;
 * the design's tilt and torn edge have no style, so the card sits straight.
 * Mobile stacks the receipt under the text.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import type { NodeTemplate } from "../../elements/tree";
import { L } from "../_kit";
import { EGP, payTitle } from "./_shared";

const LINES = [L("المندوب معاه فكة", "The courier carries change"), L("افتح الطلب قبل ما تدفع", "Open the order before you pay")];

function line(t: TreeBuilder, label: DesignText, value: DesignText): NodeTemplate {
  return t.row([t.text(label), t.text(value, { style: { fontWeight: "medium" } })], {
    label: L("سطر", "Line"),
    style: { justifyContent: "between", alignItems: "center", gap: 12, wrap: false, minHeight: 36 },
  });
}

export const payReceipt = defineDesign({
  id: "pay-receipt",
  version: 1,
  category: "payment",
  subcategory: "cash",
  name: L("إيصال الدفع عند الاستلام", "Cash receipt"),
  description: L("مثال إيصال بيوضح إن العميل بيدفع على الباب بس.", "An example receipt showing shoppers pay only at the door."),
  keywords: ["payment", "cash on delivery", "receipt", "trust", "الدفع عند الاستلام", "كاش", "إيصال"],
  tree: (t) =>
    t.section({ label: L("الدفع عند الاستلام", "Cash on delivery") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  payTitle(t, L("مش هتدفع حاجة غير لما يوصلك", "You pay nothing until it arrives")),
                  t.stack(
                    LINES.map((l) =>
                      t.row([t.icon("check", { style: { fontSize: "lg", color: "primary" } }), t.text(l, { style: { fontSize: "lg" }, mobile: { fontSize: "md" } })], {
                        label: L("سطر", "Line"),
                        style: { gap: 10, wrap: false, alignItems: "center" },
                      }),
                    ),
                    { label: L("المميزات", "Reassurance"), role: "items", style: { gap: 10 } },
                  ),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 20 } },
              ),
              t.stack(
                [
                  t.text(L("مثال · #48213", "Example · #48213"), { style: { color: "muted", fontSize: "sm" } }),
                  t.divider({ style: { marginTop: 4, marginBottom: 4 } }),
                  line(t, L("المنتجات", "Items"), EGP("١٬٧٣٠", "1,730")),
                  line(t, L("التوصيل", "Delivery"), EGP("٥٠", "50")),
                  t.divider({ style: { marginTop: 4, marginBottom: 4 } }),
                  t.row(
                    [
                      t.text(L("هتدفع على الباب", "Pay at the door"), { style: { fontWeight: "semibold" } }),
                      t.text(EGP("١٬٧٨٠", "1,780"), { role: "value", style: { fontSize: "3xl", fontWeight: "bold" }, mobile: { fontSize: "2xl" } }),
                    ],
                    { label: L("الإجمالي", "Total"), style: { justifyContent: "between", alignItems: "center", gap: 12 } },
                  ),
                ],
                {
                  label: L("الإيصال", "Receipt"),
                  style: {
                    gap: 4,
                    maxWidth: "380px",
                    background: "secondary",
                    radius: 8,
                    shadow: "lg",
                    paddingTop: 32,
                    paddingBottom: 40,
                    paddingStart: 28,
                    paddingEnd: 28,
                  },
                  mobile: { maxWidth: "100%", paddingTop: 24, paddingBottom: 32, paddingStart: 22, paddingEnd: 22 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              mobile: { gap: 36 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
