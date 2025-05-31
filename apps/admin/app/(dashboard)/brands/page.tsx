//@ts-ignore
//@ts-nocheck
"use client";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Plus,
  Filter,
  Download,
  UploadCloud,
  CheckCircle,
  ShoppingBag,
  Star,
  Package,
  Search,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTable } from "../_components/data-table/data-table";

// Mock data for demonstration
const brands = [
  {
    id: "brand_01",
    name: "TechBrand",
    slug: "techbrand",
    logoUrl: "/api/placeholder/100/100",
    description: "Leading manufacturer of high-quality electronics",
    website: "https://techbrand.example.com",
    isVerified: true,
    isOfficial: true,
    averageRating: 4.7,
    reviewCount: 856,
    productCount: 378,
    createdAt: "2022-08-15T10:30:00Z",
  },
  {
    id: "brand_02",
    name: "AudioTech",
    slug: "audiotech",
    logoUrl: "/api/placeholder/100/100",
    description: "Premium audio equipment and accessories",
    website: "https://audiotech.example.com",
    isVerified: true,
    isOfficial: true,
    averageRating: 4.6,
    reviewCount: 724,
    productCount: 215,
    createdAt: "2022-09-10T14:45:00Z",
  },
  {
    id: "brand_03",
    name: "FitWear",
    slug: "fitwear",
    logoUrl: "/api/placeholder/100/100",
    description: "Fitness apparel and accessories",
    website: "https://fitwear.example.com",
    isVerified: true,
    isOfficial: false,
    averageRating: 4.3,
    reviewCount: 478,
    productCount: 193,
    createdAt: "2022-11-05T09:15:00Z",
  },
  {
    id: "brand_04",
    name: "HomeTech",
    slug: "hometech",
    logoUrl: "/api/placeholder/100/100",
    description: "Smart home devices and solutions",
    website: "https://hometech.example.com",
    isVerified: true,
    isOfficial: true,
    averageRating: 4.5,
    reviewCount: 612,
    productCount: 167,
    createdAt: "2023-01-12T11:30:00Z",
  },
  {
    id: "brand_05",
    name: "PhotoTech",
    slug: "phototech",
    logoUrl: "/api/placeholder/100/100",
    description: "Photography equipment and accessories",
    website: "https://phototech.example.com",
    isVerified: true,
    isOfficial: false,
    averageRating: 4.8,
    reviewCount: 532,
    productCount: 128,
    createdAt: "2023-02-08T16:20:00Z",
  },
  {
    id: "brand_06",
    name: "GameTech",
    slug: "gametech",
    logoUrl: "/api/placeholder/100/100",
    description: "Gaming consoles, accessories, and software",
    website: "https://gametech.example.com",
    isVerified: true,
    isOfficial: true,
    averageRating: 4.7,
    reviewCount: 925,
    productCount: 243,
    createdAt: "2023-03-15T13:40:00Z",
  },
  {
    id: "brand_07",
    name: "WearTech",
    slug: "weartech",
    logoUrl: "/api/placeholder/100/100",
    description: "Wearable technology and smartwatches",
    website: "https://weartech.example.com",
    isVerified: false,
    isOfficial: false,
    averageRating: 4.2,
    reviewCount: 312,
    productCount: 87,
    createdAt: "2023-04-23T10:15:00Z",
  },
  {
    id: "brand_08",
    name: "KitchenPro",
    slug: "kitchenpro",
    logoUrl: "/api/placeholder/100/100",
    description: "Professional kitchen appliances and cookware",
    website: "https://kitchenpro.example.com",
    isVerified: true,
    isOfficial: false,
    averageRating: 4.4,
    reviewCount: 418,
    productCount: 156,
    createdAt: "2023-05-18T14:50:00Z",
  },
];

export default function BrandsPage() {
  const columns = [
    {
      accessorKey: "name",
      header: "Brand Name",
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={brand.logoUrl} />
              <AvatarFallback>{brand.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/withAuth/brands/${brand.id}`}
                className="font-medium hover:underline"
              >
                {brand.name}
              </Link>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {brand.slug}
                {brand.isVerified && (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                )}
                {brand.isOfficial && (
                  <Badge
                    variant="outline"
                    className="text-xs h-4 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Official
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => {
        const website = row.getValue("website") as string;
        return (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {website.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "")}
          </a>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }) => {
        return (
          <div className="text-center font-medium">
            {row.getValue("productCount")}
          </div>
        );
      },
    },
    {
      accessorKey: "averageRating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = parseFloat(row.getValue("averageRating"));
        const reviews = row.original.reviewCount;

        return (
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="ml-1 font-medium">{rating.toFixed(1)}</span>
            </div>
            <div className="text-xs text-gray-500">{reviews} reviews</div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const brand = row.original;

        return (
          <div className="flex justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/brands/${brand.id}`}
                    className="w-full"
                  >
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/brands/${brand.id}/edit`}
                    className="w-full"
                  >
                    Edit brand
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/products?brand=${brand.id}`}
                    className="w-full"
                  >
                    View products
                  </Link>
                </DropdownMenuItem>
                {!brand.isVerified ? (
                  <DropdownMenuItem>Verify brand</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>Unverify brand</DropdownMenuItem>
                )}
                {!brand.isOfficial ? (
                  <DropdownMenuItem>Mark as official</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>Remove official status</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Delete brand
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage product brands and manufacturers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <UploadCloud className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Link href="/withAuth/brands/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-gray-500" />
              Total Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
              Verified Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.filter((b) => b.isVerified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (brands.filter((b) => b.isVerified).length / brands.length) *
                  100
              )}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-gray-500" />
              Avg. Brand Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                brands.reduce((sum, brand) => sum + brand.averageRating, 0) /
                brands.length
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Across all brands</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-500" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.reduce((sum, brand) => sum + brand.productCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all brands</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-medium">Search Brands</h2>
            <p className="text-sm text-gray-500">
              Find brands by name, website, or description
            </p>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search brands..."
                className="pl-8"
              />
            </div>
            <Button variant="outline">Search</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all-brands">
        <TabsList>
          <TabsTrigger value="all-brands">All Brands</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="official">Official</TabsTrigger>
          <TabsTrigger value="unverified">Unverified</TabsTrigger>
        </TabsList>
        <TabsContent value="all-brands" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={brands}
            searchableColumns={[
              {
                id: "name",
                title: "Brand Name",
              },
              {
                id: "website",
                title: "Website",
              },
            ]}
            filterableColumns={[
              {
                id: "isVerified",
                title: "Verification",
                options: [
                  { label: "Verified", value: "true" },
                  { label: "Unverified", value: "false" },
                ],
              },
              {
                id: "isOfficial",
                title: "Status",
                options: [
                  { label: "Official", value: "true" },
                  { label: "Unofficial", value: "false" },
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="verified" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={brands.filter((brand) => brand.isVerified)}
            searchableColumns={[
              {
                id: "name",
                title: "Brand Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="official" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={brands.filter((brand) => brand.isOfficial)}
            searchableColumns={[
              {
                id: "name",
                title: "Brand Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="unverified" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={brands.filter((brand) => !brand.isVerified)}
            searchableColumns={[
              {
                id: "name",
                title: "Brand Name",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
