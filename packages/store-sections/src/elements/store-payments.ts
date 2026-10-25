/**
 * The store's payment methods in footers. Templates ship demo chips ("VISA",
 * "Mastercard", "الدفع عند الاستلام"…) in a `role: "payments"` row; on the
 * storefront the row shows the methods the store's checkout really offers
 * (Store settings › Payment methods; cash on delivery is on by default),
 * each drawn like the row's first chip.
 */
import type { PaymentMethodSummary, RenderContext } from "../core/types";

/** Checkout method keys (`storefrontCheckoutMethods` in @workspace/lib) and their names. */
const PAYMENT_LABELS: Record<string, { ar: string; en: string }> = {
  cash_on_delivery: { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  instapay: { ar: "إنستاباي", en: "InstaPay" },
  vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash" },
  e_cash: { ar: "e& كاش", en: "e& Cash" },
};

/** The store's payment methods as chip labels; `undefined` when the host gave none (draw the row as authored). */
export function storePaymentLabels(ctx: RenderContext): string[] | undefined {
  const methods: PaymentMethodSummary[] | undefined = ctx.store.paymentMethods;
  if (!methods) return undefined;
  const locale = ctx.locale === "en" ? "en" : "ar";
  return methods.flatMap((m) => {
    const label = PAYMENT_LABELS[m.key]?.[locale] ?? m.label?.trim();
    return label ? [label] : [];
  });
}
