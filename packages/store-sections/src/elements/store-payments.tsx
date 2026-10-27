/**
 * The store's payment methods in footers. Templates ship demo chips ("VISA",
 * "Mastercard", "الدفع عند الاستلام"…) in a `role: "payments"` row; on the
 * storefront and in the builder the row shows the methods the store's checkout
 * really offers (dashboard: Store settings › Payment methods; cash on delivery
 * is on by default), each as a small logo card.
 */
import { Banknote } from "lucide-react";
import type { PaymentMethodSummary, RenderContext } from "../core/types";

/**
 * Checkout method keys (`storefrontCheckoutMethods` in @workspace/lib), their
 * names and logos. Logos are 96px-tall PNGs at the same path in both apps'
 * `public/icons/payments/` (storefront hosts and the dashboard builder canvas).
 */
const PAYMENTS: Record<string, { ar: string; en: string; logo?: string }> = {
  cash_on_delivery: { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  instapay: { ar: "إنستاباي", en: "InstaPay", logo: "/icons/payments/instapay.png" },
  vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash", logo: "/icons/payments/vodafone-cash.png" },
  e_cash: { ar: "e& كاش", en: "e& Cash", logo: "/icons/payments/e-cash.png" },
};

export type StorePayment = { key: string; label: string; logo?: string };

/** The store's payment methods; `undefined` when the host gave none (draw the row as authored). */
export function storePayments(ctx: RenderContext): StorePayment[] | undefined {
  const methods: PaymentMethodSummary[] | undefined = ctx.store.paymentMethods;
  if (!methods) return undefined;
  const locale = ctx.locale === "en" ? "en" : "ar";
  return methods.flatMap((m) => {
    const known = PAYMENTS[m.key];
    const label = known?.[locale] ?? m.label?.trim();
    return label ? [{ key: m.key, label, logo: known?.logo }] : [];
  });
}

/**
 * One method as a white card: the brand logo, or (cash on delivery and any
 * method without a logo) an icon and the name. White on every footer, light
 * or dark, like card logos on checkout pages.
 */
export function PaymentLogo({ payment }: { payment: StorePayment }) {
  return (
    <span
      title={payment.label}
      data-payment={payment.key}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-white px-2 text-[11px] leading-none font-semibold whitespace-nowrap text-neutral-800 ring-1 ring-black/10"
    >
      {payment.logo ? (
        <img src={payment.logo} alt={payment.label} height={22} className="h-[22px] w-auto" loading="lazy" decoding="async" />
      ) : (
        <>
          <Banknote aria-hidden className="size-4 text-emerald-700" />
          <span>{payment.label}</span>
        </>
      )}
    </span>
  );
}
