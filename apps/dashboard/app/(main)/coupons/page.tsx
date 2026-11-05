import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { CouponsData } from "./_components/coupons.data";
import { CouponsSkeleton } from "./_components/coupons.skeleton";

export default function CouponsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsData />
      </Suspense>
    </PageContainer>
  );
}
