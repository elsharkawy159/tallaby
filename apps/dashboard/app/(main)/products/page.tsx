import React, { Suspense } from "react";
import { VendorProductsData } from "./_components/vendor-products.data";
import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";
import { PageContainer } from "@/components/seller-ui";

// Force dynamic rendering since this page uses cookies for authentication

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <PageContainer>
      <Suspense fallback={<VendorProductsSkeleton />}>
        <VendorProductsData searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
