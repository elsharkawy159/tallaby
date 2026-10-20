/**
 * Secure pay strip (U-g): a slim strip ruled above and below, with a shield
 * and "100% secure checkout" on the start side and a row of payment name
 * pills on the end side. Right above the footer or under a cart button.
 * Pills wrap to a second line; mobile centres everything.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { namePill } from "./_shared";

const NAMES = [
  L("فيزا", "Visa"),
  L("ماستركارد", "Mastercard"),
  L("ميزة", "Meeza"),
  L("فاليو", "valU"),
  L("إنستاباي", "InstaPay"),
  L("فودافون كاش", "Vodafone Cash"),
  L("كاش", "Cash"),
];

export const paySecure = defineDesign({
  id: "pay-secure",
  version: 1,
  category: "payment",
  subcategory: "methods",
  name: L("شريط الدفع الآمن", "Secure pay strip"),
  description: L("شريط رفيع بالدفع الآمن وأسماء طرق الدفع.", "A slim strip with secure checkout and the payment names."),
  keywords: ["payment", "secure", "trust", "visa", "strip", "دفع آمن", "فيزا", "ثقة"],
  tree: (t) =>
    t.section({ label: L("الدفع الآمن", "Secure checkout"), style: { paddingTop: 20, paddingBottom: 20 }, mobile: { paddingTop: 20, paddingBottom: 20 } }, [
      t.container(
        [
          t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
          t.row(
            [
              t.row(
                [
                  t.icon("shield", { style: { fontSize: "lg", color: "primary" } }),
                  t.text(L("دفع آمن ١٠٠٪", "100% secure checkout"), { style: { fontWeight: "semibold" } }),
                ],
                { label: L("الأمان", "Secure"), style: { gap: 10, wrap: false, alignItems: "center" } },
              ),
              t.row(
                NAMES.map((n) => namePill(t, n)),
                { label: L("طرق الدفع", "Payment names"), role: "items", style: { gap: 8 }, mobile: { justifyContent: "center" } },
              ),
            ],
            {
              label: L("الشريط", "Strip"),
              style: { justifyContent: "between", alignItems: "center", gap: 16, paddingTop: 16, paddingBottom: 16 },
              mobile: { justifyContent: "center", gap: 12 },
            },
          ),
          t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
