import AddProduct from "./add-product";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";
import type { CategoryOption, BrandOption } from "./add-product.schema";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

// Main page component
export default async function AddProductPage() {
  // Fetch categories and brands in parallel
  const [categories, brands] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
  ]);

  return (
    <AddProduct
      categories={(categories.data || []) as CategoryOption[]}
      brands={(brands.data || []) as BrandOption[]}
    />
  );
}

// Metadata for the page
export const metadata = {
  title: "Add New Product | Dashboard",
  description: "Create a new product listing for your store",
};
