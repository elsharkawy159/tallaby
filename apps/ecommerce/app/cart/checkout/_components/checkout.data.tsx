"use client";
import { useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "./checkout-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Form, FormField } from "@workspace/ui/components/form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { useForm } from "react-hook-form";
import {
  CheckoutFormData,
  checkoutFormDefaults,
  checkoutFormSchema,
} from "./checkout-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrder } from "@/actions/order";
import { toast } from "sonner";
import type { AddressData } from "@/components/address/address.schema";
import { ShippingInformation } from "./shipping-information";
import { CreditCard, ArrowLeft } from "lucide-react";
import { OrderSummary } from "./order-summary";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Info } from "lucide-react";

const paymentMethods = [
  {
    id: "cash_on_delivery",
    value: "cash_on_delivery",
    title: "Cash on Delivery",
    description: "Pay when your order is delivered to your doorstep.",
    enabled: true,
  },
  {
    id: "online_payment",
    value: "online_payment",
    title: "Online Payment",
    description: "You will be contacted by us to complete the payment.",
    enabled: true,
  },
  // {
  //   id: "wallet",
  //   value: "wallet",
  //   title: "Wallet",
  //   description: "Vodafone Cash",
  //   enabled: true,
  // },
  // {
  //   id: "bank_transfer",
  //   value: "bank_transfer",
  //   title: "Bank Transfer",
  //   description: "Instapay",
  //   enabled: true,
  // },
];

export const CheckoutData = ({
  checkoutData,
  addresses: initialAddresses = [],
  defaultAddress: initialDefaultAddress = null,
}: {
  checkoutData: any;
  addresses?: any[];
  defaultAddress?: any;
}) => {
  const { cart, user } = checkoutData;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const addresses = initialAddresses;
  const defaultAddress = initialDefaultAddress;
  const isLoadingAddresses = false;

  // Determine which address to use: selectedAddress > defaultAddress > first address
  const activeAddress =
    selectedAddress || defaultAddress || addresses[0] || null;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      ...checkoutFormDefaults,
      shippingAddressId: activeAddress?.id || "",
    },
  });

  // Sync form with address changes from hook
  // Update form when selectedAddress, defaultAddress, or addresses change
  useEffect(() => {
    if (activeAddress?.id) {
      const currentAddressId = form.getValues("shippingAddressId");
      // Only update if different to avoid unnecessary re-renders
      if (currentAddressId !== activeAddress.id) {
        form.setValue("shippingAddressId", activeAddress.id);
      }
    }
  }, [selectedAddress?.id, defaultAddress?.id, addresses, form, activeAddress]);

  const handleSubmit = (data: CheckoutFormData) => {
    startTransition(async () => {
      try {
        const result = await createOrder({
          cartId: cart.id,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId || data.shippingAddressId,
          paymentMethod: data.paymentMethod,
          couponCode: data.couponCode,
          notes: data.notes,
          isGift: data.isGift,
          giftMessage: data.giftMessage,
        });

        if (result.success) {
          toast.success("Order placed successfully!");
          // Redirect to order confirmation page
          router.push(`/orders/${result.data?.order?.id}`);
        } else {
          toast.error(result.error || "Failed to place order");
        }
      } catch (error) {
        console.error("Checkout submission error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleAddressSelect = (address: AddressData) => {
    setSelectedAddress(address);
    if (address?.id) {
      form.setValue("shippingAddressId", address.id);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 md:gap-8 lg:gap-12">
          {/* Shipping Information */}
          <div className="space-y-4 md:space-y-6">
            <ShippingInformation
              addresses={addresses || []}
              userId={user?.id || ""}
              selectedAddressId={
                form.watch("shippingAddressId") || activeAddress?.id
              }
              onAddressSelect={handleAddressSelect}
              isLoading={isLoadingAddresses}
            />

            {/* Payment Method */}
            <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden pt-0">
              <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" /> Payment
                  Method
                </CardTitle>
              </div>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <div className="w-full">
                      <FieldGroup>
                        <FieldSet>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                          >
                            {paymentMethods.map((method) => (
                              <FieldLabel
                                key={method.id}
                                htmlFor={method.id}
                                className={`
                              rounded-xl border-2 p-4 transition-all duration-200
                              ${
                                method.enabled
                                  ? `cursor-pointer ${
                                      field.value === method.value
                                        ? "ring-2 ring-primary bg-primary/5 border-primary shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`
                                  : "cursor-not-allowed opacity-50 border-gray-200 bg-gray-50"
                              }
                            `}
                              >
                                <Field
                                  orientation="horizontal"
                                  className="flex items-start gap-2"
                                >
                                  <RadioGroupItem
                                    value={method.value}
                                    id={method.id}
                                    disabled={!method.enabled}
                                  />
                                  <FieldContent>
                                    <FieldTitle className="text-xs md:text-sm">
                                      {method.title}
                                      {!method.enabled && (
                                        <span className="ml-2 text-xs text-orange-600 font-normal">
                                          (Soon)
                                        </span>
                                      )}
                                    </FieldTitle>
                                    <FieldDescription className="text-xs">
                                      {method.description}
                                    </FieldDescription>
                                  </FieldContent>
                                </Field>
                              </FieldLabel>
                            ))}
                          </RadioGroup>
                        </FieldSet>
                      </FieldGroup>
                      {form.formState.errors.paymentMethod && (
                        <p className="text-xs md:text-sm text-red-500 mt-2">
                          {form.formState.errors.paymentMethod.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden pt-0">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
                  <Info className="h-4 w-4 md:h-5 md:w-5" />
                  Order Details
                </CardTitle>
              </div>
              <CardContent>
                {/* Order Notes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-xs md:text-sm font-medium text-gray-700"
                  >
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
                    <p className="text-xs md:text-sm text-red-500">
                      {form.formState.errors.notes.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit order-2 lg:order-2">
            <OrderSummary checkoutData={checkoutData}>
              <Button
                type="submit"
                size="lg"
                className="w-full h-10 md:h-12 text-xs md:text-base font-semibold transition-all duration-200"
                disabled={isPending || !form.formState.isValid}
              >
                {isPending ? "Placing Order..." : "Place Order"}
              </Button>

              <Link href="/cart">
                <Button
                  variant="outline"
                  className="w-full h-9 md:h-11 text-xs md:text-sm border-2 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Back to Cart
                </Button>
              </Link>
            </OrderSummary>
          </div>
        </div>
      </form>
    </Form>
  );
};
