import { Suspense } from "react";
import { VendorReviewsData } from "./vendor-reviews.data";
import { VendorReviewsSkeleton } from "./reviews.chunks";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen p-6">
      <Suspense fallback={<VendorReviewsSkeleton />}>
        <VendorReviewsData />
      </Suspense>
    </div>
  );
}
