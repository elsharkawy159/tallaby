// apps/ecommerce/actions/products.ts
"use server";

import { db, productAnswers, products, productVariants, reviews, productQuestions } from "@workspace/db";
import { eq, and, or, gte, like, sql, desc, asc, isNotNull } from "drizzle-orm";

interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  condition?: string;
  sellerId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  try {
    const conditions = [eq(products.isActive, filters.isActive ?? true)];
    
    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    
    if (filters.brandId) {
      conditions.push(eq(products.brandId, filters.brandId));
    }
    
    if (filters.minPrice !== undefined) {
      conditions.push(sql`(${products.price}->>'current')::numeric >= ${filters.minPrice}`);
    }
    
    if (filters.maxPrice !== undefined) {
      conditions.push(sql`(${products.price}->>'current')::numeric <= ${filters.maxPrice}`);
    }
    
    if (filters.minRating !== undefined) {
      conditions.push(gte(products.averageRating, filters.minRating));
    }
    
    if (filters.condition) {
      conditions.push(eq(products.condition, filters.condition as any));
    }
    
    if (filters.sellerId) {
      conditions.push(eq(products.sellerId, filters.sellerId));
    }
    
    if (filters.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.isFeatured));
    }
    
    if (filters.searchQuery) {
      conditions.push(
        or(
          like(products.title, `%${filters.searchQuery}%`),
          like(products.description, `%${filters.searchQuery}%`)
        ) as any
      );
    }

    // Determine ordering
    let orderBy = [];
    switch (filters.sortBy) {
      case 'price_asc':
        orderBy.push(asc(sql`(${products.price}->>'current')::numeric`));
        break;
      case 'price_desc':
        orderBy.push(desc(sql`(${products.price}->>'current')::numeric`));
        break;
      case 'rating':
        orderBy.push(desc(products.averageRating));
        break;
      case 'newest':
        orderBy.push(desc(products.createdAt));
        break;
      case 'popular':
        orderBy.push(desc(products.reviewCount));
        break;
      default:
        orderBy.push(desc(products.createdAt));
    }

    const productsList = await db.query.products.findMany({
      where: and(...conditions),
      with: {
        brand: true,
        seller: {
          columns: {
            displayName: true,
            slug: true,
            storeRating: true,
          },
        },
        productVariants: {
          limit: 1,
        },
      },
      orderBy,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(and(...conditions));

    return { 
      success: true, 
      data: productsList,
      totalCount: Number(totalCount[0]?.count),
      hasMore: (filters.offset || 0) + productsList.length < Number(totalCount[0]?.count)
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.slug, slug),
        eq(products.isActive, true)
      ),
      with: {
        brand: true,
        seller: {
          columns: {
            id: true,
            displayName: true,
            slug: true,
            storeRating: true,
            positiveRatingPercent: true,
            totalRatings: true,
          },
        },
        productVariants: true,
        reviews: {
          where: eq(reviews.status, 'approved'),
          orderBy: [desc(reviews.helpfulCount), desc(reviews.createdAt)],
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            reviewComments: {
              where: isNotNull(reviews.sellerId),
              limit: 1,
            },
          },
        },
        productQuestions: {
          where: eq(productQuestions.status, 'approved'),
          limit: 5,
          orderBy: [desc(productQuestions.voteCount)],
          with: {
            productAnswers: {
              where: eq(productAnswers.isVerified, true),
              orderBy: [desc(productQuestions.voteCount)],
              limit: 3,
            },
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Get related products
    const relatedProducts = await db.query.products.findMany({
      where: and(
        eq(products.categoryId, product.categoryId),
        eq(products.isActive, true),
        sql`${products.id} != ${product.id}`
      ),
      limit: 8,
      orderBy: [desc(products.averageRating)],
    });

    return { 
      success: true, 
      data: {
        ...product,
        relatedProducts
      }
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

export async function getProductVariants(productId: string) {
  try {
    const variants = await db.query.productVariants.findMany({
      where: eq(productVariants.productId, productId),
      orderBy: [asc(productVariants.position)],
    });

    return { success: true, data: variants };
  } catch (error) {
    console.error("Error fetching variants:", error);
    return { success: false, error: "Failed to fetch variants" };
  }
}

export async function getFeaturedProducts() {
  try {
    const featured = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        eq(products.isFeatured, true)
      ),
      with: {
        brand: true,
        seller: {
          columns: {
            displayName: true,
            slug: true,
          },
        },
      },
      limit: 12,
      orderBy: [desc(products.averageRating)],
    });

    return { success: true, data: featured };
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return { success: false, error: "Failed to fetch featured products" };
  }
}

export async function getBestSellingProducts() {
  try {
    const bestSelling = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        eq(products.isMostSelling, true)
      ),
      with: {
        brand: true,
      },
      limit: 12,
      orderBy: [desc(products.reviewCount)],
    });

    return { success: true, data: bestSelling };
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    return { success: false, error: "Failed to fetch best selling products" };
  }
}

export async function getNewArrivals() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newProducts = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        gte(products.createdAt, thirtyDaysAgo.toISOString())
      ),
      with: {
        brand: true,
      },
      limit: 12,
      orderBy: [desc(products.createdAt)],
    });

    return { success: true, data: newProducts };
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return { success: false, error: "Failed to fetch new arrivals" };
  }
}

export async function getDeals() {
  try {
    const deals = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        sql`${products.price}->>'discount' IS NOT NULL`,
        sql`(${products.price}->>'discount')::numeric > 0`
      ),
      with: {
        brand: true,
      },
      limit: 12,
      orderBy: [desc(sql`(${products.price}->>'discount')::numeric`)],
    });

    return { success: true, data: deals };
  } catch (error) {
    console.error("Error fetching deals:", error);
    return { success: false, error: "Failed to fetch deals" };
  }
}

export async function getProductsByCategory(categoryId: string, limit:number) {
  try {
    const categoryProducts = await db.query.products.findMany({
      where: and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true)
      ),
      with: {
        brand: true,
        seller: {
          columns: {
            displayName: true,
            slug: true,
          },
        },
      },
      limit,
      orderBy: [desc(products.averageRating), desc(products.reviewCount)],
    });

    return { success: true, data: categoryProducts };
  } catch (error) {
    console.error("Error fetching category products:", error);
    return { success: false, error: "Failed to fetch category products" };
  }
}

export async function getProductsByBrand(brandId: string, limit: number) {
  try {
    const brandProducts = await db.query.products.findMany({
      where: and(
        eq(products.brandId, brandId),
        eq(products.isActive, true)
      ),
      with: {
        seller: {
          columns: {
            displayName: true,
            slug: true,
          },
        },
      },
      limit,
      orderBy: [desc(products.averageRating)],
    });

    return { success: true, data: brandProducts };
  } catch (error) {
    console.error("Error fetching brand products:", error);
    return { success: false, error: "Failed to fetch brand products" };
  }
}

export async function getProductsBySeller(sellerId: string, limit:number) {
  try {
    const sellerProducts = await db.query.products.findMany({
      where: and(
        eq(products.sellerId, sellerId),
        eq(products.isActive, true)
      ),
      with: {
        brand: true,
      },
      limit,
      orderBy: [desc(products.averageRating)],
    });

    return { success: true, data: sellerProducts };
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return { success: false, error: "Failed to fetch seller products" };
  }
}