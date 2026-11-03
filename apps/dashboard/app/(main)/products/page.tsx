import React, { Suspense } from "react";
import { VendorProductsData } from "./_components/vendor-products.data";
import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";

// Force dynamic rendering since this page uses cookies for authentication

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <section className="p-4 sm:p-6">
      <Suspense fallback={<VendorProductsSkeleton />}>
        <VendorProductsData searchParams={params} />
      </Suspense>
    </section>
  );
}
