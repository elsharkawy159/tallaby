import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

import { formatCurrency } from "@/lib/format";
import { translateShippingStatus } from "@/lib/rider-labels";
import { getStatusColor } from "@/lib/shipping-status";

import { AvailabilityToggle } from "./_components/availability-toggle";
import { ProfileEditForm } from "./_components/profile-edit-form.client";
import { getRiderProfile } from "../rider.server";

export const dynamic = "force-dynamic";

async function Profile() {
  const t = await getTranslations("rider");
  const tStatus = await getTranslations("status");
  const result = await getRiderProfile();

  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? t("profileLoadError")}
      </p>
    );
  }

  const rider = result.data;
  const stats = result.stats;
  const history = result.history ?? [];

  return (
    <div className="space-y-4">
      <ProfileEditForm
        fullName={rider.fullName}
        phone={rider.phone}
        email={rider.email}
        avatarUrl={rider.avatarUrl}
      />

      <div>
        <Badge
          className={
            rider.isSuspended
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }
        >
          {rider.isSuspended ? t("deactivated") : t("active")}
        </Badge>
      </div>

      <AvailabilityToggle isAvailable={rider.isAvailable} />

      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatTile label={t("todaysDeliveries")} value={stats.todayTotal} />
          <StatTile label={t("remaining")} value={stats.remaining} />
          <StatTile
            label={t("deliveredToday")}
            value={stats.deliveredToday}
            href="/rider/delivered"
          />
          <StatTile
            label={t("failedToday")}
            value={stats.failedToday}
            href="/rider/failed"
          />
          <StatTile
            label={t("codCollectedToday")}
            value={formatCurrency(stats.codCollectedToday)}
          />
          <StatTile label={t("codRemaining")} value={formatCurrency(stats.codToCollect)} />
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("deliveryHistory")}
        </h2>
        {history.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground dark:bg-gray-950">
            {t("noCompletedDeliveries")}
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
                  {translateShippingStatus(tStatus, delivery.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const className = cn(
    "rounded-xl border bg-white p-3 dark:bg-gray-950",
    href && "transition-colors hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-900"
  );
  const content = (
    <>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default async function RiderProfilePage() {
  const t = await getTranslations("rider");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">{t("profile")}</h1>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <Profile />
      </Suspense>
    </div>
  );
}
