import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import CartClient from "./cart.client";

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for cart
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Cart() {
  return <CartClient />;
}
