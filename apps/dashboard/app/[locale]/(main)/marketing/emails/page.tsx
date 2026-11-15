import { Suspense } from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";
import { EmailCampaignsData } from "./email-campaigns.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// "Send now" keeps sending in after() for up to 4 minutes.
export const maxDuration = 300;

/** Marketing › Email campaigns: store emails to customers and subscribers, plus win-back (ROADMAP.md F-16a, F-16e). */
export default async function EmailCampaignsPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const params = await searchParams;
  return (
    <PageContainer>
      <Suspense fallback={<Skeleton className="h-48 rounded-[24px]" />}>
        <EmailCampaignsData storeId={typeof params.store === "string" ? params.store : null} />
      </Suspense>
    </PageContainer>
  );
}
