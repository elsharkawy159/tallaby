import AddProductMultiStep from "./add-product-multi-step";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; id?: string }>;
}

// Main page component
export default async function AddProductPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const isEditMode =
    resolvedSearchParams.page === "edit" && resolvedSearchParams.id;
  const productId = resolvedSearchParams.id;

  // Fetch categories and brands in parallel
  const [categories, brands] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
  ]);
  console.log("categories", categories);
  console.log("brands", brands);
  // console.log("categories", categories);
  // console.log("brands", brands);
  // Handle errors
  // if (!categories.success || !brands.success) {

  // }

  // const categories: CategoryOption[] = categories.data || "";
  // const brands: BrandOption[] = brands.data || "";

  // Fetch product data if in edit mode
  let productData = null;
  if (isEditMode && productId) {
    // const productResult = await getProduct(productId);
    // if (productResult.success) {
    //   productData = productResult.data;
    // }
  }

  return (
    <AddProductMultiStep
      categories={categories.data as any}
      brands={brands.data as any}
      isEditMode={!!isEditMode}
      productId={productId}
      initialData={productData}
    />
  );
}

// Metadata for the page
export const metadata = {
  title: "Add New Product | Dashboard",
  description: "Create a new product listing for your store",
};
