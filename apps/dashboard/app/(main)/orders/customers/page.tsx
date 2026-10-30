import { Suspense } from "react";
import { CustomersData } from "./customers.data";

// Per-seller data read from the session cookie; personal data, never cached.
export const dynamic = "force-dynamic";

/** Orders › Customers: one row per customer of a store, from its orders (ROADMAP.md F-01). */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <CustomersData storeId={typeof params.store === "string" ? params.store : null} />
      </Suspense>
    </div>
  );
}
