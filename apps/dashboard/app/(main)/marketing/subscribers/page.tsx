import { Suspense } from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";
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
    <PageContainer>
      <Suspense fallback={<Skeleton className="h-48 rounded-[24px]" />}>
        <SubscribersData
          storeId={one(params.store)}
          query={one(params.q)}
          status={one(params.status)}
          page={one(params.page)}
        />
      </Suspense>
    </PageContainer>
  );
}
