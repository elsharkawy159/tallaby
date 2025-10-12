import React, { Suspense } from "react";
import { VendorProductsData } from "./_components/vendor-products.data";
import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";

// Force dynamic rendering since this page uses cookies for authentication

export default function ProductsPage() {
  return (
    <section className="p-6">
      <Suspense fallback={<VendorProductsSkeleton />}>
        <VendorProductsData />
      </Suspense>
    </section>
  );
}
