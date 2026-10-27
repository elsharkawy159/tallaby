import Image from "next/image";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = {
  visa: { label: "Visa", src: "/icons/payments/visa.svg" },
  mastercard: { label: "Mastercard", src: "/icons/payments/mastercard.svg" },
  amex: { label: "American Express", src: "/icons/payments/american-express.svg" },
  meeza: { label: "Meeza", src: "/icons/payments/meeza.svg" },
  "apple-pay": { label: "Apple Pay", src: "/icons/payments/apple-pay.svg" },
  "google-pay": { label: "Google Pay", src: "/icons/payments/google-pay.svg" },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

const DEFAULT_METHODS: PaymentMethod[] = ["visa", "mastercard", "amex", "apple-pay", "google-pay"];

/** Card-shaped payment logos (120×80 artwork). `iconClassName` sets their size; the default is 36px tall. */
export function PaymentMethodIcons({
  methods = DEFAULT_METHODS,
  className,
  iconClassName = "h-9",
}: {
  methods?: PaymentMethod[];
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {methods.map((key) => {
        const payment = PAYMENT_METHODS[key];
        return (
          <span key={key} title={payment.label}>
            <Image src={payment.src} alt={payment.label} title={payment.label} width={54} height={36} className={cn("w-auto rounded-md", iconClassName)} />
          </span>
        );
      })}
    </div>
  );
}
