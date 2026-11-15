import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { ListPageSkeleton, OrdersPageFrame } from "../orders-page-frame";
import { CrossSellReportData } from "./cross-sell-report.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

type Params = Partial<Record<"store" | "days" | "page" | "size", string | string[]>>;

/** Orders › Cross-sell report: what each offer of a store sold (ROADMAP.md F-32f). */
export default async function CrossSellReportPage({ searchParams }: { searchParams: Promise<Params> }) {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;
  return (
    <OrdersPageFrame>
      <Suspense fallback={<ListPageSkeleton />}>
        <CrossSellReportData storeId={typeof params.store === "string" ? params.store : null} searchParams={params} />
      </Suspense>
    </OrdersPageFrame>
  );
}
