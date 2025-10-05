import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import CartClient from "./cart.client";

export const metadata: Metadata = generateNoIndexMetadata();

export default async function Cart() {
  return <CartClient />;
}
