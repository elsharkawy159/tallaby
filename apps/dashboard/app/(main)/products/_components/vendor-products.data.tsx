
import { getVendorProducts } from "@/actions/vendor";
import { VendorProductsTable } from "./vendor-products.table";

export async function VendorProductsData() {

  const { products, total } = await getVendorProducts(1, 20);
console.log("products", products)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <VendorProductsTable products={products} total={total} />
    </div>
  );
}
