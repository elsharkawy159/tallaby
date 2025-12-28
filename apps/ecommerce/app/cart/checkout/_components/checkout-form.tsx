"use client";

import { UseFormReturn } from "react-hook-form";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { type CheckoutFormData } from "./checkout-form.schema.js";
import { FormField } from "@workspace/ui/components/form";
import { Card, CardContent } from "@workspace/ui/components/card";

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
    <Card className="rounded-2xl border border-gray-200 overflow-hidden py-0">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
      </div>
      <CardContent className="p-6 space-y-6">
        {/* Order Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Order Notes (Optional)
          </Label>
          <FormField
            control={form.control as any}
            name="notes"
            render={({ field }) => (
              <Textarea
                {...field}
                id="notes"
                placeholder="Any special instructions for your order..."
                rows={4}
                className="w-full resize-none"
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
          className="w-full h-12 text-base font-semibold"
          disabled={isPending || !form.formState.isValid}
        >
          {isPending ? "Placing Order..." : "Place Order"}
        </Button>
      </CardContent>
    </Card>
  );
};
