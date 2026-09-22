import { getAdminProducts, getProductFilterOptions } from "@/actions/products-list";
import type { RawSearchParams } from "../_components/data-table/search-params";
import { ProductsClient } from "./products.client";
import { parseProductsParams } from "./products.params";

const EMPTY_OPTIONS = { categories: [], brands: [], sellers: [] };

export async function ProductsPageData({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseProductsParams(await searchParams);
  // Sequential: the serverless DB pool is small (see pending-carts.data.tsx).
  const productsResult = await getAdminProducts(query);
  const optionsResult = await getProductFilterOptions();

  return (
    <div className="space-y-4">
      {!productsResult.success && (
        <p className="text-center text-red-600">
          {productsResult.error || "Failed to load products"}
        </p>
      )}
      <ProductsClient
        products={productsResult.success ? productsResult.data : []}
        totalCount={productsResult.success ? productsResult.totalCount : 0}
        pendingCount={productsResult.success ? productsResult.pendingCount : 0}
        filterOptions={optionsResult.success ? optionsResult.data : EMPTY_OPTIONS}
      />
    </div>
  );
}
