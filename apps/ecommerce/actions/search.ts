// apps/ecommerce/actions/search.ts
"use server";

import { unstable_cache } from "next/cache";
import {
  products,
  productTranslations,
  brands,
  categories,
  sellers,
  searchLogs,
  eq,
  and,
  or,
  like,
  sql,
  desc,
  asc,
  gte,
  inArray,
  db,
} from "@workspace/db";
import { getUser, getSessionId } from "./auth";
import { getLocale } from "next-intl/server";
import {
  pickTranslationFromArray,
  mergeProductWithTranslation,
  type ProductLocale,
} from "@/lib/product-translations";

interface SearchFilters {
  query: string;
  categories?: string[];
  brands?: string[];
  sellers?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  conditions?: string[];
  fulfillmentTypes?: string[];
  inStock?: boolean;
  freeShipping?: boolean;
  onSale?: boolean;
  sortBy?:
    | "relevance"
    | "price_asc"
    | "price_desc"
    | "rating"
    | "newest"
    | "bestselling";
  limit?: number;
  offset?: number;
}

export async function searchProducts(filters: SearchFilters) {
  // NOT CACHED: Query-dependent and includes real-time pricing/stock filters
  // Search results vary too much by query and filters to cache effectively
  try {
    const user = await getUser();
    const sessionId = await getSessionId();
    const locale = (await getLocale()) as ProductLocale;

    // Build search conditions
    const conditions = [eq(products.isActive, true)];

    // Text search across product_translations (en + ar) and products.sku
    if (filters.query) {
      const searchPattern = `%${filters.query}%`;
      conditions.push(
        or(
          sql`EXISTS (
            SELECT 1 FROM product_translations pt
            WHERE pt.product_id = ${products.id}
            AND pt.locale IN ('en', 'ar')
            AND (pt.title ILIKE ${searchPattern} OR pt.description ILIKE ${searchPattern} OR pt.bullet_points::text ILIKE ${searchPattern})
          )`,
          like(products.sku, searchPattern)
        ) as any
      );
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      conditions.push(inArray(products.categoryId, filters.categories));
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      conditions.push(inArray(products.brandId, filters.brands));
    }

    // Seller filter
    if (filters.sellers && filters.sellers.length > 0) {
      conditions.push(inArray(products.sellerId, filters.sellers));
    }

    // Price range
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

    // Rating filter
    if (filters.minRating !== undefined) {
      conditions.push(gte(products.averageRating, filters.minRating));
    }

    // Condition filter
    if (filters.conditions && filters.conditions.length > 0) {
      conditions.push(inArray(products.condition, filters.conditions as any));
    }

    // Fulfillment type filter
    if (filters.fulfillmentTypes && filters.fulfillmentTypes.length > 0) {
      conditions.push(
        inArray(products.fulfillmentType, filters.fulfillmentTypes as any)
      );
    }

    // Stock filter
    if (filters.inStock) {
      conditions.push(sql`${products.quantity} > 0`);
    }

    // Free shipping filter (simplified - you might want to add shipping cost field)
    if (filters.freeShipping) {
      conditions.push(sql`${products.price}->>'freeShipping' = 'true'`);
    }

    // On sale filter
    if (filters.onSale) {
      conditions.push(
        and(
          sql`${products.price}->>'discount' IS NOT NULL`,
          sql`(${products.price}->>'discount')::numeric > 0`
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
        orderBy.push(desc(products.averageRating), desc(products.reviewCount));
        break;
      case "newest":
        orderBy.push(desc(products.createdAt));
        break;
      case "bestselling":
        orderBy.push(desc(products.isMostSelling), desc(products.reviewCount));
        break;
      case "relevance":
      default:
        orderBy.push(desc(products.averageRating));
    }

    // Execute search
    const searchResultsRaw = await db.query.products.findMany({
      where: and(...conditions),
      with: {
        brand: {
          columns: {
            name: true,
            slug: true,
          },
        },
        seller: {
          columns: {
            displayName: true,
            slug: true,
            storeRating: true,
          },
        },
        productTranslations: true,
      },
      orderBy,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    });

    const searchResults = searchResultsRaw.map((p) => {
      const translations = (p as { productTranslations?: Array<{ locale: string; title: string; description?: string | null; bulletPoints?: unknown; slug?: string | null; metaTitle?: string | null; metaDescription?: string | null }> }).productTranslations;
      const translation = pickTranslationFromArray(translations ?? [], locale);
      return mergeProductWithTranslation(p as Record<string, unknown>, translation);
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(and(...conditions));

    // Log search
    await logSearch({
      query: filters.query,
      filters,
      resultCount: searchResults.length,
      userId: user?.user.id,
      sessionId,
    });

    // Get aggregations for filters
    const aggregations = await getSearchAggregations(conditions);

    return {
      success: true,
      data: {
        products: searchResults,
        totalCount: Number(totalCount[0]?.count),
        hasMore:
          (filters.offset || 0) + searchResults.length <
          Number(totalCount[0]?.count),
        aggregations,
      },
    };
  } catch (error) {
    console.error("Error searching products:", error);
    return { success: false, error: "Failed to search products" };
  }
}

async function getSearchAggregations(baseConditions: any[]) {
  try {
    // Get category counts
    const categoryAggs = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(and(...baseConditions))
      .groupBy(products.categoryId)
      .limit(10);

    // Get brand counts
    const brandAggs = await db
      .select({
        brandId: products.brandId,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(and(...baseConditions))
      .groupBy(products.brandId)
      .limit(10);

    // Get price range
    const priceRange = await db
      .select({
        min: sql<number>`MIN((${products.price}->>'current')::numeric)`,
        max: sql<number>`MAX((${products.price}->>'current')::numeric)`,
      })
      .from(products)
      .where(and(...baseConditions));

    // Get condition counts
    const conditionAggs = await db
      .select({
        condition: products.condition,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(and(...baseConditions))
      .groupBy(products.condition);

    return {
      categories: categoryAggs,
      brands: brandAggs,
      priceRange: priceRange[0],
      conditions: conditionAggs,
    };
  } catch (error) {
    console.error("Error getting aggregations:", error);
    return null;
  }
}

async function logSearch(data: {
  query: string;
  filters: any;
  resultCount: number;
  userId?: string;
  sessionId?: string;
}) {
  try {
    await db.insert(searchLogs).values({
      userId: data.userId,
      sessionId: data.sessionId,
      query: data.query,
      filters: data.filters,
      resultCount: data.resultCount,
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : null,
    });
  } catch (error) {
    console.error("Error logging search:", error);
    // Don't throw - logging failure shouldn't break search
  }
}

export async function logProductClick(productId: string, searchQuery?: string) {
  try {
    const user = await getUser();
    const sessionId = await getSessionId();

    await db.insert(searchLogs).values({
      userId: user?.user.id,
      sessionId,
      query: searchQuery || "",
      clickedProductId: productId,
    });
  } catch (error) {
    console.error("Error logging product click:", error);
  }
}

export async function searchSuggestions(query: string) {
  // CACHED: Semi-dynamic public data - search suggestions change infrequently
  // Note: Recent searches are user-specific but cached separately per user
  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }

  const user = await getUser();
  const locale = await getLocale();
  const cacheKey = `search-suggestions-${query.toLowerCase()}-${locale}-${user?.user.id || "anon"}`;

  return unstable_cache(
    async () => {
      try {
        const searchPattern = `${query}%`;
        const categoryNameColumn = locale === "ar" ? categories.nameAr : categories.name;

        // Get product title suggestions from product_translations
        const productSuggestions = await db
          .select({
            suggestion: productTranslations.title,
            type: sql<string>`'product'`,
          })
          .from(productTranslations)
          .innerJoin(products, eq(productTranslations.productId, products.id))
          .where(
            and(
              eq(productTranslations.locale, "en"),
              like(productTranslations.title, searchPattern),
              eq(products.isActive, true)
            )
          )
          .limit(5);

        // Get brand suggestions
        const brandSuggestions = await db
          .select({
            suggestion: brands.name,
            type: sql<string>`'brand'`,
          })
          .from(brands)
          .where(like(brands.name, searchPattern))
          .limit(3);

        // Get category suggestions
        const categorySuggestions = await db
          .select({
            suggestion: categoryNameColumn,
            type: sql<string>`'category'`,
          })
          .from(categories)
          .where(like(categoryNameColumn, searchPattern))
          .limit(3);

        // Get recent searches (if user is logged in)
        let recentSearches: any[] = [];
        if (user) {
          recentSearches = await db
            .selectDistinct({
              suggestion: searchLogs.query,
              type: sql<string>`'recent'`,
            })
            .from(searchLogs)
            .where(
              and(
                eq(searchLogs.userId, user.user.id),
                like(searchLogs.query, searchPattern)
              )
            )
            .orderBy(desc(searchLogs.createdAt))
            .limit(3);
        }

        const allSuggestions = [
          ...productSuggestions,
          ...brandSuggestions,
          ...categorySuggestions,
          ...recentSearches,
        ];

        return { success: true, data: allSuggestions };
      } catch (error) {
        console.error("Error getting suggestions:", error);
        return { success: false, error: "Failed to get suggestions" };
      }
    },
    [cacheKey],
    {
      tags: ["search-suggestions"],
      revalidate: 300, // 5 minutes - suggestions change infrequently
    }
  )();
}

export async function getTrendingSearches() {
  // CACHED: Semi-dynamic public data - trending searches change hourly
  return unstable_cache(
    async () => {
      try {
        const trending = await db
          .select({
            query: searchLogs.query,
            count: sql<number>`count(*)`,
          })
          .from(searchLogs)
          .where(
            and(
              sql`${searchLogs.createdAt} > NOW() - INTERVAL '7 days'`,
              sql`${searchLogs.query} != ''`
            )
          )
          .groupBy(searchLogs.query)
          .orderBy(desc(sql`count(*)`))
          .limit(10);

        return { success: true, data: trending };
      } catch (error) {
        console.error("Error getting trending searches:", error);
        return { success: false, error: "Failed to get trending searches" };
      }
    },
    ["trending-searches"],
    {
      tags: ["search", "trending-searches"],
      revalidate: 3600, // 1 hour - trending searches update hourly
    }
  )();
}

export async function getRecentSearches() {
  // NOT CACHED: User-specific private data - each user has different recent searches
  try {
    const user = await getUser();
    if (!user) {
      return { success: true, data: [] };
    }

    const recent = await db
      .selectDistinct({
        query: searchLogs.query,
        createdAt: searchLogs.createdAt,
      })
      .from(searchLogs)
      .where(
        and(eq(searchLogs.userId, user.user.id), sql`${searchLogs.query} != ''`)
      )
      .orderBy(desc(searchLogs.createdAt))
      .limit(10);

    return { success: true, data: recent };
  } catch (error) {
    console.error("Error getting recent searches:", error);
    return { success: false, error: "Failed to get recent searches" };
  }
}

export async function clearSearchHistory() {
  // NOT CACHED: Mutation - deletes user's search history
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    await db.delete(searchLogs).where(eq(searchLogs.userId, user.user.id));

    return { success: true, message: "Search history cleared" };
  } catch (error) {
    console.error("Error clearing search history:", error);
    return { success: false, error: "Failed to clear search history" };
  }
}

export async function globalSearch(query: string) {
  // CACHED: Semi-dynamic public data - global search results change infrequently
  if (!query || query.length < 2) {
    return {
      success: true,
      data: {
        products: [],
        brands: [],
        categories: [],
        sellers: [],
      },
    };
  }

  const locale = await getLocale();
  return unstable_cache(
    async () => {
      try {
        const searchPattern = `%${query}%`;
        const categoryNameColumn = locale === "ar" ? categories.nameAr : categories.name;

        // Search products via product_translations
        const searchPatternForProducts = `%${query}%`;
        const productResultsRaw = await db.query.products.findMany({
          where: and(
            eq(products.isActive, true),
            sql`EXISTS (
              SELECT 1 FROM product_translations pt
              WHERE pt.product_id = ${products.id}
              AND pt.locale = 'en'
              AND (pt.title ILIKE ${searchPatternForProducts} OR pt.description ILIKE ${searchPatternForProducts})
            )`
          ),
          limit: 5,
          with: {
            brand: true,
            productTranslations: true,
          },
        });
        const productResults = productResultsRaw.map((p) => {
          const translations = (p as { productTranslations?: Array<{ locale: string; title: string; description?: string | null; bulletPoints?: unknown; slug?: string | null; metaTitle?: string | null; metaDescription?: string | null }> }).productTranslations;
          const translation = pickTranslationFromArray(translations ?? [], locale as ProductLocale);
          return mergeProductWithTranslation(p as Record<string, unknown>, translation);
        });

        // Search brands
        const brandResults = await db.query.brands.findMany({
          where: like(brands.name, searchPattern),
          limit: 3,
        });

        // Search categories
        const categoryResults = await db.query.categories.findMany({
          where: like(categoryNameColumn, searchPattern),
          limit: 3,
        });

        // Search sellers
        const sellerResults = await db.query.sellers.findMany({
          where: and(
            eq(sellers.status, "approved"),
            or(
              like(sellers.displayName, searchPattern),
              like(sellers.businessName, searchPattern)
            )
          ),
          limit: 3,
          columns: {
            id: true,
            displayName: true,
            slug: true,
            logoUrl: true,
            storeRating: true,
          },
        });

        return {
          success: true,
          data: {
            products: productResults,
            brands: brandResults,
            categories: categoryResults,
            sellers: sellerResults,
          },
        };
      } catch (error) {
        console.error("Error in global search:", error);
        return { success: false, error: "Failed to search" };
      }
    },
    [`global-search-${locale}-${query.toLowerCase()}`],
    {
      tags: ["search", "global-search"],
      revalidate: 600, // 10 minutes - global search results change infrequently
    }
  )();
}
