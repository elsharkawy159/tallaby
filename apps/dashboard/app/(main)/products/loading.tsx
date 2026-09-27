import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";

export default function Loading() {
  return (
    <section className="p-4 sm:p-6">
      <VendorProductsSkeleton />
    </section>
  );
}
