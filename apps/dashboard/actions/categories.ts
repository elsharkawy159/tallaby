"use server";

import { db } from "@workspace/db";
import { categories, products } from "@workspace/db";
import { eq, and, desc, sql, isNull, asc } from "drizzle-orm";

export async function getAllCategories() {
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
        and(eq(products.categoryId, categories.id), eq(products.isActive, true))
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
