import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";import { PackageCheck } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

import { formatCurrency } from "@/lib/format";

import { DeliveryCard } from "./_components/delivery-card";
import { getRiderDashboard } from "./rider.server";

export const dynamic = "force-dynamic";

const STAT_KEYS = ["remaining", "deliveredToday", "failedToday"] as const;

async function Dashboard() {
  const t = await getTranslations("rider");
  const result = await getRiderDashboard();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? t("dashboardLoadError")}
      </p>
    );
  }

  const { stats, next, remaining } = result;

  const statLabels: Record<(typeof STAT_KEYS)[number], string> = {
    remaining: t("remaining"),
    deliveredToday: t("deliveredToday"),
    failedToday: t("failedToday"),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {STAT_KEYS.map((key) => {
          const content = (
            <>
              <p className="text-2xl font-bold">{stats[key]}</p>
              <p className="text-xs text-muted-foreground">{statLabels[key]}</p>
            </>
          );

          if (key === "failedToday") {
            return (
              <Link
                key={key}
                href="/rider/failed"
                className={cn(
                  "rounded-xl border bg-white p-3 text-center transition-colors dark:bg-gray-950",
                  "hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                {content}
              </Link>
            );
          }

          if (key === "deliveredToday") {
            return (
              <Link
                key={key}
                href="/rider/delivered"
                className={cn(
                  "rounded-xl border bg-white p-3 text-center transition-colors dark:bg-gray-950",
                  "hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={key}
              className="rounded-xl border bg-white p-3 text-center dark:bg-gray-950"
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-white p-3 dark:bg-gray-950">
          <p className="text-xs text-muted-foreground">{t("codToCollect")}</p>
          <p className="text-lg font-bold">{formatCurrency(stats.codToCollect)}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 dark:bg-gray-950">
          <p className="text-xs text-muted-foreground">{t("codCollectedToday")}</p>
          <p className="text-lg font-bold">
            {formatCurrency(stats.codCollectedToday)}
          </p>
        </div>
      </div>

      {next ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("nextDelivery")}
          </h2>
          <DeliveryCard delivery={next} />
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-10 text-center dark:bg-gray-950">
          <PackageCheck className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("noActiveDeliveries")}</p>
        </div>
      )}

      {remaining.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("remainingDeliveries")}
          </h2>
          <div className="space-y-3">
            {remaining.map((delivery) => (
              <DeliveryCard key={delivery.shipmentId} delivery={delivery} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default async function RiderPage() {
  const t = await getTranslations("rider");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">{t("myDeliveries")}</h1>

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
