
"use server";

import { db } from "@workspace/db";
import { 
  products, 
  orderItems, 
  searchLogs,
  wishlistItems,
  wishlists,
  orders,
  ne,
  inArray,
  gte,
  or,
  isNotNull,
  eq,
  and,
  desc,
  sql,
} from "@workspace/db";
import { getUser, getSessionId } from "./auth";

export async function getRecommendedProducts(type: 'personalized' | 'trending' | 'similar', productId?: string) {
  try {
    
    switch (type) {
      case 'personalized':
        return getPersonalizedRecommendations();
      case 'trending':
        return getTrendingProducts();
      case 'similar':
        if (!productId) {
          return { success: false, error: "Product ID required for similar products" };
        }
        return getSimilarProducts(productId);
      default:
        return { success: false, error: "Invalid recommendation type" };
    }
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return { success: false, error: "Failed to get recommendations" };
  }
}

async function getPersonalizedRecommendations() {
  try {
    const user = await getUser();
    
    if (!user) {
      // For anonymous users, show popular products
      return getTrendingProducts();
    }

    // Get user's purchase history
    const purchasedProducts = await db
      .select({
        productId: orderItems.productId,
        categoryId: products.categoryId,
        brandId: products.brandId,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.userId, user.user.id))
      .limit(20);

    // Get user's wishlist
    const wishlistProducts = await db
      .select({
        productId: wishlistItems.productId,
        categoryId: products.categoryId,
        brandId: products.brandId,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
      .where(eq(wishlists.userId, user.user.id))
      .limit(10);

    // Get recently viewed (from search logs)
    const recentlyViewed = await db
      .select({
        productId: searchLogs.clickedProductId,
      })
      .from(searchLogs)
      .where(and(
        eq(searchLogs.userId, user.user.id),
        isNotNull(searchLogs.clickedProductId)
      ))
      .orderBy(desc(searchLogs.createdAt))
      .limit(10);

    // Collect all interacted product IDs
    const interactedProductIds = [
      ...purchasedProducts.map(p => p.productId),
      ...wishlistProducts.map(p => p.productId),
      ...recentlyViewed.map(p => p.productId).filter(Boolean),
    ];

    // Collect categories and brands
    const preferredCategories = [...new Set([
      ...purchasedProducts.map(p => p.categoryId),
      ...wishlistProducts.map(p => p.categoryId),
    ].filter(Boolean))];

    const preferredBrands = [...new Set([
      ...purchasedProducts.map(p => p.brandId),
      ...wishlistProducts.map(p => p.brandId),
    ].filter(Boolean))];

    // Build recommendations based on preferences
    const conditions = [
      eq(products.isActive, true),
    ];

    if (interactedProductIds.length > 0) {
      conditions.push(sql`${products.id} NOT IN (${sql.join(interactedProductIds.filter(Boolean) as string[], sql`, `)})`);
    }

    // Get products from preferred categories and brands
    let recommendations = [];

    if (preferredCategories.length > 0) {
      const categoryProducts = await db.query.products.findMany({
        where: and(
          ...conditions,
          inArray(products.categoryId, preferredCategories)
        ),
        orderBy: [desc(products.averageRating), desc(products.reviewCount)],
        limit: 10,
      });
      recommendations.push(...categoryProducts);
    }

    if (preferredBrands.length > 0) {
      const brandProducts = await db.query.products.findMany({
        where: and(
          ...conditions,
          inArray(products.brandId, preferredBrands as any)
        ),
        orderBy: [desc(products.averageRating)],
        limit: 10,
      });
      recommendations.push(...brandProducts);
    }

    // Remove duplicates
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(p => [p.id, p])).values()
    ).slice(0, 20);

    return { success: true, data: uniqueRecommendations };
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    return { success: false, error: "Failed to get recommendations" };
  }
}

