"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  CheckCircle,
  ShoppingBag,
  Star,
  Package,
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

import { TableSection } from "@workspace/ui/components/table-section";
import { BrandDialog } from "./brands.chunks";
import {
  getAllBrands,
  deleteBrands,
  updateBrandStatus,
} from "@/actions/brands";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  isVerified: boolean | null;
  isOfficial: boolean | null;
  averageRating: number | null;
  reviewCount: number | null;
  productCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RowProps {
  row: {
    original: Brand;
  };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    official: 0,
    avgRating: 0,
  });

  // Fetch brands data
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const result = await getAllBrands();

        if (result.success && result.data) {
          setBrands(result.data);

          // Calculate stats
          const total = result.data.length;
          const verified = result.data.filter(
            (b) => b.isVerified === true
          ).length;
          const official = result.data.filter(
            (b) => b.isOfficial === true
          ).length;
          const avgRating =
            result.data.reduce((sum, b) => sum + (b.averageRating || 0), 0) /
            total;

          setStats({ total, verified, official, avgRating });
        } else {
          toast.error(result.error || "Failed to fetch brands");
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast.error("Failed to fetch brands");
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleDeleteSelected = async (ids: string[]) => {
    try {
      const result = await deleteBrands(ids);

      if (result.success) {
        toast.success(`${ids.length} brand(s) deleted successfully`);
        // Refresh the brands list
        const refreshResult = await getAllBrands();
        if (refreshResult.success && refreshResult.data) {
          setBrands(refreshResult.data);
        }
      } else {
        toast.error(result.error || "Failed to delete brands");
      }
    } catch (error) {
      console.error("Error deleting brands:", error);
      toast.error("Failed to delete brands");
    }
  };

  const handleStatusUpdate = async (
    brandId: string,
    field: "isVerified" | "isOfficial",
    value: boolean
  ) => {
    try {
      const result = await updateBrandStatus(brandId, { [field]: value });

      if (result.success) {
        toast.success(
          `Brand ${field === "isVerified" ? "verification" : "official status"} updated`
        );
        // Update local state
        setBrands((prev) =>
          prev.map((brand) =>
            brand.id === brandId ? { ...brand, [field]: value } : brand
          )
        );
      } else {
        toast.error(result.error || "Failed to update brand status");
      }
    } catch (error) {
      console.error("Error updating brand status:", error);
      toast.error("Failed to update brand status");
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Brand Name",
      cell: ({ row }: RowProps) => {
        const brand = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={brand.logoUrl || ""} />
              <AvatarFallback>
                {brand.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{brand.name}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {brand.slug}
                {brand.isVerified === true && (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                )}
                {brand.isOfficial === true && (
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
      accessorKey: "description",
      header: "Description",
      cell: ({ row }: RowProps) => {
        return (
          <div className="max-w-[300px] truncate">
            {row.original.description || "No description"}
          </div>
        );
      },
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }: RowProps) => {
        const website = row.original.website;
        if (!website) return <span className="text-gray-400">No website</span>;

        return (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {website.replace(/^https?:\/\//, "")}
          </a>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }: RowProps) => {
        return (
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4 text-gray-500" />
            <span>{row.original.productCount || 0}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "averageRating",
      header: "Rating",
      cell: ({ row }: RowProps) => {
        const rating = row.original.averageRating;
        if (!rating) return <span className="text-gray-400">No rating</span>;

        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-gray-500">
              ({row.original.reviewCount || 0})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: RowProps) => {
        return row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "N/A";
      },
    },
    {
      id: "actions",
      cell: ({ row }: RowProps) => {
        const brand = row.original;

        return (
          <div className="flex justify-end gap-2">
            <BrandDialog
              mode="edit"
              brandId={brand.id}
              brandData={{
                name: brand.name,
                slug: brand.slug,
                logoUrl: brand.logoUrl || "",
                description: brand.description || "",
                website: brand.website || "",
                isVerified: brand.isVerified || false,
                isOfficial: brand.isOfficial || false,
              }}
            />

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
                  <a
                    href={`/withAuth/products?brand=${brand.id}`}
                    className="w-full"
                  >
                    View products
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusUpdate(
                      brand.id,
                      "isVerified",
                      !(brand.isVerified === true)
                    )
                  }
                >
                  {brand.isVerified === true
                    ? "Unverify brand"
                    : "Verify brand"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusUpdate(
                      brand.id,
                      "isOfficial",
                      !(brand.isOfficial === true)
                    )
                  }
                >
                  {brand.isOfficial === true
                    ? "Remove official status"
                    : "Mark as official"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
            <p className="text-muted-foreground">
              Manage product brands and manufacturers
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage product brands and manufacturers
          </p>
        </div>
        <BrandDialog mode="create" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-gray-500" />
              Total Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All brands</p>
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
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? Math.round((stats.verified / stats.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-gray-500" />
              Official Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.official}</div>
            <p className="text-xs text-muted-foreground">Official partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-500" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Across all brands</p>
          </CardContent>
        </Card>
      </div>

      {/* Brands Table */}
      <TableSection
        rows={brands}
        columns={columns}
        title="Brands"
        onDeleteSelected={handleDeleteSelected}
        searchColumnId="name"
        buttons={<BrandDialog mode="create" />}
      />
    </div>
  );
}
