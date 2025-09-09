import { VendorReviewsSkeleton } from "./reviews.chunks";

export default function Loading() {
  return (
    <div className="min-h-screen p-6">
      <VendorReviewsSkeleton />
    </div>
  );
}
