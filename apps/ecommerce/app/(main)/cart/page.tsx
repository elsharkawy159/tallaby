import CartClient from "./cart.client";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateNoIndexMetadata();

export default async function Cart() {
  return <CartClient />;
}
