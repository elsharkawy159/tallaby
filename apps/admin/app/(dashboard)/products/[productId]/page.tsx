import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Badge } from "@workspace/ui/components/badge";
import {
  HomeIcon,
  PencilIcon,
  TagIcon,
  Star,
  Package,
  Eye,
  ShoppingCart,
  BarChart3,
  ImageIcon,
} from "lucide-react";
import { ProductVariantsTable } from "../_components/product-variants-table";
import { ProductImagesGallery } from "../_components/product-images-gallery";
import { ProductReviewsTable } from "../_components/product-reviews-table";
import { ProductInventoryTable } from "../_components/product-inventory-table";
import { getProductById } from "@/actions/products";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

interface TransformedProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  bulletPoints: string[];
  basePrice: number;
  listPrice: number | null;
  averageRating: number;
  reviewCount: number;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  mainCategory: {
    id: string;
    name: string;
    slug: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  status: "active" | "inactive";
  isPlatformChoice: boolean;
  isBestSeller: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  inventorySummary: {
    totalVariants: number;
    totalQuantity: number;
    lowStock: number;
    outOfStock: number;
  };
  salesSummary: {
    totalSales: number;
    revenue: number;
    lastMonthSales: number;
    lastMonthRevenue: number;
  };
  createdAt: string;
  updatedAt: string;
  recentViews: number;
  conversionRate: number;
}

type ProductWithRelations = NonNullable<
  Awaited<ReturnType<typeof getProductById>>["data"]
>;

