import React, { Suspense } from "react";
import { VendorProductsData } from "./_components/vendor-products.data";
import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";
import { PageContainer } from "@/components/seller-ui";

/** Products of the store in the URL (ROADMAP.md F-87c slice 2); VendorProductsData checks it against the session. */
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  return (
    <PageContainer>
      <Suspense fallback={<VendorProductsSkeleton />}>
        <VendorProductsData storeId={storeId} searchParams={query} />
      </Suspense>
    </PageContainer>
  );
}
