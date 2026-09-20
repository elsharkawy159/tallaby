import { getShippingOverview } from "@/actions/shipping";
import { ShippingWorkspace } from "./shipping-workspace.client";

export async function ShippingData() {
  const res = await getShippingOverview();

  if (!res.success || !res.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {res.error ?? "Could not load your shipping data."}
      </div>
    );
  }

  return <ShippingWorkspace orders={res.data.orders} riders={res.data.riders} />;
}
