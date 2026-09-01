import Image from "next/image";
import { cn } from "@/lib/utils";

const PAYMENT_METHOD_ITEMS = [
  { label: "Visa", src: "/icons/payments/visa.svg" },
  { label: "Mastercard", src: "/icons/payments/mastercard.svg" },
  { label: "American Express", src: "/icons/payments/american-express.svg" },
  { label: "Apple Pay", src: "/icons/payments/apple-pay.svg" },
  { label: "Google Pay", src: "/icons/payments/google-pay.svg" },
] as const;

export function PaymentMethodIcons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {PAYMENT_METHOD_ITEMS.map((payment) => (
        <span key={payment.label} title={payment.label}>
          <Image
            src={payment.src}
            alt={payment.label}
            width={54}
            height={36}
            className="h-9 w-auto rounded-md"
          />
        </span>
      ))}
    </div>
  );
}
