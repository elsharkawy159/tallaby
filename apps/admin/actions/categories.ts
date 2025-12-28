"use server";

import { db } from "@workspace/db";
import { categories, products } from "@workspace/db";
import { eq, and, desc, sql, like, or, isNull } from "drizzle-orm";
import { getAdminUser } from "./auth";

export async function getAllCategories(params?: {
  locale?: "en" | "ar";
  parentId?: string | null;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser(); // Verify admin access

    const conditions = [];

    if (params?.locale) {
      // When locale column is added, uncomment this:
      // conditions.push(eq(categories.locale, params.locale));
    }

    if (params?.parentId !== undefined) {
      if (params.parentId === null) {
        conditions.push(isNull(categories.parentId));
      } else {
        conditions.push(eq(categories.parentId, params.parentId));
      }
    }

    if (params?.search) {
      conditions.push(like(categories.name, `%${params.search}%`));
    }

    const categoriesList = await db.query.categories.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(categories.createdAt)],
      limit: params?.limit || 1000,
      offset: params?.offset || 0,
    });

    // Get product counts and children counts for each category
    const categoriesWithCounts = await Promise.all(
      categoriesList.map(async (category) => {
        const [productCountResult, childrenCountResult] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.categoryId, category.id)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(categories)
            .where(eq(categories.parentId, category.id)),
        ]);

        const productCount = Number(productCountResult[0]?.count || 0);
        const childrenCount = Number(childrenCountResult[0]?.count || 0);

        return {
          ...category,
          productCount,
          childrenCount,
          // Map image_url when column is added
          imageUrl: (category as any).image_url || null,
          // Map locale when column is added
          locale: (category as any).locale || "en",
        };
      })
    );

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(categories)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      success: true,
      data: categoriesWithCounts,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCategoryById(categoryId: string) {
  try {
    await getAdminUser(); // Verify admin access

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: {
        categories: true, // Get children
        category: true, // Get parent
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Get product count
    const productCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    const productCount = Number(productCountResult[0]?.count || 0);

    return {
      success: true,
      data: {
        ...category,
        productCount,
        imageUrl: (category as any).image_url || null,
        locale: (category as any).locale || "en",
      },
    };
  } catch (error) {
    console.error("Error fetching category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCategory(data: {
  name: string;
  slug: string;
  parentId?: string | null;
  locale: "en" | "ar";
  imageUrl?: string | null;
  description?: string | null;
}) {
  try {
    await getAdminUser(); // Verify admin access

    // Calculate level based on parent
    let level = 1;
    if (data.parentId) {
      const parent = await db.query.categories.findFirst({
        where: eq(categories.id, data.parentId),
      });
      if (parent) {
        level = (parent.level || 1) + 1;
      }
    }

    const newCategory = await db
      .insert(categories)
      .values({
        name: data.name,
        slug: data.slug,
        parentId: data.parentId || null,
        level,
        // When columns are added, include them:
        // image_url: data.imageUrl,
        // locale: data.locale,
        // description: data.description,
      })
      .returning();

    return {
      success: true,
      data: newCategory[0],
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateCategory(
  categoryId: string,
  data: {
    name?: string;
    slug?: string;
    parentId?: string | null;
    locale?: "en" | "ar";
    imageUrl?: string | null;
    description?: string | null;
  }
) {
  try {
    await getAdminUser(); // Verify admin access

    // Recalculate level if parent changed
    let levelUpdate: { level?: number } = {};
    if (data.parentId !== undefined) {
      let level = 1;
      if (data.parentId) {
        const parent = await db.query.categories.findFirst({
          where: eq(categories.id, data.parentId),
        });
        if (parent) {
          level = (parent.level || 1) + 1;
        }
      }
      levelUpdate = { level };
    }

    const updatedCategory = await db
      .update(categories)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.parentId !== undefined && { parentId: data.parentId || null }),
        ...levelUpdate,
        updatedAt: new Date().toISOString(),
        // When columns are added, include them:
        // ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
        // ...(data.locale && { locale: data.locale }),
        // ...(data.description !== undefined && { description: data.description }),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    if (!updatedCategory.length) {
      throw new Error("Category not found");
    }

    return {
      success: true,
      data: updatedCategory[0],
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    await getAdminUser(); // Verify admin access

    // Check if category has children
    const children = await db.query.categories.findMany({
      where: eq(categories.parentId, categoryId),
    });

    if (children.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete category with subcategories. Please delete or move subcategories first.",
      };
    }

    // Check if category has products
    const productCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    const productCount = Number(productCountResult[0]?.count || 0);
    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${productCount} product(s). Please reassign or remove products first.`,
      };
    }

    const deletedCategory = await db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    if (!deletedCategory.length) {
      throw new Error("Category not found");
    }

    return {
      success: true,
      data: deletedCategory[0],
    };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCategoryChildrenCount(categoryId: string) {
  try {
    await getAdminUser(); // Verify admin access

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    return {
      success: true,
      data: Number(countResult[0]?.count || 0),
    };
  } catch (error) {
    console.error("Error fetching category children count:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: 0,
    };
  }
}

export async function getCategoryStats() {
  try {
    await getAdminUser(); // Verify admin access

    const stats = await db
      .select({
        totalCategories: sql<number>`count(*)`,
        rootCategories: sql<number>`count(*) filter (where ${categories.parentId} is null)`,
        subCategories: sql<number>`count(*) filter (where ${categories.parentId} is not null)`,
      })
      .from(categories);

    return {
      success: true,
      data: stats[0],
    };
  } catch (error) {
    console.error("Error fetching category stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
