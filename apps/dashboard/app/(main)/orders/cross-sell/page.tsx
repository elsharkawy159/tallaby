import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { ListPageSkeleton, OrdersPageFrame } from "../orders-page-frame";
import { CrossSellReportData } from "./cross-sell-report.data";

// Per-seller order data read from the session cookie; never cached.
export const dynamic = "force-dynamic";

type Params = Partial<Record<"store" | "days" | "page" | "size", string | string[]>>;

/** Orders › Cross-sell report: what each offer of a store sold (ROADMAP.md F-32f). */
export default async function CrossSellReportPage({ searchParams }: { searchParams: Promise<Params> }) {
  const lock = await currentOrderLock();
  if (lock.locked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;
  return (
    <OrdersPageFrame>
      <Suspense fallback={<ListPageSkeleton />}>
        <CrossSellReportData storeId={typeof params.store === "string" ? params.store : null} searchParams={params} />
      </Suspense>
    </OrdersPageFrame>
  );
}
