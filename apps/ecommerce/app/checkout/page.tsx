import { Suspense } from "react";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { getCheckoutData } from "@/actions/checkout";
import { CheckoutData } from "./checkout.data";
import { CheckoutInteractions } from "./checkout.client";
import { CheckoutSkeleton } from "./checkout.skeleton";
import { ChevronLeft } from "lucide-react";

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
      <div className="flex justify-between container pt-5 mx-auto items-center">
        <DynamicBreadcrumb />
        <Button variant="link" asChild>
          <Link href="/cart" className="text-primary hover:underline">
            <ChevronLeft size={16} />
            Back to cart
          </Link>
        </Button>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<CheckoutSkeleton />}>
              <CheckoutData checkoutData={result.data as any} />
            </Suspense>
          </div>

          <div className="lg:col-span-1">
            <CheckoutInteractions checkoutData={result.data as any} />
          </div>
        </div>
      </main>
    </div>
  );
}
