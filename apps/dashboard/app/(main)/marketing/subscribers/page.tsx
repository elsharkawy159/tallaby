import { Suspense } from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";
import { SubscribersData } from "./subscribers.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
