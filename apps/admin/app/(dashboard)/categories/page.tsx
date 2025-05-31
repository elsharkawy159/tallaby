"use client";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Plus, FolderTree, Tag, RefreshCw } from "lucide-react";
import { DataTable } from "../_components/data-table/data-table";
import { getCategoriesColumns } from "./_components/columns";

// Mock data for demonstration
const categories = [
  {
    id: "cat_01",
    name: "Electronics",
    slug: "electronics",
    parentId: null,
    description: "Electronic devices and gadgets",
    level: 1,
    imageUrl: "/api/placeholder/200/200",
    productCount: 1245,
    isActive: true,
    showInMenu: true,
    displayOrder: 1,
    createdAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "cat_02",
    name: "Smartphones",
    slug: "smartphones",
    parentId: "cat_01",
    description: "Mobile phones and accessories",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 458,
    isActive: true,
    showInMenu: true,
    displayOrder: 1,
    createdAt: "2023-01-15T10:45:00Z",
  },
  {
    id: "cat_03",
    name: "Laptops",
    slug: "laptops",
    parentId: "cat_01",
    description: "Notebook computers and accessories",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 325,
    isActive: true,
    showInMenu: true,
    displayOrder: 2,
    createdAt: "2023-01-15T11:00:00Z",
  },
  {
    id: "cat_04",
    name: "Tablets",
    slug: "tablets",
    parentId: "cat_01",
    description: "Tablet computers and accessories",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 189,
    isActive: true,
    showInMenu: true,
    displayOrder: 3,
    createdAt: "2023-01-15T11:15:00Z",
  },
  {
    id: "cat_05",
    name: "Wearables",
    slug: "wearables",
    parentId: "cat_01",
    description: "Smartwatches and fitness trackers",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 173,
    isActive: true,
    showInMenu: true,
    displayOrder: 4,
    createdAt: "2023-01-15T11:30:00Z",
  },
  {
    id: "cat_06",
    name: "Audio",
    slug: "audio",
    parentId: "cat_01",
    description: "Headphones, earbuds, and speakers",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 214,
    isActive: true,
    showInMenu: true,
    displayOrder: 5,
    createdAt: "2023-01-15T11:45:00Z",
  },
  {
    id: "cat_07",
    name: "Clothing",
    slug: "clothing",
    parentId: null,
    description: "Apparel and fashion items",
    level: 1,
    imageUrl: "/api/placeholder/200/200",
    productCount: 932,
    isActive: true,
    showInMenu: true,
    displayOrder: 2,
    createdAt: "2023-01-16T09:30:00Z",
  },
  {
    id: "cat_08",
    name: "Men's Clothing",
    slug: "mens-clothing",
    parentId: "cat_07",
    description: "Clothing for men",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 412,
    isActive: true,
    showInMenu: true,
    displayOrder: 1,
    createdAt: "2023-01-16T09:45:00Z",
  },
  {
    id: "cat_09",
    name: "Women's Clothing",
    slug: "womens-clothing",
    parentId: "cat_07",
    description: "Clothing for women",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 520,
    isActive: true,
    showInMenu: true,
    displayOrder: 2,
    createdAt: "2023-01-16T10:00:00Z",
  },
  {
    id: "cat_10",
    name: "Books",
    slug: "books",
    parentId: null,
    description: "Books and publications",
    level: 1,
    imageUrl: "/api/placeholder/200/200",
    productCount: 728,
    isActive: true,
    showInMenu: true,
    displayOrder: 3,
    createdAt: "2023-01-17T09:30:00Z",
  },
  {
    id: "cat_11",
    name: "Fiction",
    slug: "fiction",
    parentId: "cat_10",
    description: "Fiction books",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 385,
    isActive: true,
    showInMenu: true,
    displayOrder: 1,
    createdAt: "2023-01-17T09:45:00Z",
  },
  {
    id: "cat_12",
    name: "Non-Fiction",
    slug: "non-fiction",
    parentId: "cat_10",
    description: "Non-fiction books",
    level: 2,
    imageUrl: "/api/placeholder/200/200",
    productCount: 343,
    isActive: true,
    showInMenu: true,
    displayOrder: 2,
    createdAt: "2023-01-17T10:00:00Z",
  },
];

// Function to build hierarchical tree structure
function buildCategoryTree(categories: any[]) {
  const idToCategory = new Map();
  const rootCategories: any[] = [];

  // First pass: create a map from ID to category node
  categories.forEach((category) => {
    idToCategory.set(category.id, { ...category, children: [] });
  });

  // Second pass: link children to parents
  categories.forEach((category) => {
    const node = idToCategory.get(category.id);
    if (category.parentId) {
      const parent = idToCategory.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      rootCategories.push(node);
    }
  });

  return rootCategories;
}

export default function CategoriesPage() {
  const columns = getCategoriesColumns();
  const categoryTree = buildCategoryTree(categories);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories and structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <FolderTree className="h-4 w-4 mr-2" />
            Tree View
          </Button>
          <Link href="/withAuth/categories/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        {/* Category Structure Card */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center mb-4">
            <FolderTree className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-medium">Category Structure</h2>
          </div>
          <div className="pl-4 border-l-2 border-gray-200">
            {categoryTree.map((category) => (
              <div key={category.id} className="mb-4">
                <div className="flex items-center py-1 hover:bg-gray-50 pl-2 -ml-2 rounded">
                  <Tag className="h-4 w-4 mr-2 text-primary" />
                  <Link
                    href={`/withAuth/categories/${category.id}`}
                    className="font-medium hover:underline"
                  >
                    {category.name} ({category.productCount})
                  </Link>
                </div>
                {category.children.length > 0 && (
                  <div className="pl-4 mt-2 border-l-2 border-gray-200">
                    {category.children.map((child: any) => (
                      <div
                        key={child.id}
                        className="flex items-center py-1 hover:bg-gray-50 pl-2 -ml-2 rounded"
                      >
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <Link
                          href={`/withAuth/categories/${child.id}`}
                          className="hover:underline"
                        >
                          {child.name} ({child.productCount})
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Categories Table */}
        <DataTable
          columns={columns}
          data={categories}
          searchableColumns={[
            {
              id: "name",
              title: "Category Name",
            },
            {
              id: "slug",
              title: "Slug",
            },
          ]}
          filterableColumns={[
            {
              id: "isActive",
              title: "Status",
              options: [
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ],
            },
            {
              id: "level",
              title: "Level",
              options: [
                { label: "Level 1", value: "1" },
                { label: "Level 2", value: "2" },
                { label: "Level 3", value: "3" },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
