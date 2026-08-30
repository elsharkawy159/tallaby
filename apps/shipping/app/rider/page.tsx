import { Suspense } from "react";
import Link from "next/link";
import { PackageCheck } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";

import { formatCurrency } from "@/lib/format";

import { DeliveryCard } from "./_components/delivery-card";
import { getRiderDashboard } from "./rider.server";

export const dynamic = "force-dynamic";

const STAT_CARDS: { key: "remaining" | "deliveredToday" | "failedToday"; label: string }[] = [
  { key: "remaining", label: "Remaining" },
  { key: "deliveredToday", label: "Delivered" },
  { key: "failedToday", label: "Failed" },
];

async function Dashboard() {
  const result = await getRiderDashboard();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? "Failed to load your dashboard"}
      </p>
    );
  }

  const { stats, next, remaining, completedToday } = result;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border bg-white p-3 text-center dark:bg-gray-950"
          >
            <p className="text-2xl font-bold">{stats[card.key]}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-white p-3 dark:bg-gray-950">
          <p className="text-xs text-muted-foreground">COD to collect</p>
          <p className="text-lg font-bold">{formatCurrency(stats.codToCollect)}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 dark:bg-gray-950">
          <p className="text-xs text-muted-foreground">COD collected today</p>
          <p className="text-lg font-bold">
            {formatCurrency(stats.codCollectedToday)}
          </p>
        </div>
      </div>

      {next ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Next Delivery
          </h2>
          <DeliveryCard delivery={next} />
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-10 text-center dark:bg-gray-950">
          <PackageCheck className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No deliveries assigned today.
          </p>
        </div>
      )}

      {remaining.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Remaining Deliveries
          </h2>
          <div className="space-y-3">
            {remaining.map((delivery) => (
              <DeliveryCard key={delivery.shipmentId} delivery={delivery} />
            ))}
          </div>
        </section>
      )}

      {completedToday.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Completed Today
          </h2>
          <div className="space-y-3">
            {completedToday.map((delivery) => (
              <DeliveryCard key={delivery.shipmentId} delivery={delivery} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function RiderPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">My Deliveries</h1>
        <Link href="/rider/profile" className="text-sm text-primary hover:underline">
          Profile
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    </div>
  );
}
