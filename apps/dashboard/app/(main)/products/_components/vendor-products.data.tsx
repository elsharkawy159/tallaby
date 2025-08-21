import { getUser } from "@/actions/auth";
import { getVendorProducts } from "@/actions/vendor";
import { VendorProductsTable } from "./vendor-products.table";

export async function VendorProductsData() {
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Please log in to view your products
        </h2>
      </div>
    );
  }

  const { products, total } = await getVendorProducts(user.id, 1, 20);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <VendorProductsTable products={products} total={total} />
    </div>
  );
}