async function getTrendingProducts() {
  try {
    // Get products with most orders in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await db
      .select({
        productId: orderItems.productId,
        orderCount: sql<number>`count(distinct ${orderItems.orderId})`,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
      })
      .from(orderItems)
      .where(gte(orderItems.createdAt, sevenDaysAgo.toISOString()))
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`count(distinct ${orderItems.orderId})`))
      .limit(20);

    const productIds = trending.map(t => t.productId);
    
    if (productIds.length === 0) {
      // Fallback to best rated products
      const bestRated = await db.query.products.findMany({
        where: eq(products.isActive, true),
        orderBy: [desc(products.averageRating), desc(products.reviewCount)],
        limit: 20,
      });
      return { success: true, data: bestRated };
    }

    const trendingProducts = await db.query.products.findMany({
      where: and(
        inArray(products.id, productIds),
        eq(products.isActive, true)
      ),
      with: {
        brand: true,
      },
    });

    // Sort by trending order
    const sortedProducts = productIds
      .map(id => trendingProducts.find(p => p.id === id))
      .filter(Boolean);

    return { success: true, data: sortedProducts };
  } catch (error) {
    console.error("Error getting trending products:", error);
    return { success: false, error: "Failed to get trending products" };
  }
}

async function getSimilarProducts(productId: string) {
  try {
    // Get the product details
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Find similar products based on category, brand, and price range
    const priceMin = Number((product.price as any)?.current) * 0.7;
    const priceMax = Number((product.price as any)?.current) * 1.3;

    const similar = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        ne(products.id, productId),
        or(
          eq(products.categoryId, product.categoryId),
          eq(products.brandId, product.brandId as any)
        ),
        sql`(${products.price}->>'current')::numeric BETWEEN ${priceMin} AND ${priceMax}`
      ),
      orderBy: [desc(products.averageRating)],
      limit: 12,
    });

    return { success: true, data: similar };
  } catch (error) {
    console.error("Error getting similar products:", error);
    return { success: false, error: "Failed to get similar products" };
  }
}

export async function getFrequentlyBoughtTogether(productId: string) {
  try {
    // Find products that are often bought together
    const boughtTogether = await db
      .select({
        productId: orderItems.productId,
        frequency: sql<number>`count(*)`,
      })
      .from(orderItems)
      .innerJoin(
        orderItems as any,
        and(
          eq(orderItems.orderId, orderItems.orderId),
          eq(orderItems.productId, productId),
          ne(orderItems.productId, productId)
        )
      )
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`count(*)`))
      .limit(4);

    if (boughtTogether.length === 0) {
      // Fallback to products from same category
      return getSimilarProducts(productId);
    }

    const productIds = boughtTogether.map(item => item.productId);
    const frequentProducts = await db.query.products.findMany({
      where: and(
        inArray(products.id, productIds),
        eq(products.isActive, true)
      ),
    });

    return { success: true, data: frequentProducts };
  } catch (error) {
    console.error("Error getting frequently bought together:", error);
    return { success: false, error: "Failed to get products" };
  }
}

export async function getRecentlyViewed() {
  try {
    const user = await getUser();
    const sessionId = await getSessionId();

    if (!user && !sessionId) {
      return { success: true, data: [] };
    }

    const conditions = [];
    if (user) {
      conditions.push(eq(searchLogs.userId, user.user.id));
    } else {
      conditions.push(eq(searchLogs.sessionId, sessionId));
    }

    const recentlyViewed = await db
      .select({
        productId: searchLogs.clickedProductId,
        viewedAt: searchLogs.createdAt,
      })
      .from(searchLogs)
      .where(and(
        or(...conditions),
        isNotNull(searchLogs.clickedProductId)
      ))
      .orderBy(desc(searchLogs.createdAt))
      .limit(10);

    const productIds = [...new Set(recentlyViewed.map(v => v.productId).filter(Boolean))];
    
    if (productIds.length === 0) {
      return { success: true, data: [] };
    }

    const viewedProducts = await db.query.products.findMany({
      where: and(
        inArray(products.id, productIds as any),
        eq(products.isActive, true)
      ),
      with: {
        brand: true,
      },
    });

    // Sort by viewing order
    const sortedProducts = productIds
      .map(id => viewedProducts.find(p => p.id === id))
      .filter(Boolean);

    return { success: true, data: sortedProducts };
  } catch (error) {
    console.error("Error getting recently viewed:", error);
    return { success: false, error: "Failed to get recently viewed" };
  }
}
