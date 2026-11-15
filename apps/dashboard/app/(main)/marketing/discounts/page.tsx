import { Suspense } from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";
import { DiscountRulesData } from "./discount-rules.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Marketing › Automatic discounts: store-wide rules with no code (ROADMAP.md F-13a). */
export default async function DiscountRulesPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const params = await searchParams;
  return (
    <PageContainer narrow>
      <Suspense fallback={<Skeleton className="h-48 rounded-[24px]" />}>
        <DiscountRulesData storeId={typeof params.store === "string" ? params.store : null} />
      </Suspense>
    </PageContainer>
  );
}
