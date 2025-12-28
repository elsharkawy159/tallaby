"use server";

import { db } from "@workspace/db";
import { products, brands, categories, sellers } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { getAdminUser } from "./auth";
import { revalidatePath } from "next/cache";

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

export async function updateProduct(
  productId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    bulletPoints?: string[];
    brandId?: string;
    categoryId?: string;
    basePrice?: number;
    listPrice?: number;
    isActive?: boolean;
    isPlatformChoice?: boolean;
    isMostSelling?: boolean;
    taxClass?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    searchKeywords?: string;
  }
) {
  try {
    await getAdminUser(); // Verify admin access

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!existingProduct) {
      return { success: false, error: "Product not found" };
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.bulletPoints !== undefined)
      updateData.bulletPoints = data.bulletPoints || null;
    if (data.brandId !== undefined) updateData.brandId = data.brandId || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isPlatformChoice !== undefined)
      updateData.isPlatformChoice = data.isPlatformChoice;
    if (data.isMostSelling !== undefined)
      updateData.isMostSelling = data.isMostSelling;
    if (data.taxClass !== undefined) updateData.taxClass = data.taxClass;

    // Handle price JSONB
    if (data.basePrice !== undefined || data.listPrice !== undefined) {
      const currentPrice =
        (existingProduct.price as { base?: number; list?: number } | null) ||
        {};
      updateData.price = {
        base: data.basePrice ?? currentPrice.base ?? 0,
        list: data.listPrice ?? currentPrice.list ?? null,
      };
    }

    // Handle SEO JSONB
    if (
      data.metaTitle !== undefined ||
      data.metaDescription !== undefined ||
      data.metaKeywords !== undefined ||
      data.searchKeywords !== undefined
    ) {
      const currentSeo =
        (existingProduct.seo as {
          title?: string;
          description?: string;
          keywords?: string;
          searchKeywords?: string;
        } | null) || {};
      updateData.seo = {
        title: data.metaTitle ?? currentSeo.title ?? null,
        description: data.metaDescription ?? currentSeo.description ?? null,
        keywords: data.metaKeywords ?? currentSeo.keywords ?? null,
        searchKeywords:
          data.searchKeywords ?? currentSeo.searchKeywords ?? null,
      };
    }

    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct.length) {
      throw new Error("Product not found");
    }

    revalidatePath("/withAuth/products");
    revalidatePath(`/withAuth/products/${productId}`);

    return { success: true, data: updatedProduct[0] };
  } catch (error) {
    console.error("Error updating product:", error);
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
