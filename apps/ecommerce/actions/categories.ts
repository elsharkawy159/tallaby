"use server";

import { db } from "@workspace/db";
import {
  categories,
  products,
  eq,
  and,
  desc,
  sql,
  isNull,
  asc,
  inArray,
} from "@workspace/db";
import { unstable_cache } from "next/cache";
import { categoryTags } from "@workspace/cache";

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
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24,
  },
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
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24,
  },
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
          and(
            eq(products.categoryId, category.id),
            eq(products.status, "active"),
          ),
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
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24,
  },
);

export const getAllCategorySlugs = unstable_cache(
  async () => {
    try {
      const rows = await db
        .select({ slug: categories.slug })
        .from(categories)

      const data = rows.map((r) => r.slug).filter((s): s is string => Boolean(s))
      return { success: true, data }
    } catch (error) {
      console.error("Error fetching category slugs:", error);
      return { success: false, error: "Failed to fetch category slugs" };
    }
  },
  ["all-category-slugs"],
  {
    tags: [categoryTags.all()],
    revalidate: 60 * 60 * 24,
  },
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
          imageUrl: categories.imageUrl,
          productCount: sql<number>`count(${products.id})`,
        })
        .from(categories)
        .leftJoin(
          products,
          and(
            eq(products.categoryId, categories.id),
            eq(products.status, "active"),
          ),
        )
        .groupBy(categories.id)
        .orderBy(desc(sql`count(${products.id})`))
        .limit(12);

      // For categories without image, fetch first product image as fallback
      const needFallback = topCategories.filter((c) => !c.imageUrl);
      const fallbackMap = new Map<string, string>();

      if (needFallback.length > 0) {
        const categoryIds = needFallback.map((c) => c.id);
        const fallbackRows = await db
          .select({
            categoryId: products.categoryId,
            firstImage: sql<string>`(${products.images}->>0)`.as("first_image"),
          })
          .from(products)
          .where(
            and(
              inArray(products.categoryId, categoryIds),
              eq(products.status, "active"),
              sql`${products.images} IS NOT NULL`,
              sql`jsonb_array_length(${products.images}) > 0`,
            ),
          );

        // Pick first product image per category (query may return multiple per category)
        for (const row of fallbackRows) {
          const img = row.firstImage;
          if (row.categoryId && img && !fallbackMap.has(row.categoryId)) {
            fallbackMap.set(row.categoryId, img);
          }
        }
      }

      const data = topCategories.map((c) => ({
        ...c,
        fallbackImageUrl: fallbackMap.get(c.id) ?? null,
      }));

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching top categories:", error);
      throw error;
    }
  },
  ["top-categories"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
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
                eq(products.status, "active"),
              ),
            );

          return {
            ...category,
            productCount: count[0]?.count || 0,
          };
        }),
      );

      return { success: true, data: categoriesWithCounts };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { success: false, error: "Failed to fetch categories" };
    }
  },
  ["categories-with-products"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
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
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
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
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
);
