"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import type { CouponStatus } from "./coupons.lib";

type Props = {
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  status: CouponStatus;
  /** Background the ticket sits on, so the punched notches read as holes. */
  notchClassName?: string;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * The discount half of a paper coupon: the amount set large, a perforated
 * edge with two punched notches. Its fill carries the coupon's state, so a
 * list of them reads at a glance: solid while running, tinted while
 * scheduled, grey once off or over.
 */
export function CouponTicketStub({
  discountType,
  discountValue,
  status,
  notchClassName = "bg-card",
  size = "sm",
  className,
}: Props) {
  const t = useTranslations("coupons.row");
  const locale = useLocale();

  const figure =
    discountType === "percentage"
      ? `${formatNumber(discountValue, locale, { maximumFractionDigits: 2 })}%`
      : formatMoney(discountValue, locale);

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center rounded-lg text-center",
        size === "lg" ? "w-36 px-3 py-6" : "w-24 px-2 py-3",
        status === "running" && "bg-primary text-primary-foreground",
        status === "scheduled" && "bg-primary/12 text-primary",
        (status === "off" || status === "ended" || status === "usedUp") &&
          "bg-muted text-muted-foreground",
        className
      )}
    >
      <span
        dir="ltr"
        className={cn(
          "font-bold leading-none tabular-nums tracking-tight",
          size === "lg" ? "text-4xl" : "text-xl",
          discountType === "fixed_amount" && (size === "lg" ? "text-2xl" : "text-base")
        )}
      >
        {figure}
      </span>
      <span className={cn("mt-1 opacity-80", size === "lg" ? "text-sm" : "text-xs")}>
        {t("off")}
      </span>

      {/* Perforation along the tear edge, with a punched notch at each end. */}
      <span
        aria-hidden
        className="absolute inset-y-2 -end-px border-e-2 border-dashed border-current opacity-25"
      />
      <span
        aria-hidden
        className={cn("absolute -end-2 -top-2 size-4 rounded-full", notchClassName)}
      />
      <span
        aria-hidden
        className={cn("absolute -end-2 -bottom-2 size-4 rounded-full", notchClassName)}
      />
    </div>
  );
}
