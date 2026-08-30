import { Suspense } from "react";
import { PackageCheck } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";

import { DeliveryCard } from "./_components/delivery-card";
import { getMyDeliveries } from "./rider.server";

export const dynamic = "force-dynamic";

async function DeliveriesList() {
  const result = await getMyDeliveries();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? "Failed to load your deliveries"}
      </p>
    );
  }

  if (result.open.length === 0 && result.closed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-10 text-center dark:bg-gray-950">
        <PackageCheck className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nothing assigned to you right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {result.open.length > 0 && (
        <section className="space-y-3">
          {result.open.map((delivery) => (
            <DeliveryCard key={delivery.shipmentId} delivery={delivery} />
          ))}
        </section>
      )}

      {result.open.length === 0 && (
        <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground dark:bg-gray-950">
          All caught up — no open deliveries.
        </p>
      )}

      {result.closed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Completed
          </h2>
          {result.closed.map((delivery) => (
            <DeliveryCard key={delivery.shipmentId} delivery={delivery} />
          ))}
        </section>
      )}
    </div>
  );
}

export default function RiderPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">My Deliveries</h1>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <DeliveriesList />
      </Suspense>
    </div>
  );
}
