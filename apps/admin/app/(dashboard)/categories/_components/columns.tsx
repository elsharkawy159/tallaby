//@ts-ignore
//@ts-nocheck
"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  FolderTree,
  Tag,
  EyeOff,
  Eye,
  Edit,
  FolderPlus,
  Trash,
  Menu,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";
import { getPublicUrl } from "@/lib/utils";
import type { Category } from "../categories.types";

export function getCategoriesColumns(): ColumnDef<Category>[] {
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
        <DataTableColumnHeader column={column} title="Category Name" />
      ),
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-3">
            {category.imageUrl ? (
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={getPublicUrl(category.imageUrl, "categories")}
                  alt={category.name || "Category"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <FolderTree className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                <FolderTree className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <div>
              <Link
                href={`/withAuth/categories/${category.id}`}
                className="font-medium hover:underline flex items-center"
              >
                {category.name || "Unnamed Category"}
                {category.level === 1 && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    Main
                  </Badge>
                )}
              </Link>
              <div className="text-xs text-gray-500">
                {category.slug || "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "level",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Level" />
      ),
      cell: ({ row }) => {
        const level = row.getValue("level");
        const levelNum = level ? parseInt(String(level)) : 0;
        const levelLabels = ["", "Main", "Sub", "Deep", "Leaf"];

        return (
          <Badge variant="outline">
            Level {levelNum}{" "}
            {levelLabels[levelNum] ? `(${levelLabels[levelNum]})` : ""}
          </Badge>
        );
      },
    },
    {
      accessorKey: "parentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parent Category" />
      ),
      cell: ({ row }) => {
        const parentId = row.getValue("parentId");

        if (!parentId) {
          return <div className="text-gray-500">—</div>;
        }

        // This would require looking up the parent category from your data
        // For simplicity, we'll try to find it from a global categories array
        if (typeof window !== "undefined" && window.__categoriesData) {
          const parent = window.__categoriesData.find((c) => c.id === parentId);
          if (parent) {
            return (
              <Link
                href={`/withAuth/categories/${parentId}`}
                className="text-blue-600 hover:underline"
              >
                {parent.name}
              </Link>
            );
          }
        }

        return (
          <Link
            href={`/withAuth/categories/${parentId}`}
            className="text-blue-600 hover:underline"
          >
            View Parent
          </Link>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Products" />
      ),
      cell: ({ row }) => {
        const count = row.getValue("productCount");
        const countNum = count ? Number(count) : 0;

        return <div className="text-center font-medium">{countNum}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;

        return (
          <div className="flex justify-end">
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
                    href={`/withAuth/categories/${category.id}`}
                    className="w-full flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/categories/${category.id}/edit`}
                    className="w-full flex items-center"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit category
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/products?category=${category.id}`}
                    className="w-full flex items-center"
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    View products
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/categories/create?parentId=${category.id}`}
                    className="w-full flex items-center"
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add subcategory
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {category.isActive ? (
                  <DropdownMenuItem className="text-amber-600">
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-green-600">
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
