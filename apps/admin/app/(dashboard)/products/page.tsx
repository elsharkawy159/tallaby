import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import type { RawSearchParams } from "../_components/data-table/search-params";
import { ProductsPageData } from "./products.data";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProductsPageData searchParams={searchParams} />
    </Suspense>
  );
}
