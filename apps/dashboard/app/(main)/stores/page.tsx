import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { StoresData } from "./stores.data";
import { StoresSkeleton } from "./stores.skeleton";

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  return (
    <PageContainer>
      <Suspense fallback={<StoresSkeleton />}>
        <StoresData openCreate={create === "1"} />
      </Suspense>
    </PageContainer>
  );
}
