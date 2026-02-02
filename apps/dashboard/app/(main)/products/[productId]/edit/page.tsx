import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/actions/products";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";
import { EditProduct } from "./edit-product";
import { buildEditDefaultValues } from "./edit-product.lib";
import type { CategoryOption, BrandOption } from "../../add/add-product.schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Product | Dashboard",
  description: "Edit your product listing",
};

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  const [productResult, categoriesRes, brandsRes] = await Promise.all([
    getProduct(productId),
    getAllCategories(),
    getAllBrands(),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;
  const categories = (categoriesRes.data || []) as CategoryOption[];
  const brands = (brandsRes.data || []) as BrandOption[];
  const defaultValues = buildEditDefaultValues(
    product as Parameters<typeof buildEditDefaultValues>[0]
  );

  return (
    <EditProduct
      productId={productId}
      defaultValues={defaultValues}
      categories={categories}
      brands={brands}
    />
  );
}
