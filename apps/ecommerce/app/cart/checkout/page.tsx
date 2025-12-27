import { Suspense } from "react";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { getCheckoutData } from "@/actions/checkout";
import { CheckoutData } from "./_components/checkout.data";
import { CheckoutSkeleton } from "./_components/checkout.skeleton";
import { ChevronLeft } from "lucide-react";
import { generateNoIndexMetadata } from "@/lib/metadata";
import { ReviewItems } from "@/components/review-items";
import type { Metadata } from "next";
import { CheckoutInteractions } from "./_components/checkout.client";
import { getAddresses } from "@/actions/customer";

export const metadata: Metadata = generateNoIndexMetadata();

export default async function Checkout() {
  const result = await getCheckoutData();
  const addressesResult = await getAddresses();
  const addresses = addressesResult.success ? (addressesResult.data ?? []) : [];
  const defaultAddress = addresses.find((addr: any) => addr.isDefault) ?? null;

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Checkout unavailable</h1>
          <p className="text-gray-600 mb-6">
            {result.error || "Please sign in and add items to your cart."}
          </p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const checkoutData = result.data as any;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <DynamicBreadcrumb />
      <main className="flex-1 container py-8 pb-16">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Checkout</h1>
          <p className="text-muted-foreground text-lg">
            Complete your order details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
          {/* Checkout Form Section */}
          <div className="order-2 lg:order-1">
            <CheckoutData
              checkoutData={checkoutData}
              addresses={addresses}
              defaultAddress={defaultAddress}
            />
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit order-1 lg:order-2 space-y-6">
            {/* Review Items */}
            <ReviewItems
              items={checkoutData.cart.cartItems.map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                product: {
                  id: item.product.id,
                  title: item.product.title,
                  images: item.product.images,
                },
              }))}
              title="Review Items"
              showCount={true}
              showTotal={false}
            />

            <CheckoutInteractions checkoutData={checkoutData} />
          </div>
        </div>
      </main>
    </div>
  );
}
