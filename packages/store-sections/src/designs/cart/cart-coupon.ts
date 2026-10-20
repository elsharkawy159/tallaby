/**
 * Coupon unlocked (library J-j): a ticket with notched sides. The start half
 * shows the discount in very large figures, a divider splits it from the end
 * half with the code and how long it is valid. The seller types the discount,
 * code and expiry (create the code in the dashboard). On mobile the halves
 * stack and the divider turns horizontal.
 */
import type { NodeTemplate } from "../../elements/tree";
import type { TreeBuilder } from "../builder";
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER } from "../_modular";

/** A round cut-out on one side of the ticket, in the page colour. */
const notch = (t: TreeBuilder, side: "insetStart" | "insetEnd"): NodeTemplate =>
  t.box([], {
    label: L("الفتحة", "Notch"),
    style: {
      position: "absolute",
      insetTop: "50%",
      ...(side === "insetStart" ? { insetStart: "-16px" } : { insetEnd: "-16px" }),
      marginTop: -16,
      width: "32px",
      minHeight: 32,
      radius: 999,
      background: "background",
    },
    mobile: { hidden: true },
  });

export const cartCoupon = defineDesign({
  id: "cart-coupon",
  version: 1,
  category: "cart",
  subcategory: "coupon",
  name: L("كوبون اتفتح", "Coupon unlocked"),
  description: L("تذكرة بنسبة الخصم وكود الكوبون ومدة صلاحيته.", "A ticket with the discount, the coupon code and how long it lasts."),
  keywords: ["cart", "coupon", "code", "discount", "welcome offer", "سلة", "كوبون", "كود", "خصم"],
  tree: (t) =>
    t.section({ label: L("الكوبون", "Coupon") }, [
      t.container(
        [
          t.row(
            [
              notch(t, "insetStart"),
              notch(t, "insetEnd"),
              t.stack(
                [
                  t.text(L("١٠٪", "10%"), {
                    role: "value",
                    style: { ...BIG_NUMBER, fontSize: "6xl", color: "primaryInk" },
                    mobile: { fontSize: "5xl" },
                  }),
                  t.text(L("خصم على أول طلب", "off your first order"), {
                    role: "title",
                    style: { color: "primaryInk", fontWeight: "semibold", fontSize: "lg" },
                  }),
                ],
                {
                  label: L("الخصم", "Discount"),
                  style: { gap: 4, justifyContent: "center", width: "45%", paddingTop: 36, paddingBottom: 36, paddingStart: 44, paddingEnd: 32 },
                  mobile: { width: "100%", alignItems: "center", textAlign: "center", paddingTop: 28, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                },
              ),
              t.box([], {
                label: L("الفاصل", "Divider"),
                style: { width: "2px", background: "primaryInk", opacity: 35, marginTop: 20, marginBottom: 20 },
                mobile: { width: "100%", minHeight: 2, marginTop: 0, marginBottom: 0 },
              }),
              t.stack(
                [
                  t.text(L("استخدمه في السلة", "Use it at checkout"), { style: { fontSize: "sm", color: "primaryInk", opacity: 85 } }),
                  t.row(
                    [
                      t.text(L("الكود: WELCOME10", "Code: WELCOME10"), { role: "coupon", style: { fontWeight: "bold", fontSize: "xl", letterSpacing: "wide", color: "foreground" } }),
                      t.icon("copy", { style: { fontSize: "lg", color: "foreground" } }),
                    ],
                    {
                      label: L("الكود", "Code"),
                      style: {
                        gap: 12,
                        wrap: false,
                        alignItems: "center",
                        background: "background",
                        radius: 14,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingStart: 20,
                        paddingEnd: 20,
                      },
                    },
                  ),
                  t.row(
                    [
                      t.icon("clock", { style: { fontSize: "md", color: "primaryInk" } }),
                      t.text(L("صالح ٤٨ ساعة", "Valid for 48 hours"), { style: { fontSize: "sm", color: "primaryInk" } }),
                    ],
                    { label: L("الصلاحية", "Expiry"), style: { gap: 6, wrap: false, alignItems: "center" } },
                  ),
                ],
                {
                  label: L("الكود", "Code"),
                  style: { gap: 12, alignItems: "start", justifyContent: "center", paddingTop: 36, paddingBottom: 36, paddingStart: 32, paddingEnd: 44 },
                  mobile: { alignItems: "center", paddingTop: 24, paddingBottom: 28, paddingStart: 24, paddingEnd: 24 },
                },
              ),
            ],
            {
              label: L("التذكرة", "Ticket"),
              style: {
                position: "relative",
                gap: 0,
                wrap: false,
                alignItems: "stretch",
                background: "primary",
                radius: 28,
                maxWidth: "820px",
              },
              mobile: { direction: "column", radius: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "884px" } },
      ),
    ]),
});
