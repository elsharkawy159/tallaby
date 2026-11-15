import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { VendorReviewsData } from "./vendor-reviews.data";
import { VendorReviewsSkeleton } from "./reviews.chunks";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function ReviewsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<VendorReviewsSkeleton />}>
        <VendorReviewsData />
      </Suspense>
    </PageContainer>
  );
}
