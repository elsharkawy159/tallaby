"use client";

import { Separator } from "@workspace/ui/components/separator";
import { formatPrice } from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatVariantTitle } from "@/lib/variant-utils";

interface OrderSummaryProps {
  checkoutData: {
    cart: {
      cartItems: Array<{
        id: string;
        quantity: number;
        price: string | number;
        variant?: any;
        product: {
          id: string;
          title: string;
        };
      }>;
    };
    summary: {
      subtotal: number;
      tax: number;
      shippingCost: number;
      total: number;
      itemCount: number;
    };
  };
  children?: ReactNode;
}

export function OrderSummary({ checkoutData, children }: OrderSummaryProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const { cart, summary } = checkoutData;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <h2 className="text-sm md:text-xl font-bold text-gray-900">
          {t("orderSummary")}
        </h2>
      </div>

      {/* Items Breakdown */}
      <div className="p-3 md:p-5 pt-2 md:pt-3">
        <div className="space-y-0 mb-2 md:mb-3">
          {cart.cartItems.map((item) => {
            const unit = Number(item.price) ?? 0;
            const lineTotal = unit * item.quantity;
            const variant = item.variant as any;
            const variantTitle = variant ? formatVariantTitle(variant) : null;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                    {item.product.title}
                  </p>
                  {variantTitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {variantTitle}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tCommon("quantity")}: {item.quantity}
                    {" × "}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: formatPrice(unit, locale),
                      }}
                    />
                  </p>
                </div>
                <div
                  className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap"
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(lineTotal, locale),
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-sm md:text-base">
            <span className="font-medium text-gray-700">{t("subtotal")}</span>
            <span
              className="font-semibold text-gray-900"
              dangerouslySetInnerHTML={{
                __html: formatPrice(summary.subtotal ?? 0, locale),
              }}
            />
          </div>

          {summary.shippingCost > 0 && (
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="font-medium text-gray-700">{t("shipping")}</span>
              <span
                className="font-semibold text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(summary.shippingCost, locale),
                }}
              />
            </div>
          )}

          {summary.tax > 0 && (
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="font-medium text-gray-700">{t("tax")}</span>
              <span
                className="font-semibold text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(summary.tax, locale),
                }}
              />
            </div>
          )}

          <Separator className="bg-gray-200" />

          <div className="flex items-center justify-between pt-1 md:pt-2">
            <span className="text-base md:text-xl font-bold text-gray-900">
              {t("total")}
            </span>
            <span
              className="text-lg md:text-2xl font-bold text-primary"
              dangerouslySetInnerHTML={{
                __html: formatPrice(summary.total ?? 0, locale),
              }}
            />
          </div>
        </div>
      </div>

      {/* Button Section */}
      {children && (
        <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3 md:space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
