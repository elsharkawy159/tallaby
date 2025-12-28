"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, CheckCircle, Package, Star, Edit } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";
import type { Brand, Locale } from "../brands.types";
import {
  getBrandDisplayName,
  getBrandDisplaySlug,
  getBrandDisplayDescription,
  formatDate,
} from "../brands.lib";
import { BrandDialog } from "./brands.chunks";
import { Languages } from "lucide-react";

interface GetBrandsColumnsProps {
  locale: Locale;
  onStatusUpdate?: (
    brandId: string,
    field: "isVerified" | "isOfficial",
    value: boolean
  ) => void;
}

export function getBrandsColumns({
  locale,
  onStatusUpdate,
}: GetBrandsColumnsProps): ColumnDef<Brand>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Brand Name" />
      ),
      cell: ({ row }) => {
        const brand = row.original;
        const displayName = getBrandDisplayName(brand, locale);
        const displaySlug = getBrandDisplaySlug(brand, locale);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={brand.logoUrl || ""} />
              <AvatarFallback>
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{displayName}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {displaySlug}
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = getBrandDisplayDescription(row.original, locale);
        return (
          <div className="max-w-[300px] truncate">
            {description || "No description"}
          </div>
        );
      },
    },
    {
      accessorKey: "website",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Website" />
      ),
      cell: ({ row }) => {
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Products" />
      ),
      cell: ({ row }) => {
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rating" />
      ),
      cell: ({ row }) => {
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        return formatDate(row.original.createdAt);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const brand = row.original;

        return (
          <div className="flex justify-end gap-2">
            <BrandDialog
              mode="edit"
              brandId={brand.id}
              locale={locale}
              brandData={{
                name: brand.name,
                slug: brand.slug,
                logo_url: brand.logoUrl || "",
                description: brand.description || "",
                website: brand.website || "",
                isVerified: brand.isVerified || false,
                isOfficial: brand.isOfficial || false,
                locale: locale,
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
                {/* Create Arabic Version - only show if brand locale is 'en' or null */}
                {(!brand.locale || brand.locale === "en") && (
                  <BrandDialog
                    mode="create-arabic"
                    locale={locale}
                    sourceBrand={brand}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Languages className="h-4 w-4 mr-2" />
                        Create Arabic Version
                      </DropdownMenuItem>
                    }
                  />
                )}
                <DropdownMenuSeparator />
                {onStatusUpdate && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        onStatusUpdate(
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
                        onStatusUpdate(
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
