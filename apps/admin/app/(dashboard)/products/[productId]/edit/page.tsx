import { notFound } from "next/navigation";

import { getProductById } from "@/actions/products";
import { getAllBrands } from "@/actions/brands";
import { getAllCategories } from "@/actions/categories";
import { ProductForm } from "../../_components/form";
import type { z } from "zod";
import { productSchema } from "../../../_lib/validations/product-schema";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

type ProductFormData = z.infer<typeof productSchema>;

function transformProductToFormData(
  product: NonNullable<Awaited<ReturnType<typeof getProductById>>["data"]>
): Partial<ProductFormData> {
  // Parse price from JSONB
  const priceData = product.price as
    | { base?: number | string; list?: number | string }
    | number
    | null
    | undefined;

  const basePrice =
    typeof priceData === "object" && priceData?.base
      ? parseFloat(String(priceData.base))
      : typeof priceData === "number"
        ? priceData
        : 0;

  const listPrice =
    typeof priceData === "object" && priceData?.list
      ? parseFloat(String(priceData.list))
      : undefined;

  // Parse SEO from JSONB
  const seoData = product.seo as
    | {
        title?: string;
        description?: string;
        keywords?: string;
        searchKeywords?: string;
      }
    | null
    | undefined;

  const metaTitle =
    typeof seoData === "object" && seoData ? seoData.title : undefined;
  const metaDescription =
    typeof seoData === "object" && seoData ? seoData.description : undefined;
  const metaKeywords =
    typeof seoData === "object" && seoData ? seoData.keywords : undefined;
  const searchKeywords =
    typeof seoData === "object" && seoData ? seoData.searchKeywords : undefined;

  // Parse bulletPoints from JSONB
  const bulletPoints = Array.isArray(product.bulletPoints)
    ? (product.bulletPoints as string[])
    : [];

  return {
    title: product.title,
    slug: product.slug,
    description: product.description || undefined,
    bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
    brandId: product.brandId || "",
    categoryId: product.categoryId,
    basePrice,
    listPrice,
    isActive: product.isActive || false,
    isPlatformChoice: product.isPlatformChoice || false,
    isBestSeller: product.isMostSelling || false,
    taxClass: product.taxClass || "standard",
    metaTitle,
    metaDescription,
    metaKeywords,
    searchKeywords,
    locale: "en", // Default locale, can be enhanced later
  };
}

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;

  // Fetch product data
  const productResult = await getProductById(productId);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  // Fetch brands and categories for dropdowns
  const [brandsResult, categoriesResult] = await Promise.all([
    getAllBrands({ limit: 1000 }),
    getAllCategories({ limit: 1000 }),
  ]);

  const brands =
    brandsResult.success && brandsResult.data
      ? brandsResult.data.map((brand) => ({
          label: brand.name,
          value: brand.id,
        }))
      : [];

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data.map((category) => ({
          label: category.name,
          value: category.id,
        }))
      : [];

  const initialData = transformProductToFormData(productResult.data);

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
