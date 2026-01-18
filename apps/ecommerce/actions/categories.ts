"use server";

import { db } from "@workspace/db";
import { categories, products, eq, and, desc, sql, isNull, asc } from "@workspace/db";
import { unstable_cache } from "next/cache";

export const getAllCategories = unstable_cache(
  async () => {
    try {
      const allCategories = await db.query.categories.findMany({
        orderBy: [asc(categories.level), asc(categories.name)],
      });

      // Build category tree
      const categoryTree = buildCategoryTree(allCategories);

      return { success: true, data: categoryTree };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { success: false, error: "Failed to fetch categories" };
    }
  },
  ["all-categories"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24,
  }
);

export const getCategoryTree = unstable_cache(
  async () => {
    try {
      // Get root categories
      const rootCategories = await db.query.categories.findMany({
        where: isNull(categories.parentId),
        with: {
          categories: {
            with: {
              categories: true,
            },
          },
        },
        orderBy: [asc(categories.name)],
      });

      return { success: true, data: rootCategories };
    } catch (error) {
      console.error("Error fetching category tree:", error);
      return { success: false, error: "Failed to fetch category tree" };
    }
  },
  ["category-tree"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24,
  }
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
        with: {
          category: true, // Parent
          categories: true, // Children
        },
      });

      if (!category) {
        return { success: false, error: "Category not found" };
      }

      // Get breadcrumb
      const breadcrumb = await getCategoryBreadcrumb(category.id);

      // Get product count
      const productCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(
          and(eq(products.categoryId, category.id), eq(products.isActive, true))
        );

      return {
        success: true,
        data: {
          ...category,
          breadcrumb,
          productCount: productCount[0]?.count || 0,
        },
      };
    } catch (error) {
      console.error("Error fetching category:", error);
      return { success: false, error: "Failed to fetch category" };
    }
  },
  ["category-by-slug"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24,
  }
);

export const getTopCategories = unstable_cache(
  async () => {
    try {
      // Get categories with most products
      const topCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          nameAr: categories.nameAr,
          slug: categories.slug,
          productCount: sql<number>`count(${products.id})`,
        })
        .from(categories)
        .leftJoin(
          products,
          and(
            eq(products.categoryId, categories.id),
            eq(products.isActive, true)
          )
        )
        .groupBy(categories.id)
        .orderBy(desc(sql`count(${products.id})`))
        .limit(12);

      return { success: true, data: topCategories };
    } catch (error) {
      console.error("Error fetching top categories:", error);
      return { success: false, error: "Failed to fetch top categories" };
    }
  },
  ["top-categories"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24, // 1 day
  }
);

export const getCategoriesWithProducts = unstable_cache(
  async () => {
    try {
      const categoriesWithProducts = await db.query.categories.findMany({
        where: eq(categories.level, 1),
        with: {
          categories: {
            with: {
              categories: true,
            },
          },
        },
      });

      // Add product counts
      const categoriesWithCounts = await Promise.all(
        categoriesWithProducts.map(async (category) => {
          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(
              and(
                eq(products.categoryId, category.id),
                eq(products.isActive, true)
              )
            );

          return {
            ...category,
            productCount: count[0]?.count || 0,
          };
        })
      );

      return { success: true, data: categoriesWithCounts };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { success: false, error: "Failed to fetch categories" };
    }
  },
  ["categories-with-products"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24, // 1 day
  }
);

const buildCategoryTree = unstable_cache(
  async (categories: any[]) => {
    const categoryMap = new Map();
    const tree: any[] = [];

    // Create a map of categories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      } else {
        tree.push(categoryMap.get(cat.id));
      }
    });

    return tree;
  },
  ["build-category-tree"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24, // 1 day
  }
);

const getCategoryBreadcrumb = unstable_cache(
  async (categoryId: string) => {
    const breadcrumb = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, currentId),
      });

      if (category) {
        breadcrumb.unshift(category);
        currentId = category.parentId || "";
      } else {
        break;
      }
    }

    return breadcrumb;
  },
  ["get-category-breadcrumb"],
  {
    tags: ["categories"],
    revalidate: 60 * 60 * 24, // 1 day
  }
);
