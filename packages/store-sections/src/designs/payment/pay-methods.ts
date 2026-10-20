/**
 * Ways to pay (U-a): a hairline-ruled row of payment method cells, each with
 * a sun icon square, the method name, a short note and, where it applies,
 * the providers in a small pill. Answers "can I pay cash?" on the home page
 * or above the footer. Mobile shows a 2-up grid.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL, modHead } from "../_modular";
import { namePill } from "./_shared";

const METHODS = [
  { icon: "truck", name: L("كاش عند الاستلام", "Cash on delivery"), note: L("ادفع للمندوب بعد ما تفتح الطلب.", "Pay the courier after you open the order."), providers: null },
  { icon: "credit-card", name: L("كارت بنكي", "Bank card"), note: L("فيزا وماستركارد وميزة.", "Visa, Mastercard and Meeza."), providers: null },
  { icon: "clock", name: L("تقسيط", "Installments"), note: L("لحد ٢٤ شهر من غير مقدم.", "Up to 24 months, no down payment."), providers: L("فاليو · سيمبل · سهولة", "valU · Sympl · souhoola") },
  { icon: "phone", name: L("محافظ إلكترونية", "Wallets"), note: L("حوّل من موبايلك في ثانية.", "Transfer from your phone in seconds."), providers: L("فودافون كاش · إنستاباي", "Vodafone Cash · InstaPay") },
] as const;

export const payMethods = defineDesign({
  id: "pay-methods",
  version: 1,
  category: "payment",
  subcategory: "methods",
  name: L("طرق الدفع", "Ways to pay"),
  description: L("طرق الدفع في خانات: كاش وكارت وتقسيط ومحافظ.", "Payment methods in ruled cells: cash, card, installments and wallets."),
  keywords: ["payment", "pay", "cash on delivery", "card", "wallets", "الدفع", "كاش", "تقسيط"],
  tree: (t) =>
    t.section({ label: L("طرق الدفع", "Ways to pay") }, [
      t.container(
        [
          modHead(t, { label: L("الدفع", "Payment"), title: L("ادفع بالطريقة اللي تريحك", "Pay the way that suits you") }),
          t.grid(
            METHODS.map((m) =>
              t.stack(
                [
                  t.box([t.icon(m.icon, { style: { fontSize: "xl", color: "foreground" } })], {
                    label: L("أيقونة", "Icon"),
                    style: { background: "accent", radius: 12, width: "52px", paddingTop: 13, paddingBottom: 11, textAlign: "center", marginBottom: 20 },
                    mobile: { width: "44px", paddingTop: 9, paddingBottom: 7, marginBottom: 12 },
                  }),
                  t.heading(m.name, "h3", { style: { fontSize: "xl" }, mobile: { fontSize: "md" } }),
                  t.paragraph(m.note, { style: { fontSize: "sm" }, mobile: { fontSize: "xs" } }),
                  ...(m.providers ? [namePill(t, m.providers)] : []),
                ],
                {
                  label: L("طريقة", "Method"),
                  style: { ...RULED_CELL, gap: 10, alignItems: "start", minHeight: 230, paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
                  mobile: { minHeight: 200, paddingTop: 18, paddingBottom: 18, paddingStart: 18, paddingEnd: 18 },
                },
              ),
            ),
            { label: L("الطرق", "Methods"), role: "items", columns: { desktop: 4, mobile: 2 }, style: RULED },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
