import { CouponsSkeleton } from "./_components/coupons.skeleton";

export default function Loading() {
  return (
    <section className="p-4 sm:p-6">
      <CouponsSkeleton />
    </section>
  );
}
