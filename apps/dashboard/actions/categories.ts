"use server";

import { db } from "@workspace/db";
import { categories, products } from "@workspace/db";
import { eq, and, desc, sql, isNull, asc } from "drizzle-orm";
import { cacheProfiles, categoryTags, createCachedQuery } from "@workspace/cache";

/**
 * Category tree is admin-curated, shared reference data — cached and
 * invalidated by admin's category mutations (see apps/admin/actions/categories.ts)
 * via the cross-app broadcast, not by anything in the dashboard app.
 */
const CATEGORY_NODE_COLUMNS = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
  level: true,
  parentId: true,
} as const;

const loadCategoryTree = createCachedQuery({
  name: "dashboard:categories:tree:v2",
  ttl: cacheProfiles.taxonomy,
  tags: () => [categoryTags.all(), categoryTags.tree()],
  // Sent to the product form as a prop, so only what the pickers read. A failure
  // throws here: it must not sit in the 24 h cache as an empty category list.
  query: () =>
    db.query.categories.findMany({
      where: isNull(categories.parentId),
      columns: CATEGORY_NODE_COLUMNS,
      with: {
        categories: {
          columns: CATEGORY_NODE_COLUMNS,
          with: {
            categories: { columns: CATEGORY_NODE_COLUMNS },
          },
        },
      },
      orderBy: [asc(categories.name)],
    }),
});

export async function getAllCategories() {
  try {
    return { success: true as const, data: await loadCategoryTree() };
  } catch (error) {
    console.error("Error fetching category tree:", error);
    return { success: false as const, error: "Failed to fetch category tree", data: undefined };
  }
}

export async function getCategoryBySlug(slug: string) {
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
        and(eq(products.categoryId, category.id), eq(products.status, "active"))
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
}

export async function getTopCategories() {
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
        and(eq(products.categoryId, categories.id), eq(products.status, "active"))
      )
      .groupBy(categories.id)
      .orderBy(desc(sql`count(${products.id})`))
      .limit(12);

    return { success: true, data: topCategories };
  } catch (error) {
    console.error("Error fetching top categories:", error);
    return { success: false, error: "Failed to fetch top categories" };
  }
}

export async function getCategoriesWithProducts() {
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
              eq(products.status, "active")
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
}

async function getCategoryBreadcrumb(categoryId: string) {
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
}
