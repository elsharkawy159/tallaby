import ProductsFilterWrapper from "@/app/(main)/products/_components/ProductsFilterWrapper";
import ProductsList from "@/app/(main)/products/_components/ProductsList";
import ProductsSorting from "@/app/(main)/products/_components/ProductsSorting";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;

  return (
    <>
      <DynamicBreadcrumb />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <ProductsFilterWrapper />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Mobile Filters and Sorting */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Mobile filter button */}
              <div className="lg:hidden w-full sm:w-auto">
                <ProductsFilterWrapper />
              </div>

              {/* Sorting */}
              <div className="w-full sm:w-auto flex justify-end">
                <ProductsSorting />
              </div>
            </div>

            {/* Products Grid - Responsive columns */}
            <ProductsList searchParams={resolvedSearchParams} />
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductsPage;
