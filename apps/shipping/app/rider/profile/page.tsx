import { Suspense } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { formatCurrency } from "@/lib/format";
import { getStatusColor, getStatusLabel } from "@/lib/shipping-status";

import { AvailabilityToggle } from "./_components/availability-toggle";
import { getRiderProfile } from "../rider.server";

export const dynamic = "force-dynamic";

async function Profile() {
  const result = await getRiderProfile();

  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? "Failed to load your profile"}
      </p>
    );
  }

  const rider = result.data;
  const stats = result.stats;
  const history = result.history ?? [];

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-4">
        <CardContent className="flex items-center gap-4 px-4">
          <Avatar className="size-14 shrink-0">
            {rider.avatarUrl && <AvatarImage src={rider.avatarUrl} alt="" />}
            <AvatarFallback className="text-lg font-semibold text-primary">
              {(rider.fullName ?? rider.email ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{rider.fullName ?? "—"}</p>
            <p className="truncate text-sm text-muted-foreground">
              {rider.phone ?? rider.email ?? "—"}
            </p>
            <Badge
              className={
                rider.isSuspended
                  ? "mt-1 bg-red-100 text-red-800"
                  : "mt-1 bg-green-100 text-green-800"
              }
            >
              {rider.isSuspended ? "Deactivated" : "Active"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <AvailabilityToggle isAvailable={rider.isAvailable} />

      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Today's deliveries" value={stats.todayTotal} />
          <StatTile label="Remaining" value={stats.remaining} />
          <StatTile label="Delivered today" value={stats.deliveredToday} />
          <StatTile label="Failed today" value={stats.failedToday} />
          <StatTile
            label="COD collected today"
            value={formatCurrency(stats.codCollectedToday)}
          />
          <StatTile label="COD remaining" value={formatCurrency(stats.codToCollect)} />
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Delivery history
        </h2>
        {history.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground dark:bg-gray-950">
            No completed deliveries yet.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((delivery) => (
              <div
                key={delivery.shipmentId}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm dark:bg-gray-950"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{delivery.orderNumber}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {delivery.customerName ?? "—"}
                  </p>
                </div>
                <Badge className={getStatusColor(delivery.status)}>
                  {getStatusLabel(delivery.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-3 dark:bg-gray-950">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function RiderProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Profile</h1>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <Profile />
      </Suspense>
    </div>
  );
}
