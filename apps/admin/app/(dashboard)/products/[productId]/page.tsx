//@ts-ignore
//@ts-nocheck
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
// import { ProductInventoryTable } from "@/components/product-inventory-table";
// import { ProductReviewsTable } from "@/components/product-reviews-table";
import { ProductVariantsTable } from "../_components/product-variants-table";
import { ProductImagesGallery } from "../_components/product-images-gallery";
import { ProductReviewsTable } from "../_components/product-reviews-table";
import { ProductInventoryTable } from "../_components/product-inventory-table";

export default async function ProductDetailsPage() {
  //   {
  //   params,
  // }: {
  //   params: { productId: string };
  // }
  // const { productId } = await params;
  // const product = await getProductById(productId);
  const product = {
    id: 1,
    title: "Smartphone X Pro",
    slug: "smartphone-x-pro",
    description:
      "The ultimate smartphone with cutting-edge features. The X Pro comes with a stunning 6.7-inch Super Retina display, A16 Pro chip, an amazing camera system for incredible photos, and all-day battery life.",
    bulletPoints: [
      "6.7-inch Super Retina XDR display",
      "A16 Pro chip for lightning-fast performance",
      "Pro camera system with 48MP main camera",
      "Up to 29 hours of video playback",
      "Water and dust resistant (IP68)",
      "5G capable for ultra-fast downloads and streaming",
    ],
    basePrice: 999.99,
    listPrice: 1099.99,
    averageRating: 4.7,
    reviewCount: 256,
    brand: {
      id: "brand_01",
      name: "TechBrand",
      slug: "techbrand",
    },
    mainCategory: {
      id: "cat_01",
      name: "Electronics",
      slug: "electronics",
    },
    categories: [
      {
        id: "cat_01",
        name: "Electronics",
        slug: "electronics",
      },
      {
        id: "cat_08",
        name: "Smartphones",
        slug: "smartphones",
      },
    ],
    status: "active",
    isAdult: false,
    isPlatformChoice: true,
    isBestSeller: true,
    metaTitle: "Smartphone X Pro - Ultimate Performance | TechBrand",
    metaDescription:
      "Discover the Smartphone X Pro with 6.7-inch display, A16 Pro chip, pro camera system, and all-day battery life. Buy now with free shipping.",
    inventorySummary: {
      totalVariants: 8,
      totalQuantity: 125,
      lowStock: 2,
      outOfStock: 1,
    },
    salesSummary: {
      totalSales: 1247,
      revenue: 1246875.53,
      lastMonthSales: 142,
      lastMonthRevenue: 141998.58,
    },
    createdAt: "2023-10-15T10:30:00Z",
    updatedAt: "2023-10-20T14:25:00Z",
    recentViews: 1423,
    conversionRate: 3.2,
  };

  if (!product) {
    notFound();
  }

  return (
    <>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/withAuth/dashboard">
              <HomeIcon className="h-4 w-4 mr-2" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/withAuth/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{product.title}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
          <Link href={`/withAuth/products/${product.id}/edit`}>
            <Button variant="outline">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button>
            <Eye className="h-4 w-4 mr-2" />
            View on Site
          </Button>
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
                <div>
                  <h3 className="text-sm font-medium mb-2">Brand</h3>
                  <Link href={`/withAuth/brands/${product.brand.id}`}>
                    <p className="text-sm text-blue-600 hover:underline">
                      {product.brand.name}
                    </p>
                  </Link>
                </div>
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

              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-500">{product.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Features</h3>
                <ul className="list-disc text-sm text-gray-500 pl-5 space-y-1">
                  {product.bulletPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>

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
                <p className="text-sm text-gray-500">{product.metaTitle}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Meta Description</h3>
                <p className="text-sm text-gray-500">
                  {product.metaDescription}
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
