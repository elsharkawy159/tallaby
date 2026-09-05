export type ManualPaymentMethod = "instapay" | "vodafone_cash" | "e_cash";

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

export const DEFAULT_MANUAL_PAYMENT_METHOD: ManualPaymentMethod = "instapay";

export function isManualPaymentMethod(
  value: string
): value is ManualPaymentMethod {
  return MANUAL_PAYMENT_METHODS.some((m) => m.value === value);
}

export function getManualPaymentMethodConfig(
  value: string
): ManualPaymentMethodConfig | undefined {
  return MANUAL_PAYMENT_METHODS.find((m) => m.value === value);
}
