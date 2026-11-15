import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { CouponsData } from "./_components/coupons.data";
import { CouponsSkeleton } from "./_components/coupons.skeleton";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function CouponsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsData />
      </Suspense>
    </PageContainer>
  );
}
