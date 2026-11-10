"use server";

import {
  db,
  productAnswers,
  products,
  productVariants,
  reviews,
  reviewComments,
  productQuestions,
  categories,
  brands,
  eq,
  and,
  or,
  sql,
  desc,
  asc,
  isNotNull,
} from "@workspace/db"
import { productShownInStore } from "@workspace/lib/stores/scope/server"
import { getProducts } from "@/lib/products/product-list.server"
import { isSwitchOn } from "@/lib/platform-switches.server"
import {
  getProductIdBySlug,
  getProductTranslationWithFallback,
  mergeProductWithTranslation,
  pickTranslationFromArray,
  type ProductLocale,
} from "@/lib/product-translations"
import { getUser } from "./auth";
import { unstable_cache } from "next/cache";
import { brandTags, cacheProfiles, categoryTags, createCachedQuery, productTags, storeTags } from "@workspace/cache";

/**
 * The tallaby.com header search (components/layout/search-bar.tsx, a client
 * component): up to 5 active products whose title or description has the
 * words. Only the words and the language come from the browser: no seller,
 * store or other filter, so a client can't read a store list it picks
 * (`getProducts` is server-only since F-87c slice 6). Same query as before.
 */
export async function searchProductsByText(query: string, locale: ProductLocale = "en") {
  const words = typeof query === "string" ? query.trim().slice(0, 100) : ""
  if (!words) return { success: true, data: [], totalCount: 0, hasMore: false }
  return getProducts({ searchQuery: words, limit: 5, locale: locale === "ar" ? "ar" : "en" })
}


/**
 * One store's product page by slug. `sellerId` and `storeId` are the store
 * the request host resolved, never a client value. The catalog-split switch is
 * read here, outside the cached function, and is part of its key (F-87c).
 */
export async function getProductBySlug(sellerId: string, storeId: string, slug: string, locale: ProductLocale = "en") {
  const catalogSplit = await isSwitchOn("stores_catalog_split")
  return loadProductBySlug(sellerId, storeId, slug, locale, catalogSplit)
}

const loadProductBySlug = createCachedQuery({
  name: "ecommerce:products:by-slug:v2",
  ttl: cacheProfiles.detail,
  // One store's product: slugs repeat across sellers (and, after the catalog
  // split, across a seller's stores), so the store is in the key and in every
  // condition: the product and its related products are ones this store shows
  // (`productInStore`, scope `shown`). The product id isn't known until the slug
  // lookup runs, so this is tagged by seller and store: invalidateProduct()
  // always includes the seller tag (old and new slug alike, every
  // create/update/delete/price/visibility change) and the product's store tag;
  // the store's catalog tag covers a change of its picks.
  tags: (sellerId: string, storeId: string, _slug: string, _locale: ProductLocale, _catalogSplit: boolean) => [
    productTags.seller(sellerId),
    productTags.store(sellerId, storeId),
    storeTags.catalog(sellerId, storeId),
  ],
  query: async (sellerId: string, storeId: string, slug: string, locale: ProductLocale, catalogSplit: boolean) => {
      try {
        const shown = productShownInStore({ storeId, catalogSplit })
        // Before the split the slug is looked up per seller, as before; after it per store.
        const productId = await getProductIdBySlug(slug, locale, { sellerId, storeId, catalogSplit })
        if (!productId) {
          return { success: false, error: "Product not found" }
        }

        const product = await db.query.products.findFirst({
          where: and(
            eq(products.id, productId),
            eq(products.sellerId, sellerId),
            eq(products.status, "active"),
            // A slug of a product this store doesn't show opens nothing (the page sends the shopper home).
            shown,
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
            eq(products.sellerId, sellerId),
            eq(products.status, "active"),
            // Only what this store shows (this used to list every product of the seller).
            shown,
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

export async function getFilterOptions() {
  return unstable_cache(
    async () => {
      try {
        // Get all available categories that have products. Category names
        // aren't unique (duplicate rows with the same name/nameAr exist
        // across parents) — group by name so the filter list shows one
        // checkbox per name with a combined product count, matching how
        // getProducts resolves a categoryName filter to every id sharing it.
        const categoriesWithProducts = await db
          .select({
            // Postgres has no MIN(uuid) — compare as text.
            id: sql<string>`MIN(${categories.id}::text)`.as("id"),
            name: categories.name,
            nameAr: categories.nameAr,
            slug: sql<string>`MIN(${categories.slug})`.as("slug"),
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
          .where(
            or(isNotNull(categories.name), isNotNull(categories.nameAr))
          )
          .groupBy(categories.name, categories.nameAr)
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
              // Postgres numeric aggregates can come back as strings over
              // the driver; coerce so the slider always gets real numbers.
              min: Number(priceRange[0]?.minPrice ?? 0),
              max: Number(priceRange[0]?.maxPrice ?? 1000),
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
