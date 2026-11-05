import { PageContainer } from "@/components/seller-ui";
import { VendorReviewsSkeleton } from "./reviews.chunks";

export default function Loading() {
  return (
    <PageContainer>
      <VendorReviewsSkeleton />
    </PageContainer>
  );
}
