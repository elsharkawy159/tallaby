"use client";

import { Separator } from "@workspace/ui/components/separator";
import { useLocale } from "next-intl";
import { formatPrice } from "@workspace/lib";

export const CheckoutInteractions = ({
  checkoutData,
}: {
  checkoutData: any;
}) => {
  const { cart, summary } = checkoutData;
  const locale = useLocale();

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <h3 className="text-sm md:text-xl font-bold text-gray-900">
          Order Summary
        </h3>
      </div>

      {/* Totals */}
      <div className="p-3 md:p-5 pt-2 md:pt-3">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between text-sm md:text-base">
            <span className="font-medium text-gray-700">Subtotal</span>
            <span
              className="font-semibold text-gray-900"
              dangerouslySetInnerHTML={{
                __html: formatPrice(Number(summary.subtotal), locale),
              }}
            />
          </div>

          <div className="flex items-center justify-between text-sm md:text-base">
            <span className="font-medium text-gray-700">Shipping</span>
            <span
              className="font-semibold text-gray-900"
              dangerouslySetInnerHTML={{
                __html: formatPrice(Number(summary.shippingCost), locale),
              }}
            />
          </div>

          {summary.tax > 0 && (
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="font-medium text-gray-700">Tax</span>
              <span
                className="font-semibold text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(Number(summary.tax), locale),
                }}
              />
            </div>
          )}

          <Separator className="bg-gray-200" />

          <div className="flex items-center justify-between pt-1 md:pt-2">
            <span className="text-base md:text-xl font-bold text-gray-900">
              Total
            </span>
            <span
              className="text-lg md:text-2xl font-bold text-primary"
              dangerouslySetInnerHTML={{
                __html: formatPrice(Number(summary.total), locale),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
