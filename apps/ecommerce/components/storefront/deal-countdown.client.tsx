"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { countdownParts } from "@workspace/lib/orders/coupon-popup";
import { pad2 } from "./store-offer.lib";

/**
 * The store product page's deal block: "Offer ends in" over four tiles
 * (days : hours : minutes : seconds) on a dark shade of the store's brand.
 * Only for a real deadline (the product's discount end, or the visitor's
 * coupon pop-up time); it hides itself once the deadline passes.
 *
 * Time is read after mount, so the server and the first client render match:
 * with `placeholder` the block keeps its place with "--" until then (a
 * deadline known on the server), without it nothing is drawn until mounted.
 */
export function DealCountdown({
  deadline,
  placeholder = false,
  className,
}: {
  /** Epoch milliseconds. */
  deadline: number;
  placeholder?: boolean;
  className?: string;
}) {
  const t = useTranslations("storeProduct");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (now == null && !placeholder) return null;
  if (now != null && now >= deadline) return null;

  const parts = now == null ? null : countdownParts(deadline - now);
  const units = [
    { key: "days", value: parts?.days },
    { key: "hours", value: parts?.hours },
    { key: "minutes", value: parts?.minutes },
    { key: "seconds", value: parts?.seconds },
  ] as const;

  return (
    // `className` goes on a wrapper, so a host's text colour never reaches the white-on-dark block.
    <div className={className}>
    <div className="grid gap-3.5 rounded-[var(--sf-radius,12px)] bg-[color-mix(in_srgb,var(--sf-brand,var(--primary))_58%,#000)] px-4 py-4 text-white sm:px-5 sm:py-[18px]">
      <p className="flex items-center gap-2 text-sm font-bold">
        <Timer className="size-[18px] shrink-0 text-(--sf-sun)" aria-hidden />
        {t("offerEndsIn")}
      </p>
      {/* One reading for screen readers, not a new one every second. */}
      {parts && <p className="sr-only">{t("endsInLabel", { days: parts.days, hours: parts.hours, minutes: parts.minutes })}</p>}
      <div aria-hidden className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1.5 sm:gap-2">
        {units.map((unit, index) => (
          <span key={unit.key} className="contents">
            {index > 0 && <span className="pt-2 text-2xl font-extrabold leading-none text-(--sf-sun) sm:pt-2.5 sm:text-[26px]">:</span>}
            <span className="grid gap-1.5 text-center">
              <span className="rounded-xl bg-white/[0.08] py-3 text-[clamp(24px,7vw,34px)] font-extrabold leading-none tabular-nums">
                {unit.value == null ? "--" : pad2(unit.value)}
              </span>
              <span className="text-xs opacity-75">{t(`units.${unit.key}`)}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
    </div>
  );
}
