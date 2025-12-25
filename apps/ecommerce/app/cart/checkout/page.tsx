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

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for checkout
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Checkout() {
  const result = await getCheckoutData();
  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Checkout unavailable</h1>
          <p className="text-gray-600">
            {result.error || "Please sign in and add items to your cart."}
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      {/* <Button variant="link" asChild>
          <Link href="/cart" className="text-primary hover:underline">
            <ChevronLeft size={16} />
            Back to cart
          </Link>
        </Button> */}

      <main className="flex-1 container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
              <CheckoutData checkoutData={result.data as any} />
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
            {/* Review Items */}
            <ReviewItems
              items={(result.data as any).cart.cartItems.map((item: any) => ({
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

            <CheckoutInteractions checkoutData={result.data as any} />
          </div>
        </div>
      </main>
    </div>
  );
}
