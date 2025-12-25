"use client";

import { UseFormReturn } from "react-hook-form";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import Link from "next/link";
import { type CheckoutFormData } from "./checkout-form.schema.js";
import { FormField } from "@workspace/ui/components/form";

interface CheckoutFormProps {
  checkoutData: any;
  form: UseFormReturn<CheckoutFormData>;
  isPending: boolean;
}

export const CheckoutForm = ({
  checkoutData,
  form,
  isPending,
}: CheckoutFormProps) => {
  return (
    <div className="bg-white border rounded-lg p-4 sm:p-6">
      {/* <h2 className="text-xl font-bold mb-6">Place Order</h2> */}

      <div className="space-y-6">

        {/* Coupon Code */}
        {/* <div className="space-y-2">
          <Label htmlFor="couponCode" className="text-sm font-medium">
            Coupon Code (Optional)
          </Label>
          <FormField
            control={form.control}
            name="couponCode"
            render={({ field }) => (
              <Input
                {...field}
                id="couponCode"
                placeholder="Enter coupon code"
                className="w-full"
              />
            )}
          />
          {form.formState.errors.couponCode && (
            <p className="text-sm text-red-500">
              {form.formState.errors.couponCode.message}
            </p>
          )}
        </div> */}

        {/* Gift Options */}
        <div className="space-y-4">
          {/* <FormField
            control={form.control}
            name="isGift"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isGift"
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="isGift" className="text-sm cursor-pointer">
                  This is a gift
                </Label>
              </div>
            )}
          /> */}

          {form.watch("isGift") && (
            <div className="space-y-2">
              <Label htmlFor="giftMessage" className="text-sm font-medium">
                Gift Message (Optional)
              </Label>
              <FormField
                control={form.control}
                name="giftMessage"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="giftMessage"
                    placeholder="Enter your gift message..."
                    rows={3}
                    className="w-full"
                  />
                )}
              />
              {form.formState.errors.giftMessage && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.giftMessage.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Order Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Order Notes (Optional)
          </Label>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Textarea
                {...field}
                id="notes"
                placeholder="Any special instructions for your order..."
                rows={3}
                className="w-full"
              />
            )}
          />
          {form.formState.errors.notes && (
            <p className="text-sm text-red-500">
              {form.formState.errors.notes.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="bg-green-600 hover:bg-green-700 w-full"
          disabled={isPending || !form.formState.isValid}
        >
          {isPending ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
};
