import { Suspense } from "react";
import { StoresData } from "./stores.data";
import { StoresSkeleton } from "./stores.skeleton";

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  return (
    <section className="p-4 sm:p-6">
      <Suspense fallback={<StoresSkeleton />}>
        <StoresData openCreate={create === "1"} />
      </Suspense>
    </section>
  );
}
