"use server";

import { db } from "@workspace/db";
import { categories, products } from "@workspace/db";
import {
  eq,
  and,
  or,
  desc,
  sql,
  like,
  ilike,
  isNull,
  inArray,
} from "drizzle-orm";
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

    // Get total product count (including descendants) and children count for each category
    const categoriesWithCounts = await Promise.all(
      categoriesList.map(async (category) => {
        const [totalProductCountResult, childrenCountResult] =
          await Promise.all([
            db.execute(sql`
            WITH RECURSIVE category_tree AS (
              SELECT id FROM categories WHERE id = ${category.id}
              UNION ALL
              SELECT c.id FROM categories c
              INNER JOIN category_tree ct ON c.parent_id = ct.id
            )
            SELECT count(*)::text as count
            FROM products
            WHERE category_id IN (SELECT id FROM category_tree)
          `),
            db
              .select({ count: sql<number>`count(*)` })
              .from(categories)
              .where(eq(categories.parentId, category.id)),
          ]);

        const countRow = Array.isArray(totalProductCountResult)
          ? totalProductCountResult[0]
          : (totalProductCountResult as { rows?: { count: string }[] })
              ?.rows?.[0];
        const totalProductCount = Number(
          (countRow as { count?: string })?.count ?? 0,
        );
        const childrenCount = Number(childrenCountResult[0]?.count || 0);

        return {
          ...category,
          productCount: totalProductCount,
          childrenCount,
          imageUrl: (category as { imageUrl?: string | null }).imageUrl ?? null,
          locale: (category as { locale?: string }).locale || "en",
        };
      }),
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
        imageUrl: (category as { imageUrl?: string | null }).imageUrl ?? null,
        locale: (category as { locale?: string }).locale || "en",
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
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
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
  },
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
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        updatedAt: new Date().toISOString(),
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

export interface CategorySearchResult {
  id: string;
  name: string | null;
  slug: string | null;
  parentId: string | null;
  level: number | null;
  productCount: number;
  childrenCount: number;
  breadcrumbPath: string;
  ancestryIds: string[];
}

export async function searchCategories(params?: {
  locale?: "en" | "ar";
  search?: string;
  limit?: number;
}) {
  try {
    await getAdminUser();

    const searchTerm = params?.search?.trim();
    const displayLimit = params?.limit ?? 50;
    const fetchLimit = 150; // Fetch more to sort by product count, then trim

    if (!searchTerm) {
      return { success: true, data: [] as CategorySearchResult[] };
    }

    const pattern = `%${searchTerm}%`;

    // 1. Search matching categories in DB - fetch more so we can sort by product count
    const matches = await db
      .select({
        id: categories.id,
        name: categories.name,
        nameAr: categories.nameAr,
        slug: categories.slug,
        parentId: categories.parentId,
        level: categories.level,
      })
      .from(categories)
      .where(
        or(
          ilike(categories.name, pattern),
          ilike(categories.nameAr, pattern),
          ilike(categories.slug, pattern),
        ),
      )
      .limit(fetchLimit);

    if (matches.length === 0) {
      return { success: true, data: [] as CategorySearchResult[] };
    }

    const matchIds = matches.map((m) => m.id);
    const matchIdsSql = sql.join(matchIds.map((id) => sql`${id}`), sql`, `);

    // 2. Fetch ancestors for breadcrumbs (single recursive CTE - only for matched ids)
    const ancestorsResult = await db.execute<{
      id: string;
      parent_id: string | null;
      name: string | null;
      name_ar: string | null;
      slug: string | null;
    }>(sql`
      WITH RECURSIVE ancestors AS (
        SELECT id, parent_id, name, name_ar, slug
        FROM categories
        WHERE id IN (${matchIdsSql})
        UNION ALL
        SELECT c.id, c.parent_id, c.name, c.name_ar, c.slug
        FROM categories c
        INNER JOIN ancestors a ON c.id = a.parent_id
      )
      SELECT DISTINCT id, parent_id, name, name_ar, slug FROM ancestors
    `);

    type AncestorRow = {
      id: string;
      parent_id: string | null;
      name: string | null;
      name_ar: string | null;
      slug: string | null;
    };
    const ancestorsRows: AncestorRow[] = Array.isArray(ancestorsResult)
      ? (ancestorsResult as AncestorRow[])
      : ((ancestorsResult as { rows?: AncestorRow[] })?.rows ?? []);
    const idToCategory = new Map(
      ancestorsRows.map((row) => [
        row.id,
        {
          id: row.id,
          parentId: row.parent_id,
          name: row.name,
          nameAr: row.name_ar,
          slug: row.slug,
        },
      ]),
    );
    // Add matches in case they weren't in ancestors (they should be)
    matches.forEach((m) =>
      idToCategory.set(m.id, { ...m, parentId: m.parentId }),
    );

    const buildBreadcrumb = (
      categoryId: string,
    ): { path: string; ancestry: string[] } => {
      const ancestry: string[] = [];
      const pathParts: string[] = [];
      let currentId: string | null = categoryId;

      while (currentId) {
        const cat = idToCategory.get(currentId);
        if (!cat) break;
        ancestry.unshift(currentId);
        const displayName =
          (cat as { name?: string; nameAr?: string }).name ||
          (cat as { name?: string; nameAr?: string }).nameAr ||
          "Unnamed";
        pathParts.unshift(displayName);
        currentId = (cat as { parentId?: string | null }).parentId ?? null;
      }

      return { path: pathParts.join(" > "), ancestry };
    };

    // 3. Batch fetch product & children counts for matches only
    const [productCountsResult, childrenCountsResult] = await Promise.all([
      db
        .select({
          categoryId: products.categoryId,
          count: sql<number>`count(*)::int`,
        })
        .from(products)
        .where(inArray(products.categoryId, matchIds))
        .groupBy(products.categoryId),
      db
        .select({
          parentId: categories.parentId,
          count: sql<number>`count(*)::int`,
        })
        .from(categories)
        .where(inArray(categories.parentId, matchIds))
        .groupBy(categories.parentId),
    ]);

    const productCountMap = new Map(
      productCountsResult.map((r) => [r.categoryId, Number(r.count) || 0]),
    );
    const childrenCountMap = new Map(
      childrenCountsResult.map((r) => [r.parentId, Number(r.count) || 0]),
    );

    const searchResults: CategorySearchResult[] = matches
      .map((c) => {
        const { path, ancestry } = buildBreadcrumb(c.id);
        return {
          id: c.id,
          name: c.name ?? null,
          slug: c.slug ?? null,
          parentId: c.parentId,
          level: c.level,
          productCount: productCountMap.get(c.id) ?? 0,
          childrenCount: childrenCountMap.get(c.id) ?? 0,
          breadcrumbPath: path,
          ancestryIds: ancestry,
        };
      })
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, displayLimit);

    return { success: true, data: searchResults };
  } catch (error) {
    console.error("Error searching categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [] as CategorySearchResult[],
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
