"use client";
import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useAddress } from "@/providers/address-provider";
import { useCart } from "@/providers/cart-provider";

const paymentMethods = [
  {
    id: "cash_on_delivery",
    value: "cash_on_delivery",
    title: "Cash on Delivery",
    description: "Pay when your order is delivered to your doorstep.",
    enabled: true,
  },
  {
    id: "wallet",
    value: "wallet",
    title: "Wallet",
    description: "Vodafone Cash",
    enabled: true,
  },
  {
    id: "bank_transfer",
    value: "bank_transfer",
    title: "Bank Transfer",
    description: "Instapay",
    enabled: true,
  },
];

export const CheckoutData = ({ checkoutData }: { checkoutData: any }) => {
  const { cart, user } = checkoutData;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Use address hook for real-time updates
  const {
    addresses,
    defaultAddress,
    selectedAddress,
    isLoading: isLoadingAddresses,
  } = useAddress();

  // Use cart hook to refresh cart after order placement
  const { refreshCart } = useCart();

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
          // Refresh cart to clear it after order placement
          await refreshCart();
          toast.success("Order placed successfully!");
          // Redirect to order confirmation page
          router.push(`/orders/${result.data?.order?.id}/confirmation`);
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
    // The hook's selectAddress is already called by AddressSelectorDialog
    // Just update the form to match
    if (address?.id) {
      form.setValue("shippingAddressId", address.id);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Shipping Information */}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Payment</CardTitle>
          </CardHeader>
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
                      >
                        {paymentMethods.map((method) => (
                          <FieldLabel
                            key={method.id}
                            htmlFor={method.id}
                            className={`
                              p-4 rounded-lg border transition-all duration-100
                              ${
                                method.enabled
                                  ? `cursor-pointer ${
                                      field.value === method.value
                                        ? "ring-1 ring-primary bg-primary/5 border-primary"
                                        : "border-gray-200 hover:border-gray-300"
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
                                <FieldTitle>
                                  {method.title}
                                  {!method.enabled && (
                                    <span className="ml-2 text-xs text-orange-600 font-normal">
                                      (Soon)
                                    </span>
                                  )}
                                </FieldTitle>
                                <FieldDescription>
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
                    <p className="text-sm text-red-500 mt-2">
                      {form.formState.errors.paymentMethod.message}
                    </p>
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <CheckoutForm
          checkoutData={checkoutData}
          form={form}
          isPending={isPending}
        />
      </form>
    </Form>
  );
};
