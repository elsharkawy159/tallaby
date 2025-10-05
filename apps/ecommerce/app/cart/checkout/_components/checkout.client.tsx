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
    <div className="bg-white border rounded-lg p-4 sm:p-6 lg:sticky lg:top-4">
      <h3 className="text-lg font-bold mb-4">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span
            dangerouslySetInnerHTML={{
              __html: formatPrice(Number(summary.subtotal), locale),
            }}
          />
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span
            dangerouslySetInnerHTML={{
              __html: formatPrice(Number(summary.shippingCost), locale),
            }}
          />
        </div>
        {summary.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span
              dangerouslySetInnerHTML={{
                __html: formatPrice(Number(summary.tax), locale),
              }}
            />
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span
            dangerouslySetInnerHTML={{
              __html: formatPrice(Number(summary.total), locale),
            }}
          />
        </div>
      </div>
    </div>
  );
};
