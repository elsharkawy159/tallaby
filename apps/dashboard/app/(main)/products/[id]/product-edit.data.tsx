import { getProduct } from "@/actions/products";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";
import { ProductEditForm } from "./product-edit-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export async function ProductEditData({ productId }: { productId: string }) {
  // Fetch product data, categories, and brands in parallel
  const [productResult, categoriesResult, brandsResult] = await Promise.all([
    getProduct(productId),
    getAllCategories(),
    getAllBrands(),
  ]);

  // Handle product fetch errors
  if (!productResult.success || !productResult.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">
            Failed to load product. {productResult.error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle categories/brands fetch errors
  if (!categoriesResult.success || !brandsResult.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">
            Failed to load required data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const product = productResult.data as any;
  const categories = categoriesResult.data as any;
  const brands = brandsResult.data as any;

  // Transform product data to match form schema
  const initialData = {
    title: product.title || "",
    slug: product.slug || "",
    description: product.description || "",
    bulletPoints: product.bulletPoints || [],
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    sku: product.sku || "",
    quantity: product.quantity || 0,
    maxOrderQuantity: product.maxOrderQuantity || undefined,
    dimensions: product.dimensions || {
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined,
      unit: "cm",
      weightUnit: "kg",
    },
    images: product.images || [],
    price: product.price || {
      base: 0,
      list: 0,
      discountValue: undefined,
      discountType: "percent",
      final: 0,
    },
    condition: product.condition || "new",
    conditionDescription: product.conditionDescription || "",
    fulfillmentType: product.fulfillmentType || "seller_fulfilled",
    handlingTime: product.handlingTime || 1,
    isActive: product.isActive ?? true,
    isPlatformChoice: product.isPlatformChoice ?? false,
    isMostSelling: product.isMostSelling ?? false,
    isFeatured: product.isFeatured ?? false,
    taxClass: product.taxClass || "standard",
    seo: product.seo || {
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      searchKeywords: "",
    },
    notes: product.notes || "",
    variants: product.productVariants || [],
  };

  return (
    <ProductEditForm
      productId={productId}
      initialData={initialData}
      categories={categories}
      brands={brands}
    />
  );
}
