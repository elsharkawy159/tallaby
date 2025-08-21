import Pagination from "@/components/productsPage/Pagination";
import { ProductsFilter } from "@/components/productsPage/ProductsFilter";
import ProductsList from "@/components/productsPage/ProductsList";
import ProductsSorting from "@/components/productsPage/ProductsSorting";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { page, pageSize, search, categories, priceMin, priceMax } =
    resolvedSearchParams;

  return (
    <main className="container flex flex-col lg:flex-row md:gap-7 mx-auto py-10">
      <ProductsFilter />

      <div className="flex-1 space-y-6">
        <div className="flex justify-end">
          <ProductsSorting />
        </div>
        <ProductsList searchParams={resolvedSearchParams} />
      </div>
    </main>
  );
};

export default ProductsPage;
