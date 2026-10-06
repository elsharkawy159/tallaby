import { notFound } from "next/navigation";

import { getProductById } from "@/actions/products";
import { getProductFormOptions } from "@/actions/products-list";
import { ProductForm } from "../../_components/form";
import { getStorefrontBaseUrl, transformProductForForm } from "../../products.lib";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;

  // Sequential: the serverless DB pool is small (see products.data.tsx).
  const productResult = await getProductById(productId);
  if (!productResult.success || !productResult.data) {
    notFound();
  }
  const optionsResult = await getProductFormOptions();

  return (
    <ProductForm
      productId={productId}
      initialData={transformProductForForm(productResult.data)}
      brands={optionsResult.success ? optionsResult.data.brands : []}
      categories={optionsResult.success ? optionsResult.data.categories : []}
      storefrontBaseUrl={getStorefrontBaseUrl()}
    />
  );
}
