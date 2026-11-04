import { Suspense } from "react";
import { DiscountRulesData } from "./discount-rules.data";

// Per-seller data read from the session cookie; never cached.
export const dynamic = "force-dynamic";

/** Marketing › Automatic discounts: store-wide rules with no code (ROADMAP.md F-13a). */
export default async function DiscountRulesPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const params = await searchParams;
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <DiscountRulesData storeId={typeof params.store === "string" ? params.store : null} />
      </Suspense>
    </div>
  );
}
