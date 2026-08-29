import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getOrders } from "@/actions/order";
import { OrdersClient } from "./orders.client";
import { getProfileContext } from "../_components/profile.server";

export const metadata: Metadata = generateNoIndexMetadata();

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function OrdersPage() {
  const [{ isGuest }, result] = await Promise.all([
    getProfileContext(),
    getOrders(),
  ]);
  const orders = result.success ? (result.data ?? []) : [];

  return <OrdersClient initialOrders={orders} isGuest={isGuest} />;
}
