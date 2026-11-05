import { getShippingOverview } from "@/actions/shipping";
import { Note } from "@/components/seller-ui";
import { ShippingWorkspace } from "./shipping-workspace.client";

export async function ShippingData({ view = "orders" }: { view?: "orders" | "riders" }) {
  const res = await getShippingOverview();

  if (!res.success || !res.data) {
    return <Note tone="danger">{res.error ?? "Could not load your shipping data."}</Note>;
  }

  return <ShippingWorkspace orders={res.data.orders} riders={res.data.riders} initialView={view} />;
}
