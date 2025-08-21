import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/app/actions/products";
import Pagination from "./Pagination";

const ProductsList = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const result = await getProducts(searchParams);
  console.log("result", result);
  return (
    <section className="space-y-6 w-full">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.title}
            slug={product.slug}
            price={Number(product.base_price)}
            rating={product.average_rating || 0}
            reviewCount={product.review_count || 0}
            image={product.images as string[]}
            brand={product.brand?.name || ""}
            feature=""
            model=""
          />
        ))}
      </div>
      <Pagination
        page={1}
        pageSize={20}
        total={result.total}
        totalPages={result.totalPages}
      />
    </section>
  );
};

export default ProductsList;
