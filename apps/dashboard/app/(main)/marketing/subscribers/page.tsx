import { Suspense } from "react";
import { SubscribersData } from "./subscribers.data";

// Per-seller data read from the session cookie; personal data, never cached.
export const dynamic = "force-dynamic";

/** Marketing › Subscribers: newsletter sign-ups from the store's forms (ROADMAP.md F-16d). */
export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const one = (value: unknown) => (typeof value === "string" ? value : null);
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <SubscribersData
          storeId={one(params.store)}
          query={one(params.q)}
          status={one(params.status)}
          page={one(params.page)}
        />
      </Suspense>
    </div>
  );
}
