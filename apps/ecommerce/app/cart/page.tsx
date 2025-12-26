import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import CartClient from "./cart.client";
import { getCartItems } from "@/actions/cart";

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for cart
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Cart() {
  const cartResult = await getCartItems();
  const cartData = cartResult.success ? cartResult.data : null;

  return <CartClient initialCartData={cartData} />;
}
