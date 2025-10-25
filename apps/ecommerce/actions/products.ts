"use server";

import { unstable_cache } from "next/cache";
import {
  db,
  productAnswers,
  products,
  productVariants,
  reviews,
  productQuestions,
  categories,
  brands,
  eq,
  and,
  or,
  gte,
  like,
  sql,
  desc,
  asc,
  isNotNull,
} from "@workspace/db";

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
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular";
  limit?: number;
  offset?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const cacheKey = `products-${JSON.stringify(filters)}`;

  return unstable_cache(
    async () => {
      try {
        const conditions = [eq(products.isActive, filters.isActive ?? true)];

        if (filters.categoryId) {
          conditions.push(eq(categories.id, filters.categoryId));
        }

        if (filters.brandId) {
          conditions.push(eq(brands.id, filters.brandId));
        }

        if (filters.minPrice !== undefined) {
          conditions.push(
            sql`(${products.price}->>'current')::numeric >= ${filters.minPrice}`
          );
        }

        if (filters.maxPrice !== undefined) {
          conditions.push(
            sql`(${products.price}->>'current')::numeric <= ${filters.maxPrice}`
          );
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
          case "price_asc":
            orderBy.push(asc(sql`(${products.price}->>'current')::numeric`));
            break;
          case "price_desc":
            orderBy.push(desc(sql`(${products.price}->>'current')::numeric`));
            break;
          case "rating":
            orderBy.push(desc(products.averageRating));
            break;
          case "newest":
            orderBy.push(desc(products.createdAt));
            break;
          case "popular":
            orderBy.push(desc(products.reviewCount));
            break;
          default:
            orderBy.push(desc(products.createdAt));
        }

        const productsList = await db.query.products.findMany({
          where: and(...conditions),
          with: {
            brand: true,
            category: true,
          },
          orderBy,
          limit: filters.limit || 30,
          offset: filters.offset || 0,
        });

        // Get total count for pagination
        const totalCount = await db
          .select({ count: sql`count(*)` })
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .leftJoin(brands, eq(products.brandId, brands.id))
          .where(and(...conditions));

        return {
          success: true,
          data: productsList,
          totalCount: Number(totalCount[0]?.count),
          hasMore:
            (filters.offset || 0) + productsList.length <
            Number(totalCount[0]?.count),
        };
      } catch (error) {
        console.error("Error fetching products:", error);
        return { success: false, error: "Failed to fetch products" };
      }
    },
    [cacheKey],
    {
      tags: ["products"],
      revalidate: 86400,
    }
  )();
}

export async function getProductBySlug(slug: string) {
  return unstable_cache(
    async () => {
      try {
        const product = await db.query.products.findFirst({
          where: and(eq(products.slug, slug), eq(products.isActive, true)),
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
              where: eq(reviews.status, "approved"),
              orderBy: [desc(reviews.helpfulCount), desc(reviews.createdAt)],
              with: {
                user: {
                  columns: {
                    fullName: true,
                    avatarUrl: true,
                  },
                },
                reviewComments: {
                  where: isNotNull(reviews.sellerId),
                  limit: 1,
                },
              },
            },
            productQuestions: {
              where: eq(productQuestions.status, "approved"),
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
            relatedProducts,
          },
        };
      } catch (error) {
        console.error("Error fetching product:", error);
        return { success: false, error: "Failed to fetch product" };
      }
    },
    [`product-${slug}`],
    {
      tags: ["products", `product-${slug}`],
      revalidate: 300,
    }
  )();
}

export async function getProductVariants(productId: string) {
  return unstable_cache(
    async () => {
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
    },
    [`product-variants-${productId}`],
    {
      tags: ["product-variants", `product-${productId}`],
      revalidate: 300,
    }
  )();
}

export async function getFeaturedProducts() {
  return unstable_cache(
    async () => {
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
    },
    ["featured-products"],
    {
      tags: ["products", "featured-products"],
      revalidate: 120,
    }
  )();
}

export async function getBestSellingProducts() {
  return unstable_cache(
    async () => {
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
        return {
          success: false,
          error: "Failed to fetch best selling products",
        };
      }
    },
    ["best-selling-products"],
    {
      tags: ["products", "best-selling-products"],
      revalidate: 180,
    }
  )();
}

export async function getNewArrivals() {
  return unstable_cache(
    async () => {
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
    },
    ["new-arrivals"],
    {
      tags: ["products", "new-arrivals"],
      revalidate: 300,
    }
  )();
}

export async function getDeals() {
  return unstable_cache(
    async () => {
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
    },
    ["deals"],
    {
      tags: ["products", "deals"],
      revalidate: 120,
    }
  )();
}

export async function getProductsByCategory(categoryId: string, limit: number) {
  return unstable_cache(
    async () => {
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
    },
    [`category-products-${categoryId}-${limit}`],
    {
      tags: ["products", `category-${categoryId}`],
      revalidate: 180,
    }
  )();
}

export async function getProductsByBrand(brandId: string, limit: number) {
  return unstable_cache(
    async () => {
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
    },
    [`brand-products-${brandId}-${limit}`],
    {
      tags: ["products", `brand-${brandId}`],
      revalidate: 180,
    }
  )();
}

export async function getProductsBySeller(sellerId: string, limit: number) {
  return unstable_cache(
    async () => {
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
    },
    [`seller-products-${sellerId}-${limit}`],
    {
      tags: ["products", `seller-${sellerId}`],
      revalidate: 180,
    }
  )();
}

export async function getFilterOptions() {
  return unstable_cache(
    async () => {
      try {
        // Get all available categories that have products
        const categoriesWithProducts = await db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            productCount: sql<number>`COUNT(${products.id})`,
          })
          .from(categories)
          .leftJoin(
            products,
            and(
              eq(products.categoryId, categories.id),
              eq(products.isActive, true)
            )
          )
          .groupBy(categories.id, categories.name, categories.slug)
          .having(sql`COUNT(${products.id}) > 0`)
          .orderBy(categories.name);

        // Get all available brands that have products
        const brandsWithProducts = await db
          .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            productCount: sql<number>`COUNT(${products.id})`,
          })
          .from(brands)
          .leftJoin(
            products,
            and(eq(products.brandId, brands.id), eq(products.isActive, true))
          )
          .groupBy(brands.id, brands.name, brands.slug)
          .having(sql`COUNT(${products.id}) > 0`)
          .orderBy(brands.name);

        // Get price range
        const priceRange = await db
          .select({
            minPrice: sql<number>`MIN((${products.price}->>'current')::numeric)`,
            maxPrice: sql<number>`MAX((${products.price}->>'current')::numeric)`,
          })
          .from(products)
          .where(eq(products.isActive, true));

        return {
          success: true,
          data: {
            categories: categoriesWithProducts,
            brands: brandsWithProducts,
            priceRange: {
              min: priceRange[0]?.minPrice || 0,
              max: priceRange[0]?.maxPrice || 1000,
            },
          },
        };
      } catch (error) {
        console.error("Error fetching filter options:", error);
        return { success: false, error: "Failed to fetch filter options" };
      }
    },
    ["filter-options"],
    {
      tags: ["products", "filter-options", "categories", "brands"],
      revalidate: 600,
    }
  )();
}
