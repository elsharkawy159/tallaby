import { Suspense } from "react";
import { parseLeadRange, parseLeadStatus } from "@workspace/lib/checkout-leads";
import { MissedOrdersData } from "./missed-orders.data";

// Per-seller data read from the session cookie; personal data, never cached.
export const dynamic = "force-dynamic";

/** Orders › Not completed: store checkouts that got an address but no order (ROADMAP.md F-03). */
export default async function MissedOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; range?: string; status?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <MissedOrdersData
          storeId={typeof params.store === "string" ? params.store : null}
          range={parseLeadRange(params.range)}
          status={parseLeadStatus(params.status)}
        />
      </Suspense>
    </div>
  );
}
