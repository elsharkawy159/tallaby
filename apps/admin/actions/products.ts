"use server";

import { db } from "@workspace/db";
import {
  products,
  productTranslations,
  productVariants,
  reviews,
  orderItems,
} from "@workspace/db";
import { eq, and, desc, sql, gte, like, or } from "drizzle-orm";
import { getAdminUser } from "./auth";
import {
  applyInvalidation,
  invalidateProduct,
  mergeInvalidations,
  type ProductCacheSnapshot,
} from "@workspace/cache";
import { syncProductRating, syncSellerRating } from "@workspace/db/reviews";

/** Builds the cache-invalidation snapshot for a product from its current DB state. */
async function toSnapshot(productId: string): Promise<ProductCacheSnapshot | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      productTranslations: { columns: { locale: true, slug: true } },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    sellerId: product.sellerId,
    categoryId: product.categoryId,
    brandId: product.brandId,
    slugs: product.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: product.status,
    isFeatured: product.isFeatured ?? false,
    isMostSelling: product.isMostSelling ?? false,
    isPlatformChoice: product.isPlatformChoice ?? false,
    priceKey: JSON.stringify(product.price ?? null),
  };
}

export async function getAllProducts(params?: {
  status?: "draft" | "pending" | "active" | "rejected";
  categoryId?: string;
  brandId?: string;
  sellerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser();

    const conditions = [];

    if (params?.status) {
      conditions.push(eq(products.status, params.status));
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
      const pattern = `%${params.search}%`;
      conditions.push(
        or(
          like(products.sku, pattern),
          sql`EXISTS (
            SELECT 1 FROM product_translations pt
            WHERE pt.product_id = ${products.id}
            AND pt.locale = 'en'
            AND (pt.title ILIKE ${pattern} OR pt.description ILIKE ${pattern})
          )`
        )
      );
    }

    const productsListRaw = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        brand: true,
        category: true,
        productTranslations: true,
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

    const productsList = productsListRaw.map((p) => {
      const enT = p.productTranslations?.find((t) => t.locale === "en");
      return {
        ...p,
        title: enT?.title ?? "",
        slug: enT?.slug ?? "",
        description: enT?.description ?? null,
      };
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
    await getAdminUser();

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        brand: true,
        category: true,
        seller: true,
        productVariants: true,
        productTranslations: true,
        productQuestions: {
          with: {
            productAnswers: true,
          },
        },
        reviews: {
          with: {
            user: {
              columns: {
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: [desc(reviews.createdAt)],
        },
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

export async function getProductSalesSummary(productId: string) {
  try {
    await getAdminUser();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const [totals] = await db
      .select({
        totalSales: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        revenue: sql<number>`coalesce(sum(${orderItems.total}), 0)`,
      })
      .from(orderItems)
      .where(eq(orderItems.productId, productId));

    const [lastMonth] = await db
      .select({
        totalSales: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        revenue: sql<number>`coalesce(sum(${orderItems.total}), 0)`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.productId, productId),
          gte(orderItems.createdAt, thirtyDaysAgoIso)
        )
      );

    return {
      success: true,
      data: {
        totalSales: Number(totals?.totalSales ?? 0),
        revenue: Number(totals?.revenue ?? 0),
        lastMonthSales: Number(lastMonth?.totalSales ?? 0),
        lastMonthRevenue: Number(lastMonth?.revenue ?? 0),
      },
    };
  } catch (error) {
    console.error("Error fetching product sales summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: {
        totalSales: 0,
        revenue: 0,
        lastMonthSales: 0,
        lastMonthRevenue: 0,
      },
    };
  }
}

/** Clears stale denormalized ratings when products.average_rating exists but there are no reviews. */
export async function repairProductRatingIfStale(productId: string) {
  try {
    await getAdminUser();

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { averageRating: true, reviewCount: true },
      with: { reviews: { columns: { id: true }, limit: 1 } },
    });

    if (!product) return { success: false, error: "Product not found" };

    const hasReviews = (product.reviews?.length ?? 0) > 0;
    const hasStaleRating =
      !hasReviews &&
      ((product.averageRating ?? 0) > 0 || (product.reviewCount ?? 0) > 0);

    if (hasStaleRating || hasReviews) {
      await syncProductRating(productId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error repairing product rating:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateReviewStatus(
  reviewId: string,
  status: "pending" | "approved" | "rejected" | "flagged"
) {
  try {
    await getAdminUser();

    const [updatedReview] = await db
      .update(reviews)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    if (!updatedReview) {
      return { success: false, error: "Review not found" };
    }

    if (updatedReview.productId) {
      await syncProductRating(updatedReview.productId);

      const before = await toSnapshot(updatedReview.productId);
      const after = await toSnapshot(updatedReview.productId);
      if (before && after) {
        await applyInvalidation(invalidateProduct(before, after), {
          from: "admin",
          mode: "action",
        });
      }
    }

    if (updatedReview.sellerId && updatedReview.reviewType === "store") {
      await syncSellerRating(updatedReview.sellerId);
    }

    return { success: true, data: updatedReview };
  } catch (error) {
    console.error("Error updating review status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

type UpdateProductInput = {
  title?: string;
  slug?: string;
  description?: string;
  bulletPoints?: string[];
  brandId?: string;
  categoryId?: string;
  sku?: string;
  basePrice?: number;
  listPrice?: number;
  finalPrice?: number;
  quantity?: number;
  images?: string[];
  status?: "draft" | "pending" | "active" | "rejected";
  isPlatformChoice?: boolean;
  isMostSelling?: boolean;
  isFeatured?: boolean;
  condition?: typeof products.$inferInsert.condition;
  conditionDescription?: string;
  fulfillmentType?: typeof products.$inferInsert.fulfillmentType;
  handlingTime?: number;
  maxOrderQuantity?: number;
  taxClass?: string;
  dimensions?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  variants?: Array<{
    id?: string;
    title: string;
    sku: string;
    price: number;
    stock?: number;
    imageUrl?: string;
    option1?: string;
    option2?: string;
    option3?: string;
    barCode?: string;
    position?: number;
  }>;
};

export async function updateProduct(productId: string, data: UpdateProductInput) {
  try {
    await getAdminUser();

    const before = await toSnapshot(productId);
    if (!before) {
      return { success: false, error: "Product not found" };
    }

    const productUpdate: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.brandId !== undefined) productUpdate.brandId = data.brandId || null;
    if (data.categoryId !== undefined) productUpdate.categoryId = data.categoryId;
    if (data.status !== undefined) productUpdate.status = data.status;
    if (data.isPlatformChoice !== undefined)
      productUpdate.isPlatformChoice = data.isPlatformChoice;
    if (data.isMostSelling !== undefined)
      productUpdate.isMostSelling = data.isMostSelling;
    if (data.isFeatured !== undefined) productUpdate.isFeatured = data.isFeatured;
    if (data.taxClass !== undefined) productUpdate.taxClass = data.taxClass;
    if (data.sku !== undefined) productUpdate.sku = data.sku || null;
    if (data.quantity !== undefined) productUpdate.quantity = String(data.quantity);
    if (data.images !== undefined) productUpdate.images = data.images;
    if (data.condition !== undefined) productUpdate.condition = data.condition;
    if (data.conditionDescription !== undefined)
      productUpdate.conditionDescription = data.conditionDescription || null;
    if (data.fulfillmentType !== undefined)
      productUpdate.fulfillmentType = data.fulfillmentType;
    if (data.handlingTime !== undefined)
      productUpdate.handlingTime = String(data.handlingTime);
    if (data.maxOrderQuantity !== undefined)
      productUpdate.maxOrderQuantity = data.maxOrderQuantity ?? null;
    if (data.dimensions !== undefined) productUpdate.dimensions = data.dimensions;

    if (
      data.basePrice !== undefined ||
      data.listPrice !== undefined ||
      data.finalPrice !== undefined
    ) {
      const currentProduct = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: { price: true },
      });
      const currentPrice =
        (currentProduct?.price as {
          base?: number;
          list?: number;
          final?: number;
        } | null) || {};

      productUpdate.price = {
        ...currentPrice,
        base: data.basePrice ?? currentPrice.base ?? 0,
        list: data.listPrice ?? currentPrice.list ?? null,
        final:
          data.finalPrice ??
          data.basePrice ??
          currentPrice.final ??
          currentPrice.base ??
          0,
      };
    }

    const translationUpdate: Record<string, unknown> = {};
    if (data.title !== undefined) translationUpdate.title = data.title;
    if (data.slug !== undefined) translationUpdate.slug = data.slug;
    if (data.description !== undefined)
      translationUpdate.description = data.description || null;
    if (data.bulletPoints !== undefined)
      translationUpdate.bulletPoints = data.bulletPoints ?? [];
    if (data.metaTitle !== undefined)
      translationUpdate.metaTitle = data.metaTitle || null;
    if (data.metaDescription !== undefined)
      translationUpdate.metaDescription = data.metaDescription || null;
    const hasTranslationChanges = Object.keys(translationUpdate).length > 0;

    const existed = await db.transaction(async (tx) => {
      if (Object.keys(productUpdate).length > 1) {
        const updated = await tx
          .update(products)
          .set(productUpdate)
          .where(eq(products.id, productId))
          .returning({ id: products.id });
        if (!updated.length) return false;
      }

      if (hasTranslationChanges) {
        const existingTranslation = await tx.query.productTranslations.findFirst({
          where: and(
            eq(productTranslations.productId, productId),
            eq(productTranslations.locale, "en")
          ),
        });

        if (existingTranslation) {
          await tx
            .update(productTranslations)
            .set(translationUpdate)
            .where(eq(productTranslations.id, existingTranslation.id));
        } else {
          await tx.insert(productTranslations).values({
            productId,
            locale: "en",
            title: (data.title as string | undefined) ?? "Untitled",
            slug: data.slug ?? null,
            description: data.description ?? null,
            bulletPoints: data.bulletPoints ?? [],
            metaTitle: data.metaTitle ?? null,
            metaDescription: data.metaDescription ?? null,
          });
        }
      }

      if (data.variants !== undefined) {
        await tx
          .delete(productVariants)
          .where(eq(productVariants.productId, productId));

        if (data.variants.length > 0) {
          await tx.insert(productVariants).values(
            data.variants.map((variant, index) => ({
              productId,
              title: variant.title,
              price: String(variant.price),
              stock: variant.stock ?? 0,
              sku: variant.sku,
              imageUrl: variant.imageUrl ?? null,
              option1: variant.option1 ?? null,
              option2: variant.option2 ?? null,
              option3: variant.option3 ?? null,
              barCode: variant.barCode ?? null,
              position: variant.position ?? index + 1,
            }))
          );
        }
      }

      return true;
    });

    if (!existed) {
      return { success: false, error: "Product not found" };
    }

    const after = await toSnapshot(productId);
    await applyInvalidation(invalidateProduct(before, after), {
      from: "admin",
      mode: "action",
    });

    const updatedProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    return { success: true, data: updatedProduct };
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
  status: "draft" | "pending" | "active" | "rejected"
) {
  try {
    await getAdminUser();

    const before = await toSnapshot(productId);
    if (!before) {
      return { success: false, error: "Product not found" };
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    const after = await toSnapshot(productId);
    await applyInvalidation(invalidateProduct(before, after), {
      from: "admin",
      mode: "action",
    });

    return { success: true, data: updatedProduct };
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
    await getAdminUser();

    const beforeSnapshots = await Promise.all(productIds.map(toSnapshot));

    const deletedProducts = await db
      .delete(products)
      .where(sql`${products.id} = ANY(${productIds})`)
      .returning();

    const invalidation = mergeInvalidations(
      ...beforeSnapshots
        .filter((s): s is ProductCacheSnapshot => s !== null)
        .map((snapshot) => invalidateProduct(snapshot, null))
    );
    await applyInvalidation(invalidation, { from: "admin", mode: "action" });

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
    await getAdminUser();

    const stats = await db
      .select({
        status: products.status,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .groupBy(products.status);

    const totalStats = await db
      .select({
        totalProducts: sql<number>`count(*)`,
        activeProducts: sql<number>`count(*) filter (where ${products.status} = 'active')`,
        pendingProducts: sql<number>`count(*) filter (where ${products.status} = 'pending')`,
        draftProducts: sql<number>`count(*) filter (where ${products.status} = 'draft')`,
        rejectedProducts: sql<number>`count(*) filter (where ${products.status} = 'rejected')`,
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
