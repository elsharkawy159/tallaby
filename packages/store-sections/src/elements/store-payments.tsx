/**
 * The store's payment methods in footers. Templates ship demo chips ("VISA",
 * "Mastercard", "الدفع عند الاستلام"…) in a `role: "payments"` row; on the
 * storefront and in the builder the row shows the methods the store's checkout
 * really offers (dashboard: Store settings › Payment methods; cash on delivery
 * is on by default), each as a small logo card.
 */
import { Banknote, Smartphone } from "lucide-react";
import type { PaymentMethodSummary, RenderContext } from "../core/types";

/**
 * Footer payment keys (`footerPaymentKeys` in @workspace/lib: the checkout
 * methods, with a connected card gateway as its card and wallet logos), their
 * names and logos. Logos sit at the same path in both apps'
 * `public/icons/payments/` (storefront hosts and the dashboard builder canvas):
 * 96px-tall PNGs, and the card brands as 120×80 card artwork (`card: true`).
 */
const PAYMENTS: Record<string, { ar: string; en: string; logo?: string; card?: boolean; icon?: "wallet" }> = {
  cash_on_delivery: { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  visa: { ar: "فيزا", en: "Visa", logo: "/icons/payments/visa.svg", card: true },
  mastercard: { ar: "ماستركارد", en: "Mastercard", logo: "/icons/payments/mastercard.svg", card: true },
  meeza: { ar: "ميزة", en: "Meeza", logo: "/icons/payments/meeza.svg", card: true },
  mobile_wallets: { ar: "المحافظ الإلكترونية", en: "Mobile wallets", icon: "wallet" },
  instapay: { ar: "إنستاباي", en: "InstaPay", logo: "/icons/payments/instapay.png" },
  vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash", logo: "/icons/payments/vodafone-cash.png" },
  e_cash: { ar: "e& كاش", en: "e& Cash", logo: "/icons/payments/e-cash.png" },
};

export type StorePayment = { key: string; label: string; logo?: string; card?: boolean; icon?: "wallet" };

/** The store's payment methods; `undefined` when the host gave none (draw the row as authored). */
export function storePayments(ctx: RenderContext): StorePayment[] | undefined {
  const methods: PaymentMethodSummary[] | undefined = ctx.store.paymentMethods;
  if (!methods) return undefined;
  const locale = ctx.locale === "en" ? "en" : "ar";
  return methods.flatMap((m) => {
    const known = PAYMENTS[m.key];
    const label = known?.[locale] ?? m.label?.trim();
    return label ? [{ key: m.key, label, logo: known?.logo, card: known?.card, icon: known?.icon }] : [];
  });
}

/**
 * One method as a white card: the brand logo, or (cash on delivery and any
 * method without a logo) an icon and the name. White on every footer, light
 * or dark, like card logos on checkout pages.
 */
export function PaymentLogo({ payment }: { payment: StorePayment }) {
  // Card brands are white card artwork already: the image is the whole card.
  if (payment.logo && payment.card) {
    return (
      <span
        title={payment.label}
        data-payment={payment.key}
        className="inline-flex h-8 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-black/10"
      >
        <img src={payment.logo} alt={payment.label} height={32} className="h-8 w-auto" loading="lazy" decoding="async" />
      </span>
    );
  }
  const Icon = payment.icon === "wallet" ? Smartphone : Banknote;
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
          <Icon aria-hidden className="size-4 text-emerald-700" />
          <span>{payment.label}</span>
        </>
      )}
    </span>
  );
}
