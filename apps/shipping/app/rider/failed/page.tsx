import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";

import { DeliveryCard } from "../_components/delivery-card";
import { getRiderFailedCancelledToday } from "../rider.server";

export const dynamic = "force-dynamic";

async function FailedList() {
  const t = await getTranslations("rider");
  const result = await getRiderFailedCancelledToday();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? t("dashboardLoadError")}
      </p>
    );
  }

  const deliveries = result.data ?? [];

  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-10 text-center dark:bg-gray-950">
        <CircleAlert className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("noFailedToday")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <DeliveryCard key={delivery.shipmentId} delivery={delivery} />
      ))}
    </div>
  );
}

export default async function RiderFailedPage() {
  const t = await getTranslations("rider");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t("backToDeliveries")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{t("failedToday")}</h1>
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
        <FailedList />
      </Suspense>
    </div>
  );
}
