"use client";

import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice, formatPricePlain } from "@workspace/lib";

import { DiscountPercentBadge } from "@/components/product";
import type { ProductLocale } from "@/lib/product-translations";
import { DiscountCountdown } from "./discount-countdown";

interface PriceTicketProps {
  price: number;
  listPrice: number | null;
  discountPercent: number | null;
  discountExpiryDate: Date | null;
  hasFreeDelivery: boolean;
  locale: ProductLocale;
}

/**
 * The price as a tear-off coupon: the amount on top, and, when there's an
 * offer or free delivery, a stub below a dashed tear line with notched edges.
 */
export function PriceTicket({
  price,
  listPrice,
  discountPercent,
  discountExpiryDate,
  hasFreeDelivery,
  locale,
}: PriceTicketProps) {
  const t = useTranslations("product");
  const hasDiscount = listPrice != null && listPrice > price;
  const hasStub = (hasDiscount && discountExpiryDate != null) || hasFreeDelivery;

  return (
    <div className="relative rounded-2xl bg-[#fff4de]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-4 md:px-5">
        <span
          className="text-3xl font-bold leading-none text-primary lg:text-4xl"
          dangerouslySetInnerHTML={{ __html: formatPrice(price, locale, "lg") }}
        />
        {hasDiscount && (
          <span
            className="text-base font-medium text-gray-500 line-through decoration-red-400/80"
            aria-label={t("insteadOf")}
            dangerouslySetInnerHTML={{
              __html: formatPrice(listPrice, locale, "sm"),
            }}
          />
        )}
        {discountPercent != null && (
          <DiscountPercentBadge
            percent={discountPercent}
            className="shrink-0 px-2 py-1 text-xs md:text-sm"
          />
        )}
        {hasDiscount && (
          <p className="basis-full pt-1.5 text-sm font-semibold text-[#9a5800]">
            {t("youSave", {
              amount: formatPricePlain(listPrice - price, locale),
            })}
          </p>
        )}
      </div>

      {hasStub && (
        <div className="relative space-y-2.5 border-t-2 border-dashed border-[#f3cf8c] px-4 py-3.5 md:px-5">
          {/* Notches where the ticket would tear. */}
          <span
            aria-hidden
            className="absolute -start-2.5 -top-2.5 h-5 w-5 rounded-full bg-white"
          />
          <span
            aria-hidden
            className="absolute -end-2.5 -top-2.5 h-5 w-5 rounded-full bg-white"
          />

          {hasDiscount && discountExpiryDate && (
            <DiscountCountdown endDate={discountExpiryDate} />
          )}
          {hasFreeDelivery && (
            <p className="flex items-start gap-2 text-sm">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-semibold text-primary">
                  {t("freeDeliveryOnProduct")}
                </span>{" "}
                <span className="text-gray-600">
                  {t("freeDeliveryOnProductDescription")}
                </span>
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
