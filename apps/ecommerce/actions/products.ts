"use server";

import {
  db,
  productAnswers,
  products,
  productVariants,
  productTranslations,
  reviews,
  reviewComments,
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
} from "@workspace/db"
import {
  getProductIdBySlug,
  getProductTranslationWithFallback,
  mergeProductWithTranslation,
  pickTranslationFromArray,
  type ProductLocale,
} from "@/lib/product-translations"
import { getUser } from "./auth";
import { unstable_cache } from "next/cache";
import { brandTags, cacheProfiles, categoryTags, createCachedQuery, productTags } from "@workspace/cache";

interface ProductFilters {
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  condition?: string;
  sellerId?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isSeasonal?: boolean;
  searchQuery?: string;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular";
  limit?: number;
  offset?: number;
  locale?: ProductLocale;
}

export const getProducts = createCachedQuery({
  name: "ecommerce:products:list",
  ttl: cacheProfiles.listing,
  // categoryName/brandName resolve to an id inside the query, so a
  // name-filtered call can only be tagged with the general listing tag —
  // it still gets purged by any structural product change (see
  // invalidateProduct in packages/cache/src/invalidate.ts), just not by a
  // change scoped to a single OTHER category/brand.
  tags: (filters: ProductFilters) => {
    const tags = [productTags.listing()];
    if (filters.categoryId) tags.push(productTags.category(filters.categoryId));
    if (filters.brandId) tags.push(productTags.brand(filters.brandId));
    if (filters.sellerId) tags.push(productTags.seller(filters.sellerId));
    if (filters.isFeatured) tags.push(productTags.featured());
    if (filters.isTrending) tags.push(productTags.trending());
    if (filters.isSeasonal) tags.push(productTags.seasonal());
    return tags;
  },
  query: async (filters: ProductFilters = {}) => {
    try {
      const locale = (filters.locale ?? "en") as ProductLocale
      // Storefront visibility: an admin-approved product the seller has left on.
      const conditions = [eq(products.status, "active")];

      if (filters.categoryId) {
        conditions.push(eq(products.categoryId, filters.categoryId));
      }

      if (filters.categoryName) {
        const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, filters.categoryName!)).limit(1)
        if (cat) conditions.push(eq(products.categoryId, cat.id))
      }

      if (filters.brandId) {
        conditions.push(eq(products.brandId, filters.brandId));
      }

      if (filters.brandName) {
        const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.name, filters.brandName!)).limit(1)
        if (brand) conditions.push(eq(products.brandId, brand.id))
      }

      if (filters.minPrice !== undefined) {
        conditions.push(
          sql`(${products.price}->>'final')::numeric >= ${filters.minPrice}`
        );
      }

      if (filters.maxPrice !== undefined) {
        conditions.push(
          sql`(${products.price}->>'final')::numeric <= ${filters.maxPrice}`
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

      if (filters.isTrending !== undefined) {
        conditions.push(eq(products.isTrending, filters.isTrending));
      }

      if (filters.isSeasonal !== undefined) {
        conditions.push(eq(products.isSeasonal, filters.isSeasonal));
      }

      if (filters.searchQuery) {
        const pattern = `%${filters.searchQuery}%`;
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM product_translations pt
            WHERE pt.product_id = ${products.id}
            AND pt.locale IN ('en', 'ar')
            AND (pt.title ILIKE ${pattern} OR pt.description ILIKE ${pattern})
          )`
        );
      }

      // Determine ordering
      let orderBy = [];
      switch (filters.sortBy) {
        case "price_asc":
          orderBy.push(asc(sql`(${products.price}->>'final')::numeric`));
          break;
        case "price_desc":
          orderBy.push(desc(sql`(${products.price}->>'final')::numeric`));
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

      const productsListRaw = await db.query.products.findMany({
        where: and(...conditions),
        with: {
          brand: true,
          category: true,
          productTranslations: true,
          productVariants: {
            columns: {
              id: true,
              localized: true,
              option1: true,
              option2: true,
              option3: true,
              images: true,
              imageUrl: true,
              position: true,
            },
            orderBy: [asc(productVariants.position)],
          },
        },
        orderBy,
        limit: filters.limit || 30,
        offset: filters.offset || 0,
        extras: {
          totalCount: sql<number>`count(*) over ()`.as("total_count"),
        },
      })

      type ProductWithTranslations = Record<string, unknown> & {
        totalCount: number
        productTranslations?: Array<{ locale: string; title: string; description?: string | null; bulletPoints?: unknown; slug?: string | null; metaTitle?: string | null; metaDescription?: string | null }>
      }
      const productsList = (productsListRaw as ProductWithTranslations[]).map((p) => {
        const translation = pickTranslationFromArray(p.productTranslations ?? [], locale)
        return mergeProductWithTranslation(p, translation)
      })

      // count(*) over () on the same query replaces a second round-trip count query.
      const totalCount = (productsListRaw[0] as ProductWithTranslations | undefined)?.totalCount ?? 0;

      return {
        success: true,
        data: productsList,
        totalCount: Number(totalCount),
        hasMore:
          (filters.offset || 0) + productsList.length < Number(totalCount),
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
});

export const getProductBySlug = createCachedQuery({
  name: "ecommerce:products:by-slug",
  ttl: cacheProfiles.detail,
  // The product id isn't known until the slug lookup runs, so this can only
  // be tagged by slug — but invalidateProduct() always includes the
  // CURRENT slug tag on every mutation (not just slug changes), so this is
  // still purged by every create/update/delete/price/visibility change.
  tags: (slug: string, locale: ProductLocale = "en") => [productTags.slug(locale, slug)],
  query: async (slug: string, locale: ProductLocale = "en") => {
      try {
        const productId = await getProductIdBySlug(slug, locale)
        if (!productId) {
          return { success: false, error: "Product not found" }
        }

        const product = await db.query.products.findFirst({
          where: and(
            eq(products.id, productId),
            eq(products.status, "active"),
          ),
          with: {
            brand: true,
            category: true,
            seller: {
              columns: {
                id: true,
                displayName: true,
                slug: true,
                storeRating: true,
                positiveRatingPercent: true,
                totalRatings: true,
                freeDelivery: true,
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
                reviewVotes: true,
                reviewComments: {
                  where: isNotNull(reviewComments.sellerId),
                  limit: 1,
                  with: {
                    user: {
                      columns: {
                        fullName: true,
                        avatarUrl: true,
                      },
                    },
                  },
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
        })

        if (!product) {
          return { success: false, error: "Product not found" }
        }

        // Apply locale fallback: ar uses product_translations.ar if exists else en
        const translation = await getProductTranslationWithFallback(product.id, locale)
        const merged = mergeProductWithTranslation(product, translation)

        const relatedProductsRaw = await db.query.products.findMany({
          where: and(
            eq(products.categoryId, product.categoryId),
            eq(products.status, "active"),
            sql`${products.id} != ${product.id}`
          ),
          with: {
            brand: true,
            productTranslations: true,
            productVariants: {
              columns: {
                id: true,
                localized: true,
                option1: true,
                option2: true,
                option3: true,
                images: true,
                imageUrl: true,
                position: true,
              },
              orderBy: [asc(productVariants.position)],
            },
          },
          limit: 8,
          orderBy: [desc(products.averageRating)],
        })

        const relatedProducts = relatedProductsRaw.map((p) => {
          const t = pickTranslationFromArray(p.productTranslations ?? [], locale)
          return mergeProductWithTranslation(p, t)
        })

        return {
          success: true,
          data: {
            ...merged,
            relatedProducts,
          },
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        return { success: false, error: "Failed to fetch product" }
      }
  },
});

export async function getProductVariants(productId: string) {
  // NOT CACHED: Real-time data - inventory and pricing change frequently
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
  return unstable_cache(
    async () => {
      try {
        const featured = await db.query.products.findMany({
          where: and(
            eq(products.status, "active"),
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
      tags: [productTags.listing(), productTags.featured()],
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
            eq(products.status, "active"),
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
      tags: [productTags.listing(), productTags.bestSelling()],
      revalidate: 180,
    }
  )();
}

export async function getTrendingMerchandisedProducts() {
  return unstable_cache(
    async () => {
      try {
        const trending = await db.query.products.findMany({
          where: and(
            eq(products.status, "active"),
            eq(products.isTrending, true)
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
          orderBy: [desc(products.updatedAt)],
        });

        return { success: true, data: trending };
      } catch (error) {
        console.error("Error fetching trending merchandised products:", error);
        return { success: false, error: "Failed to fetch trending products" };
      }
    },
    ["trending-merchandised-products"],
    {
      tags: [productTags.listing(), productTags.trending()],
      revalidate: 120,
    }
  )();
}

export async function getSeasonalProducts() {
  return unstable_cache(
    async () => {
      try {
        const seasonal = await db.query.products.findMany({
          where: and(
            eq(products.status, "active"),
            eq(products.isSeasonal, true)
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
          orderBy: [desc(products.updatedAt)],
        });

        return { success: true, data: seasonal };
      } catch (error) {
        console.error("Error fetching seasonal products:", error);
        return { success: false, error: "Failed to fetch seasonal products" };
      }
    },
    ["seasonal-products"],
    {
      tags: [productTags.listing(), productTags.seasonal()],
      revalidate: 120,
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
            eq(products.status, "active"),
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
      tags: [productTags.listing(), productTags.newArrivals()],
      revalidate: 300,
    }
  )();
}

export async function getDeals() {
  // NOT CACHED: Real-time data - pricing and discounts change frequently
  try {
    const deals = await db.query.products.findMany({
      where: and(
        eq(products.status, "active"),
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

export async function getProductsByCategory(categoryId: string, limit: number) {
  return unstable_cache(
    async () => {
      try {
        const categoryProducts = await db.query.products.findMany({
          where: and(
            eq(products.categoryId, categoryId),
            eq(products.status, "active"),
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
      tags: [productTags.listing(), productTags.category(categoryId)],
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
            eq(products.status, "active"),
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
      tags: [productTags.listing(), productTags.brand(brandId)],
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
            eq(products.status, "active"),
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
      tags: [productTags.listing(), productTags.seller(sellerId)],
      revalidate: 180,
    }
  )();
}

export async function getAllProductSlugs() {
  return unstable_cache(
    async () => {
      try {
        const slugsResult = await db
          .select({ slug: productTranslations.slug })
          .from(productTranslations)
          .innerJoin(products, eq(productTranslations.productId, products.id))
          .where(
            and(
              or(
                eq(productTranslations.locale, "en"),
                eq(productTranslations.locale, "ar")
              ),
              eq(products.status, "active"),
              isNotNull(productTranslations.slug)
            )
          )

        const uniqueSlugs = [
          ...new Set(
            slugsResult.map((r) => r.slug).filter(Boolean) as string[]
          ),
        ];

        return {
          success: true,
          data: uniqueSlugs,
        };
      } catch (error) {
        console.error("Error fetching product slugs:", error);
        return { success: false, error: "Failed to fetch product slugs" };
      }
    },
    ["all-product-slugs"],
    {
      tags: [productTags.all()],
      revalidate: 3600, // 1 hour - slugs change infrequently
    }
  )();
}

/**
 * Every product translation slug paired with its locale (and the parent
 * product's updatedAt). Used for [locale]/products/[slug] generateStaticParams
 * and the sitemap — unlike getAllProductSlugs, this keeps locale+slug together
 * so a slug that exists in only one locale doesn't get a static param for the
 * other.
 */
export async function getAllProductTranslationSlugs() {
  return unstable_cache(
    async () => {
      try {
        const rows = await db
          .select({
            productId: productTranslations.productId,
            locale: productTranslations.locale,
            slug: productTranslations.slug,
            updatedAt: products.updatedAt,
          })
          .from(productTranslations)
          .innerJoin(products, eq(productTranslations.productId, products.id))
          .where(
            and(
              or(
                eq(productTranslations.locale, "en"),
                eq(productTranslations.locale, "ar")
              ),
              eq(products.status, "active"),
              isNotNull(productTranslations.slug)
            )
          )

        const data = rows
          .filter(
            (r): r is typeof r & { locale: ProductLocale; slug: string } =>
              !!r.slug && (r.locale === "en" || r.locale === "ar")
          )
          .map((r) => ({
            productId: r.productId,
            locale: r.locale,
            slug: r.slug,
            updatedAt: r.updatedAt,
          }))

        return { success: true, data }
      } catch (error) {
        console.error("Error fetching product translation slugs:", error);
        return { success: false, error: "Failed to fetch product translation slugs" };
      }
    },
    ["all-product-translation-slugs"],
    {
      tags: [productTags.all()],
      revalidate: 3600, // 1 hour - slugs change infrequently
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
            nameAr: categories.nameAr,
            slug: categories.slug,
            productCount: sql<number>`COUNT(${products.id})`,
          })
          .from(categories)
          .leftJoin(
            products,
            and(
              eq(products.categoryId, categories.id),
              eq(products.status, "active")
            )
          )
          .groupBy(categories.id, categories.name, categories.nameAr, categories.slug)
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
            and(
              eq(products.brandId, brands.id),
              eq(products.status, "active")
            )
          )
          .groupBy(brands.id, brands.name, brands.slug)
          .having(sql`COUNT(${products.id}) > 0`)
          .orderBy(brands.name);

        // Get price range
        const priceRange = await db
          .select({
            minPrice: sql<number>`MIN((${products.price}->>'final')::numeric)`,
            maxPrice: sql<number>`MAX((${products.price}->>'final')::numeric)`,
          })
          .from(products)
          .where(eq(products.status, "active"));

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
      tags: [productTags.filterOptions(), categoryTags.all(), brandTags.all()],
      revalidate: 600,
    }
  )();
}

// NOT CACHED: Mutation - creates new product question
export async function submitProductQuestion(
  productId: string,
  question: string
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Please sign in to ask a question" };
    }

    // Validate question
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || trimmedQuestion.length < 10) {
      return {
        success: false,
        error: "Question must be at least 10 characters long",
      };
    }

    if (trimmedQuestion.length > 500) {
      return {
        success: false,
        error: "Question must be less than 500 characters",
      };
    }

    // Verify product exists and is active. `slug` is not a column on
    // `products` (it lives on product_translations) — selecting it here
    // previously threw at the database level on every call.
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.status, "active")),
      columns: { id: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Insert question with pending status (needs moderation)
    const [newQuestion] = await db
      .insert(productQuestions)
      .values({
        productId,
        userId: user.user.id,
        question: trimmedQuestion,
        isAnonymous: false,
        status: "pending",
      } as any)
      .returning();

    // A pending question isn't shown until approved, so no cache bump is
    // needed here — approval happens elsewhere and invalidates then.

    return {
      success: true,
      message: "Your question has been submitted and is pending approval",
      data: newQuestion,
    };
  } catch (error) {
    console.error("Error submitting product question:", error);
    return {
      success: false,
      error: "Failed to submit question. Please try again later.",
    };
  }
}
