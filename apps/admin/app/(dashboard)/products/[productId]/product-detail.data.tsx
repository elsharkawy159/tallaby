import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
  PencilIcon,
  TagIcon,
  Star,
  Package,
  Eye,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { getProductById, getProductSalesSummary, repairProductRatingIfStale } from "@/actions/products";
import { ProductVariantsTable } from "../_components/product-variants-table";
import { ProductImagesGallery } from "../_components/product-images-gallery";
import { ProductReviewsTable } from "../_components/product-reviews-table";
import { ProductInventoryTable } from "../_components/product-inventory-table";
import {
  formatProductPrice,
  transformProductForDetail,
} from "../products.lib";
import { ProductDetailSkeleton } from "./product-detail.skeleton";

interface ProductDetailDataProps {
  productId: string;
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "rejected":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "secondary";
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.floor(rating)
              ? "text-yellow-400 fill-yellow-400"
              : i < rating
                ? "text-yellow-400 fill-yellow-400 opacity-50"
                : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function ProductRatingSummary({
  averageRating,
  reviewCount,
  totalReviewCount,
}: {
  averageRating: number;
  reviewCount: number;
  totalReviewCount: number;
}) {
  if (reviewCount === 0 && totalReviewCount === 0) {
    return (
      <>
        <div className="text-2xl font-bold text-muted-foreground">—</div>
        <p className="text-xs text-muted-foreground mt-1">No reviews yet</p>
      </>
    );
  }

  if (reviewCount === 0 && totalReviewCount > 0) {
    return (
      <>
        <div className="text-2xl font-bold text-muted-foreground">—</div>
        <p className="text-xs text-muted-foreground mt-1">
          No published reviews · {totalReviewCount} awaiting moderation
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center">
        <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
        <div className="ml-2">
          <RatingStars rating={averageRating} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {reviewCount} published review{reviewCount === 1 ? "" : "s"}
        {totalReviewCount > reviewCount
          ? ` · ${totalReviewCount} total including pending`
          : ""}
      </p>
    </>
  );
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <>
      {label}
      <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
    </>
  );
}

async function ProductDetailContent({ productId }: ProductDetailDataProps) {
  await repairProductRatingIfStale(productId);

  const [productResult, salesResult] = await Promise.all([
    getProductById(productId),
    getProductSalesSummary(productId),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const salesSummary = salesResult.success
    ? salesResult.data!
    : {
        totalSales: 0,
        revenue: 0,
        lastMonthSales: 0,
        lastMonthRevenue: 0,
      };

  const product = transformProductForDetail(productResult.data, salesSummary);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={getStatusBadgeVariant(product.status)}>
              {product.status}
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
            {product.isFeatured && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                Featured
              </Badge>
            )}
            {product.isTrending && (
              <Badge
                variant="outline"
                className="bg-rose-50 text-rose-700 border-rose-200"
              >
                Trending Now
              </Badge>
            )}
            {product.isSeasonal && (
              <Badge
                variant="outline"
                className="bg-teal-50 text-teal-700 border-teal-200"
              >
                Seasonal
              </Badge>
            )}
            {product.freeDelivery && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Free Delivery
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
          {product.storefrontUrl ? (
            <Link href={product.storefrontUrl} target="_blank">
              <Button>
                <Eye className="h-4 w-4 mr-2" />
                View on Site
              </Button>
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled>
                      <Eye className="h-4 w-4 mr-2" />
                      View on Site
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Product slug is missing. Add a slug in the edit form.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
              {product.inventorySummary.lowStock} low stock,{" "}
              {product.inventorySummary.outOfStock} out of stock
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
            <div className="text-2xl font-bold">{product.salesSummary.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {product.salesSummary.lastMonthSales} last 30 days ·{" "}
              {formatProductPrice(product.salesSummary.revenue)} revenue
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
            <ProductRatingSummary
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
              totalReviewCount={product.totalReviewCount}
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">
            <TabLabel label="Variants" count={product.variants.length} />
          </TabsTrigger>
          <TabsTrigger value="images">
            <TabLabel label="Images" count={product.images.length} />
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <TabLabel label="Inventory" count={product.inventoryRows.length} />
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <TabLabel label="Reviews" count={product.totalReviewCount} />
          </TabsTrigger>
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
                  <p className="text-sm text-gray-500">{product.slug ?? "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">SKU</h3>
                  <p className="text-sm text-gray-500">{product.sku ?? "Not set"}</p>
                </div>
                {product.brand && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Brand</h3>
                    <Link href={`/products?brand=${product.brand.id}`}>
                      <p className="text-sm text-blue-600 hover:underline">
                        {product.brand.name}
                      </p>
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-2">Main Category</h3>
                  <Link href={`/products?category=${product.mainCategory.id}`}>
                    <p className="text-sm text-blue-600 hover:underline">
                      {product.mainCategory.name}
                    </p>
                  </Link>
                </div>
                {product.seller && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Seller</h3>
                    <Link href={`/sellers?seller=${product.seller.id}`}>
                      <p className="text-sm text-blue-600 hover:underline">
                        {product.seller.displayName ??
                          product.seller.businessName ??
                          "Unknown seller"}
                      </p>
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-2">Price</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {formatProductPrice(product.finalPrice)}
                      </p>
                      {product.listPrice && product.listPrice > product.finalPrice && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatProductPrice(product.listPrice)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Base: {formatProductPrice(product.basePrice)}
                    </p>
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

              <div>
                <h3 className="text-sm font-medium mb-2">Category</h3>
                <Link href={`/products?category=${product.mainCategory.id}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {product.mainCategory.name}
                  </Badge>
                </Link>
              </div>
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
                  Variants for this product. Edit variants on the product edit page.
                </CardDescription>
              </div>
              <Link href={`/products/${product.id}/edit`}>
                <Button size="sm" variant="outline">
                  Edit Variants
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ProductVariantsTable variants={product.variants} readOnly />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Product gallery images from the database.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductImagesGallery images={product.images} readOnly />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Current stock levels for this product and its variants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductInventoryTable rows={product.inventoryRows} readOnly />
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
              <ProductReviewsTable reviews={product.reviews} />
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
                  <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                  <div className="text-xs text-gray-500">
                    View analytics not connected
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Revenue</div>
                  <div className="text-2xl font-bold">
                    {formatProductPrice(product.salesSummary.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatProductPrice(product.salesSummary.lastMonthRevenue)} last 30
                    days
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">
                    Average Rating
                  </div>
                  {product.reviewCount > 0 ? (
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">
                        {product.averageRating.toFixed(1)}
                      </div>
                      <RatingStars rating={product.averageRating} />
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-muted-foreground">—</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {product.reviewCount > 0
                      ? `From ${product.reviewCount} published review${product.reviewCount === 1 ? "" : "s"}`
                      : product.totalReviewCount > 0
                        ? `${product.totalReviewCount} review${product.totalReviewCount === 1 ? "" : "s"} pending moderation`
                        : "No reviews yet"}
                    {" · "}
                    {product.salesSummary.totalSales} units sold
                  </div>
                </div>
              </div>

              <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Sales trend chart not available yet
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

export function ProductDetailData({ productId }: ProductDetailDataProps) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent productId={productId} />
    </Suspense>
  );
}
