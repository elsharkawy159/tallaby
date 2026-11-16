import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The ways a seller can pay for a wallet top-up through Kashier (owner,
 * 2026-11-16). Files in public/payment-logos/, kept as each brand ships them:
 * Visa and Mastercard card artwork, Meeza and Vodafone Cash from Kashier's
 * site, the Apple Pay mark from Kashier's site, the Google Pay mark from
 * Google's acceptance-mark kit. `framed` logos have no edge of their own, so
 * they sit on a white card; the Apple Pay and Google Pay marks draw their own.
 */
const LOGOS = [
  { key: "visa", src: "/payment-logos/visa.svg", width: 120, height: 80, framed: true },
  { key: "mastercard", src: "/payment-logos/mastercard.svg", width: 120, height: 80, framed: true },
  { key: "meeza", src: "/payment-logos/meeza.png", width: 138, height: 96, framed: true },
  { key: "vodafone_cash", src: "/payment-logos/vodafone-cash.png", width: 171, height: 96, framed: false },
  { key: "apple_pay", src: "/payment-logos/apple-pay.svg", width: 240, height: 158, framed: false },
  { key: "google_pay", src: "/payment-logos/google-pay.svg", width: 757, height: 404, framed: false },
] as const;

export type PaymentLogoKey = (typeof LOGOS)[number]["key"];

/** A row of payment-method logos, all the same height. Works in server and client components. */
export function PaymentMethodLogos({
  size = "md",
  only,
  className,
}: {
  /** md: 32px tall, sm: 24px tall. */
  size?: "sm" | "md";
  /** A subset, in this order; every logo when left out. */
  only?: readonly PaymentLogoKey[];
  className?: string;
}) {
  const t = useTranslations("paymentLogos");
  const logos = only ? only.map((key) => LOGOS.find((l) => l.key === key)!) : LOGOS;
  return (
    <ul aria-label={t("label")} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {logos.map((logo) => (
        <li
          key={logo.key}
          className={cn(
            "flex shrink-0 overflow-hidden rounded-[6px]",
            size === "md" ? "h-8" : "h-6",
            logo.framed && "bg-white ring-1 ring-black/10 ring-inset",
          )}
        >
          <Image
            src={logo.src}
            alt={t(logo.key)}
            width={logo.width}
            height={logo.height}
            unoptimized
            className="h-full w-auto"
          />
        </li>
      ))}
    </ul>
  );
}
