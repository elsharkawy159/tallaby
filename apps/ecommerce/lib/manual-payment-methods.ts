import type { SellerPaymentDetails } from "@workspace/lib/payments/store-methods";
import { TALLABY_TOP_UP_ACCOUNTS } from "@workspace/lib/store-wallet";

/** The (masked) name on Tallaby's own receiving accounts. */
const TALLABY_ACCOUNT_HOLDER = TALLABY_TOP_UP_ACCOUNTS.vodafone_cash.holder;

export type ManualPaymentMethod = "instapay" | "vodafone_cash" | "e_cash" | "we_pay" | "orange_cash";

export interface ManualPaymentMethodConfig {
  value: ManualPaymentMethod;
  titleKey: string;
  descriptionKey: string;
  /** public/ path to the brand logo shown on checkout. */
  logo: string;
  /** public/ path to the QR image. InstaPay only today. */
  qrImage?: string;
  /** Account handle / wallet number to display. */
  accountLabel?: string;
  /** Direct payment link. InstaPay only today. */
  paymentLink?: string;
  /** True until real account details are supplied. */
  isPlaceholder?: boolean;
}

/**
 * Store websites only: paid to the seller's own wallet. Tallaby has no account
 * for these, so the marketplace and customer-wallet top-ups never list them.
 * Brand-initial badges until official logo files are added (owner action).
 */
export const STOREFRONT_ONLY_PAYMENT_METHODS: ManualPaymentMethodConfig[] = [
  {
    value: "we_pay",
    titleKey: "wePay",
    descriptionKey: "wePayDescription",
    logo: "/payment-method/we-pay-badge.svg",
  },
  {
    value: "orange_cash",
    titleKey: "orangeCash",
    descriptionKey: "orangeCashDescription",
    logo: "/payment-method/orange-cash-badge.svg",
  },
];

export const MANUAL_PAYMENT_METHODS: ManualPaymentMethodConfig[] = [
  {
    value: "instapay",
    titleKey: "instapay",
    descriptionKey: "instapayDescription",
    logo: "/payment-method/Instapay_logo.png",
    qrImage: "/payment-method/instapay-qr-code.jpeg",
    accountLabel: "elsharkawy159@instapay",
    paymentLink: "https://ipn.eg/S/elsharkawy159/instapay/7w6JSs",
  },
  {
    value: "vodafone_cash",
    titleKey: "vodafoneCash",
    descriptionKey: "vodafoneCashDescription",
    logo: "/payment-method/Vodafone_logo.png",
    accountLabel: "01003272830",
  },
  {
    value: "e_cash",
    titleKey: "eCash",
    descriptionKey: "eCashDescription",
    logo: "/payment-method/Eand_logo.png",
    isPlaceholder: true,
  },
];

export const DEFAULT_MANUAL_PAYMENT_METHOD = "instapay" satisfies ManualPaymentMethod;

/** Every manual transfer a checkout can show: Tallaby's, then the storefront-only ones. */
export const ALL_MANUAL_PAYMENT_METHODS: ManualPaymentMethodConfig[] = [
  ...MANUAL_PAYMENT_METHODS,
  ...STOREFRONT_ONLY_PAYMENT_METHODS,
];

export function isManualPaymentMethod(
  value: string
): value is ManualPaymentMethod {
  return ALL_MANUAL_PAYMENT_METHODS.some((m) => m.value === value);
}

export function getManualPaymentMethodConfig(
  value: string
): ManualPaymentMethodConfig | undefined {
  return ALL_MANUAL_PAYMENT_METHODS.find((m) => m.value === value);
}

/** One account identifier the customer sends to, with its label key. */
export type PaymentRecipientId = {
  kind: "ipa" | "instapayPhone" | "iban" | "walletNumber";
  value: string;
};

/**
 * Who the customer pays and how, as the payment page shows it: the store's
 * own details for a storefront order (`orders.metadata.sellerPayment`), else
 * Tallaby's marketplace account.
 */
export type PaymentRecipient = {
  collector: "seller" | "tallaby";
  holderName: string | null;
  ids: PaymentRecipientId[];
  paymentLink?: string;
  qrImage?: string;
  /** No account to show yet (marketplace e& Cash). */
  isPlaceholder?: boolean;
};

export function sellerPaymentRecipient(details: SellerPaymentDetails): PaymentRecipient {
  const ids: PaymentRecipientId[] = [];
  if (details.method === "instapay") {
    if (details.ipa) ids.push({ kind: "ipa", value: details.ipa });
    if (details.phone) ids.push({ kind: "instapayPhone", value: details.phone });
    if (details.iban) ids.push({ kind: "iban", value: details.iban });
  } else if (details.phone) {
    ids.push({ kind: "walletNumber", value: details.phone });
  }
  return {
    collector: "seller",
    holderName: details.holderName || null,
    ids,
    ...(details.paymentLink && { paymentLink: details.paymentLink }),
  };
}

export function marketplacePaymentRecipient(method: ManualPaymentMethod): PaymentRecipient | null {
  const config = getManualPaymentMethodConfig(method);
  if (!config) return null;
  const ids: PaymentRecipientId[] = config.accountLabel
    ? [{ kind: method === "instapay" ? "ipa" : "walletNumber", value: config.accountLabel }]
    : [];
  // No Tallaby account to show (e& Cash today; WE Pay and Orange Cash never on the marketplace).
  const placeholder = config.isPlaceholder || (ids.length === 0 && !config.paymentLink);
  return {
    collector: "tallaby",
    holderName: placeholder ? null : TALLABY_ACCOUNT_HOLDER,
    ids,
    ...(config.paymentLink && { paymentLink: config.paymentLink }),
    ...(config.qrImage && { qrImage: config.qrImage }),
    ...(placeholder && { isPlaceholder: true }),
  };
}
