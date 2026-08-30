import { notFound } from "next/navigation";

import { getProductById } from "@/actions/products";
import { getAllBrands } from "@/actions/brands";
import { getAllCategories } from "@/actions/categories";
import { ProductForm } from "../../_components/form";
import { transformProductForForm } from "../../products.lib";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;

  const productResult = await getProductById(productId);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const [brandsResult, categoriesResult] = await Promise.all([
    getAllBrands({ limit: 1000 }),
    getAllCategories({ limit: 1000 }),
  ]);

  const brands =
    brandsResult.success && brandsResult.data
      ? brandsResult.data.map((brand) => ({
          label: brand.name ?? "Unknown",
          value: brand.id,
        }))
      : [];

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data.map((category) => ({
          label: category.name ?? "Unknown",
          value: category.id,
        }))
      : [];

  const initialData = transformProductForForm(productResult.data);

  return (
    <ProductForm
      initialData={initialData}
      isEditing={true}
      productId={productId}
      brands={brands}
      categories={categories}
    />
  );
}