function transformProductData(
  product: ProductWithRelations
): TransformedProduct {
  // Parse price from JSONB
  type PriceData =
    | { base?: number | string; list?: number | string }
    | number
    | null
    | undefined;
  const priceData = product.price as PriceData;
  const basePrice =
    typeof priceData === "object" && priceData?.base
      ? parseFloat(String(priceData.base))
      : typeof priceData === "number"
        ? priceData
        : 0;

  const listPrice =
    typeof priceData === "object" && priceData?.list
      ? parseFloat(String(priceData.list))
      : null;

  // Parse SEO from JSONB
  type SeoData = { title?: string; description?: string } | null | undefined;
  const seoData = product.seo as SeoData;
  const metaTitle =
    typeof seoData === "object" && seoData ? seoData.title || null : null;
  const metaDescription =
    typeof seoData === "object" && seoData ? seoData.description || null : null;

  // Parse bulletPoints from JSONB
  const bulletPoints = Array.isArray(product.bulletPoints)
    ? (product.bulletPoints as string[])
    : [];

  // Compute inventory summary from variants
  const variants = product.productVariants || [];
  const totalVariants = variants.length;
  type Variant = { stock?: number | string | null };
  const totalQuantity = variants.reduce((sum: number, variant: Variant) => {
    return sum + (variant.stock ? parseInt(String(variant.stock), 10) : 0);
  }, 0);
  const lowStock = variants.filter((variant: Variant) => {
    const stock = variant.stock ? parseInt(String(variant.stock), 10) : 0;
    return stock > 0 && stock < 10;
  }).length;
  const outOfStock = variants.filter((variant: Variant) => {
    const stock = variant.stock ? parseInt(String(variant.stock), 10) : 0;
    return stock === 0;
  }).length;

  // Default sales summary (can be enhanced later with actual order data)
  const salesSummary = {
    totalSales: 0,
    revenue: 0,
    lastMonthSales: 0,
    lastMonthRevenue: 0,
  };

  // Handle brand (nullable)
  const brand = product.brand
    ? {
        id: product.brand.id,
        name: product.brand.name || "Unknown",
        slug: product.brand.slug || "",
      }
    : null;

  // Handle category
  const mainCategory = product.category
    ? {
        id: product.category.id,
        name: product.category.name || "Unknown",
        slug: product.category.slug || "",
      }
    : {
        id: "",
        name: "Uncategorized",
        slug: "",
      };

  // Categories array (using main category for now)
  const categories = product.category
    ? [
        {
          id: product.category.id,
          name: product.category.name || "Unknown",
          slug: product.category.slug || "",
        },
      ]
    : [];

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description || null,
    bulletPoints,
    basePrice,
    listPrice,
    averageRating: product.averageRating
      ? parseFloat(String(product.averageRating))
      : 0,
    reviewCount: product.reviewCount || 0,
    brand,
    mainCategory,
    categories,
    status: product.isActive ? "active" : "inactive",
    isPlatformChoice: product.isPlatformChoice || false,
    isBestSeller: product.isMostSelling || false,
    metaTitle,
    metaDescription,
    inventorySummary: {
      totalVariants,
      totalQuantity,
      lowStock,
      outOfStock,
    },
    salesSummary,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
    recentViews: 0, // Can be computed from analytics later
    conversionRate: 0, // Can be computed from analytics later
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { productId } = await params;

  const result = await getProductById(productId);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = transformProductData(result.data);

  // Guard clause for brand (if it's required in the UI)
  if (!product.brand) {
    // Still show the page, but handle brand display gracefully
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={product.status === "active" ? "default" : "secondary"}
            >
              {product.status === "active" ? "Active" : "Inactive"}
            </Badge>
            {product.isPlatformChoice && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Platform Choice
              </Badge>
            )}
            {product.isBestSeller && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                Best Seller
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link
            href={`https://www.tallaby.com/products/${product.slug}`}
            target="_blank"
          >
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              View on Site
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-500" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {product.inventorySummary.totalQuantity}
            </div>
            <p className="text-xs text-muted-foreground">
              {product.inventorySummary.totalVariants} variants,{" "}
              {product.inventorySummary.lowStock} low stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-gray-500" />
              Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {product.salesSummary.totalSales}
            </div>
            <p className="text-xs text-muted-foreground">
              {product.salesSummary.lastMonthSales} last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-gray-500" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                {product.averageRating.toFixed(1)}
              </div>
              <div className="ml-2 flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : i < product.averageRating
                          ? "text-yellow-400 fill-yellow-400 opacity-50"
                          : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {product.reviewCount} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Basic details and specifications of the product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Product ID</h3>
                  <p className="text-sm text-gray-500">{product.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Slug</h3>
                  <p className="text-sm text-gray-500">{product.slug}</p>
                </div>
                {product.brand && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Brand</h3>
                    <Link href={`/withAuth/brands/${product.brand.id}`}>
                      <p className="text-sm text-blue-600 hover:underline">
                        {product.brand.name}
                      </p>
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-2">Main Category</h3>
                  <Link
                    href={`/withAuth/categories/${product.mainCategory.id}`}
                  >
                    <p className="text-sm text-blue-600 hover:underline">
                      {product.mainCategory.name}
                    </p>
                  </Link>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Price</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(product.basePrice)}
                    </p>
                    {product.listPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(product.listPrice)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Created</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()} (
                    {new Date(product.createdAt).toLocaleTimeString()})
                  </p>
                </div>
              </div>

              {product.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-sm text-gray-500">{product.description}</p>
                </div>
              )}

              {product.bulletPoints.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Features</h3>
                  <ul className="list-disc text-sm text-gray-500 pl-5 space-y-1">
                    {product.bulletPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {product.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((category) => (
                      <Link
                        href={`/withAuth/categories/${category.id}`}
                        key={category.id}
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Information</CardTitle>
              <CardDescription>
                Search engine optimization details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Meta Title</h3>
                <p className="text-sm text-gray-500">
                  {product.metaTitle || "Not set"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Meta Description</h3>
                <p className="text-sm text-gray-500">
                  {product.metaDescription || "Not set"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>
                  Manage the different variants of this product.
                </CardDescription>
              </div>
              <Link href={`/withAuth/products/${product.id}/variants/create`}>
                <Button size="sm">Add Variant</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ProductVariantsTable productId={product.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Manage the product images and gallery.
                </CardDescription>
              </div>
              <Button size="sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </CardHeader>
            <CardContent>
              <ProductImagesGallery productId={product.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Manage inventory levels across different variants and sellers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductInventoryTable productId={product.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Reviews</CardTitle>
              <CardDescription>
                Customer reviews and ratings for this product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductReviewsTable productId={product.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for this product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">
                    Conversion Rate
                  </div>
                  <div className="text-2xl font-bold">
                    {product.conversionRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on {product.recentViews} views
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">
                    Revenue
                  </div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(product.salesSummary.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(product.salesSummary.lastMonthRevenue)}{" "}
                    last month
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">
                    Average Rating
                  </div>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold mr-2">
                      {product.averageRating.toFixed(1)}
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.averageRating)
                              ? "text-yellow-400 fill-yellow-400"
                              : i < product.averageRating
                                ? "text-yellow-400 fill-yellow-400 opacity-50"
                                : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    From {product.reviewCount} reviews
                  </div>
                </div>
              </div>

              <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Sales performance chart would display here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
