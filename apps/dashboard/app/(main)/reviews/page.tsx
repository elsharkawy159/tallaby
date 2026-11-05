import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { VendorReviewsData } from "./vendor-reviews.data";
import { VendorReviewsSkeleton } from "./reviews.chunks";

export default function ReviewsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<VendorReviewsSkeleton />}>
        <VendorReviewsData />
      </Suspense>
    </PageContainer>
  );
}
