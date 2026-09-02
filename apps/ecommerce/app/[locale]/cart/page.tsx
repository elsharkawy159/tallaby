import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { getCartItems } from "@/actions/cart";
import { CartPageClient } from "./cart-page.client";
import { CartSimilarProducts } from "./_components/cart-similar-products";

export const metadata: Metadata = generateNoIndexMetadata();

// The cart is read from the viewer's session cookie, so there is nothing to
// prerender. Declaring it keeps `next build` from attempting (and logging a
// DYNAMIC_SERVER_USAGE error for) a static render of this route.
export const dynamic = "force-dynamic";

export default async function Cart() {
  const cartResult = await getCartItems();
  const initialCartData = cartResult.success ? cartResult.data : null;
  const cartProductIds =
    initialCartData?.items.map((item) => item.productId) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-gray-50 to-white">
      <DynamicBreadcrumb />
      <main className="flex-1 container py-4 md:pt-2 pb-12 md:pb-16">
        <CartPageClient initialCartData={initialCartData} />
        <CartSimilarProducts cartProductIds={cartProductIds} />
      </main>
    </div>
  );
}
