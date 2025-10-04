"use client";

import { Separator } from "@workspace/ui/components/separator";

export const CheckoutInteractions = ({
  checkoutData,
}: {
  checkoutData: any;
}) => {
  const { cart, summary } = checkoutData;

  return (
    <div className="bg-white border rounded-lg p-4 sm:p-6 lg:sticky lg:top-4">
      <h3 className="text-lg font-bold mb-4">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            {Number(summary.subtotal).toFixed(2)} {cart.currency || "USD"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {Number(summary.shippingCost).toFixed(2)} {cart.currency || "USD"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>
            {Number(summary.tax).toFixed(2)} {cart.currency || "USD"}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>
            {Number(summary.total).toFixed(2)} {cart.currency || "USD"}
          </span>
        </div>
      </div>
    </div>
  );
};
