import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { OrdersData } from "./orders.data";
import { OrdersSkeleton } from "./orders.skeleton";
import type { OrdersPageProps } from "./orders.types";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const t = await getTranslations("orders");
  const params = (await searchParams) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Keyed on the filters so a filter change re-suspends and shows the
          skeleton instead of freezing the previous page's rows. */}
      <Suspense
        key={new URLSearchParams(
          Object.entries(params).filter(([, value]) => Boolean(value)) as [string, string][]
        ).toString()}
        fallback={<OrdersSkeleton />}
      >
        <OrdersData searchParams={params} />
      </Suspense>
    </div>
  );
}
