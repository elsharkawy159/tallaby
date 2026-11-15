import { listSellerBostaStores, listSellerStoresWith } from "@workspace/lib/integrations/server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import type { OrderRowContext } from "./orders.query";

/** The session seller's stores and integrations, for building order rows. */
export async function loadOrderRowContext(sellerId: string): Promise<OrderRowContext> {
  const [{ stores }, bostaStores, wassalhaStores] = await Promise.all([
    getSellerStores(),
    listSellerBostaStores(sellerId),
    listSellerStoresWith(sellerId, "wassalha"),
  ]);
  return { stores, bostaStores, wassalhaStores };
}
