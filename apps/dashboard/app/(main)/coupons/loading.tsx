import { PageContainer } from "@/components/seller-ui";
import { CouponsSkeleton } from "./_components/coupons.skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <CouponsSkeleton />
    </PageContainer>
  );
}
