"use server";

import { db } from "@workspace/db";
import { products, brands, categories, sellers } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { getAdminUser } from "./auth";

export async function getAllProducts(params?: {
  status?: "active" | "inactive";
  categoryId?: string;
  brandId?: string;
  sellerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser(); // Verify admin access

    const conditions = [];

    if (params?.status) {
      conditions.push(eq(products.isActive, params.status === "active"));
    }

    if (params?.categoryId) {
      conditions.push(eq(products.categoryId, params.categoryId));
    }

    if (params?.brandId) {
      conditions.push(eq(products.brandId, params.brandId));
    }

    if (params?.sellerId) {
      conditions.push(eq(products.sellerId, params.sellerId));
    }

    if (params?.search) {
      conditions.push(
        or(
          like(products.title, `%${params.search}%`),
          like(products.sku, `%${params.search}%`),
          like(products.description, `%${params.search}%`)
        )
      );
    }

    const productsList = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        brand: true,
        category: true,
        seller: {
          columns: {
            businessName: true,
            displayName: true,
          },
        },
        productVariants: true,
        reviews: {
          limit: 5,
        },
      },
      orderBy: [desc(products.createdAt)],
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      success: true,
      data: productsList,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getProductById(productId: string) {
  try {
    await getAdminUser(); // Verify admin access

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        brand: true,
        category: true,
        seller: true,
        productVariants: true,
        productQuestions: {
          with: {
            productAnswers: true,
          },
        },
        reviews: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateProductStatus(
  productId: string,
  isActive: boolean
) {
  try {
    await getAdminUser(); // Verify admin access

    const updatedProduct = await db
      .update(products)
      .set({
        isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct.length) {
      throw new Error("Product not found");
    }

    return { success: true, data: updatedProduct[0] };
  } catch (error) {
    console.error("Error updating product status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteProducts(productIds: string[]) {
  try {
    await getAdminUser(); // Verify admin access

    const deletedProducts = await db
      .delete(products)
      .where(sql`${products.id} = ANY(${productIds})`)
      .returning();

    return { success: true, data: deletedProducts };
  } catch (error) {
    console.error("Error deleting products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getProductStats() {
  try {
    await getAdminUser(); // Verify admin access

    const stats = await db
      .select({
        status: sql<string>`CASE WHEN ${products.isActive} THEN 'active' ELSE 'inactive' END`,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .groupBy(
        sql`CASE WHEN ${products.isActive} THEN 'active' ELSE 'inactive' END`
      );

    const totalStats = await db
      .select({
        totalProducts: sql<number>`count(*)`,
        activeProducts: sql<number>`count(*) filter (where ${products.isActive} = true)`,
        inactiveProducts: sql<number>`count(*) filter (where ${products.isActive} = false)`,
        totalRevenue: sql<number>`sum(${products.price})`,
      })
      .from(products);

    return {
      success: true,
      data: {
        byStatus: stats,
        total: totalStats[0],
      },
    };
  } catch (error) {
    console.error("Error fetching product stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
