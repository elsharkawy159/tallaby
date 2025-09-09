"use client";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { CheckoutForm } from "./checkout-form";
import { ShippingInformation } from "./shipping-information";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Form } from "@workspace/ui/components/form";
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

export const CheckoutData = ({ checkoutData }: { checkoutData: any }) => {
  const { cart, addresses, user } = checkoutData;
  const defaultAddress = addresses?.[0];
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      ...checkoutFormDefaults,
      shippingAddressId: defaultAddress?.id || "",
    },
  });

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
    form.setValue("shippingAddressId", address.id || "");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Shipping Information */}
        <ShippingInformation
          addresses={addresses || []}
          userId={user?.id || ""}
          selectedAddressId={
            form.watch("shippingAddressId") || defaultAddress?.id
          }
          onAddressSelect={handleAddressSelect}
        />

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 p-4 ring-2 ring-primary w-fit rounded-lg cursor-pointer">
              Cash on Delivery
            </div>
          </CardContent>
        </Card>

        {/* Review Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Review Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {cart.cartItems.map((item: any) => {
                const p = item.product;
                const img = p?.images?.[0]
                  ? getPublicUrl(p?.images?.[0], "products")
                  : "/png product.png";
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className="w-14 h-14 relative bg-gray-100 rounded">
                      <Image
                        src={img}
                        alt={p.title}
                        fill
                        className="object-contain bg-white rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      {(Number(item.price) * item.quantity).toFixed(2)}{" "}
                      {cart.currency || "USD"}
                    </p>
                  </div>
                );
              })}
            </div>
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
