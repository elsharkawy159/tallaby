import { Suspense } from "react";
import { CouponsData } from "./_components/coupons.data";
import { CouponsSkeleton } from "./_components/coupons.skeleton";

export default function CouponsPage() {
  return (
    <section className="p-4 sm:p-6">
      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsData />
      </Suspense>
    </section>
  );
}
