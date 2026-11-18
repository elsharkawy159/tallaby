import Image from "next/image";
import { useTranslations } from "next-intl";
import { CreditCard, type LucideIcon } from "lucide-react";
import type { AppPaymentMethod } from "@workspace/apps";
import { Note, SellerCard } from "@/components/seller-ui";
import { cn } from "@/lib/utils";

type Logo = { src: string; brand: string; width: number; height: number };
type Art = { logos: readonly Logo[] } | { icon: LucideIcon };

/**
 * Logos for each shopper payment method a gateway offers (owner, 2026-11-18).
 * Files in public/payment-logos/ (sources in SOURCES.md). `brand` is the alt
 * text: a key under `appCenter.paymentBrand`. Width and height are the files'
 * own sizes; every logo renders at the same height.
 */
const ART: Record<AppPaymentMethod, Art> = {
  card: {
    logos: [
      { src: "/payment-logos/visa.svg", brand: "visa", width: 120, height: 80 },
      { src: "/payment-logos/mastercard.svg", brand: "mastercard", width: 120, height: 80 },
    ],
  },
  mobile_wallet: { logos: [{ src: "/payment-logos/mobile-wallets.png", brand: "mobileWallets", width: 312, height: 96 }] },
  cash_fawry_aman: {
    logos: [
      { src: "/payment-logos/fawry.svg", brand: "fawry", width: 497, height: 158 },
      { src: "/payment-logos/aman.svg", brand: "aman", width: 198, height: 79 },
    ],
  },
  meeza: { logos: [{ src: "/payment-logos/meeza.png", brand: "meeza", width: 138, height: 96 }] },
  nbe_installments: { logos: [{ src: "/payment-logos/nbe.svg", brand: "nbe", width: 300, height: 90 }] },
  valu: { logos: [{ src: "/payment-logos/valu.png", brand: "valu", width: 443, height: 96 }] },
  aman_installments: { logos: [{ src: "/payment-logos/aman.svg", brand: "aman", width: 198, height: 79 }] },
  souhoola: { logos: [{ src: "/payment-logos/souhoola.png", brand: "souhoola", width: 536, height: 96 }] },
  contact: { logos: [{ src: "/payment-logos/contact.png", brand: "contact", width: 769, height: 96 }] },
  apple_pay: { logos: [{ src: "/payment-logos/apple-pay.svg", brand: "applePay", width: 240, height: 158 }] },
  tru: { logos: [{ src: "/payment-logos/tru.png", brand: "tru", width: 96, height: 96 }] },
  klivvr: { logos: [{ src: "/payment-logos/klivvr.png", brand: "klivvr", width: 306, height: 96 }] },
  pay_by_card: { icon: CreditCard },
};

/** App detail › "Payment methods your customers can use": one tile per method, logo over its name. */
export function AppPaymentMethods({ methods, vendor }: { methods: readonly AppPaymentMethod[]; vendor: string }) {
  const t = useTranslations("appCenter");
  if (methods.length === 0) return null;
  return (
    <SellerCard className="flex flex-col gap-4 p-6 max-[600px]:p-4" aria-labelledby="app-payment-methods">
      <h2 id="app-payment-methods" className="text-[15.5px] font-bold text-(--s-ink)">
        {t("detail.paymentMethods")}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2.5 max-[380px]:grid-cols-2">
        {methods.map((method) => {
          const art = ART[method];
          return (
            <li key={method} className="flex flex-col gap-2">
              <span className="flex h-16 items-center justify-center gap-2 rounded-[14px] bg-white px-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
                {"icon" in art ? (
                  <art.icon className="size-8 text-(--s-primary)" strokeWidth={1.75} aria-hidden />
                ) : (
                  art.logos.map((logo) => (
                    <Image
                      key={logo.src}
                      src={logo.src}
                      alt={t(`paymentBrand.${logo.brand}`)}
                      width={logo.width}
                      height={logo.height}
                      unoptimized
                      className={cn("w-auto max-w-full min-w-0 object-contain", art.logos.length > 1 ? "h-6" : "h-7")}
                    />
                  ))
                )}
              </span>
              <span className="text-center text-[12.5px] font-semibold leading-[1.5] text-pretty text-(--s-body)">
                {t(`paymentMethod.${method}`)}
              </span>
            </li>
          );
        })}
      </ul>
      <Note>{t("detail.paymentMethodsNote", { vendor })}</Note>
    </SellerCard>
  );
}
