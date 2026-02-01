"use server";

import { unstable_cache } from "next/cache";
import { db } from "@workspace/db";
import {
  brands,
  products,
  eq,
  and,
  desc,
  sql,
  ilike,
  asc,
  or,
} from "@workspace/db";

export async function getAllBrands(params?: {
  verified?: boolean;
  official?: boolean;
  sortBy?: "name" | "products" | "rating";
  limit?: number;
  offset?: number;
}) {
  // CACHED: Static global data - brands change infrequently
  const cacheKey = `all-brands-${JSON.stringify(params)}`;

  return unstable_cache(
    async () => {
      try {
        const conditions = [];

        if (params?.verified) {
          conditions.push(eq(brands.isVerified, true));
        }

        if (params?.official) {
          conditions.push(eq(brands.isOfficial, true));
        }

        let orderBy = [];
        switch (params?.sortBy) {
          case "products":
            orderBy.push(desc(brands.productCount));
            break;
          case "rating":
            orderBy.push(desc(brands.averageRating));
            break;
          case "name":
          default:
            orderBy.push(asc(brands.name));
        }

        const brandList = await db.query.brands.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy,
          limit: params?.limit || 50,
          offset: params?.offset || 0,
        });

        return { success: true, data: brandList };
      } catch (error) {
        console.error("Error fetching brands:", error);
        return { success: false, error: "Failed to fetch brands" };
      }
    },
    [cacheKey],
    {
      tags: ["brands"],
      revalidate: 86400, // 24 hours - brands change infrequently
    }
  )();
}

export async function getBrandBySlug(slug: string) {
  // CACHED: Static global data - brand details change infrequently
  return unstable_cache(
    async () => {
      try {
        const brand = await db.query.brands.findFirst({
          where: eq(brands.slug, slug),
        });

        if (!brand) {
          return { success: false, error: "Brand not found" };
        }

        // Get product count
        const productCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(
            and(eq(products.brandId, brand.id), eq(products.isActive, true))
          );

        return {
          success: true,
          data: {
            ...brand,
            productCount: productCount[0]?.count || 0,
          },
        };
      } catch (error) {
        console.error("Error fetching brand:", error);
        return { success: false, error: "Failed to fetch brand" };
      }
    },
    [`brand-${slug}`],
    {
      tags: ["brands", `brand-${slug}`],
      revalidate: 86400, // 24 hours - brands change infrequently
    }
  )();
}

export async function getPopularBrands() {
  // CACHED: Static global data - popular brands change infrequently
  return unstable_cache(
    async () => {
      try {
        const popularBrands = await db.query.brands.findMany({
          where: eq(brands.isVerified, true),
          orderBy: [desc(brands.productCount), desc(brands.averageRating)],
          limit: 12,
        });

        return { success: true, data: popularBrands };
      } catch (error) {
        console.error("Error fetching popular brands:", error);
        return { success: false, error: "Failed to fetch popular brands" };
      }
    },
    ["popular-brands"],
    {
      tags: ["brands", "popular-brands"],
      revalidate: 3600, // 1 hour - popularity metrics change more frequently
    }
  )();
}

export async function getFeaturedBrands() {
  // CACHED: Static global data - featured brands change infrequently
  return unstable_cache(
    async () => {
      try {
        const featuredBrands = await db.query.brands.findMany({
          where: and(eq(brands.isVerified, true), eq(brands.isOfficial, true)),
          orderBy: [desc(brands.averageRating)],
          limit: 8,
        });

        return { success: true, data: featuredBrands };
      } catch (error) {
        console.error("Error fetching featured brands:", error);
        return { success: false, error: "Failed to fetch featured brands" };
      }
    },
    ["featured-brands"],
    {
      tags: ["brands", "featured-brands"],
      revalidate: 86400, // 24 hours - featured brands change infrequently
    }
  )();
}

export async function searchBrands(query: string) {
  // CACHED: Static global data - brand search results change infrequently
  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }

  return unstable_cache(
    async () => {
      try {
        const searchResults = await db.query.brands.findMany({
          where: or(
            ilike(brands.name, `%${query}%`),
            ilike(brands.description, `%${query}%`)
          ),
          orderBy: [desc(brands.isVerified), desc(brands.productCount)],
          limit: 10,
        });

        return { success: true, data: searchResults };
      } catch (error) {
        console.error("Error searching brands:", error);
        return { success: false, error: "Failed to search brands" };
      }
    },
    [`brand-search-${query.toLowerCase()}`],
    {
      tags: ["brands", "brand-search"],
      revalidate: 3600, // 1 hour - search results change infrequently
    }
  )();
}

export async function getBrandsByCategory(categoryId: string) {
  // CACHED: Semi-dynamic public data - category-brand relationships change infrequently
  return unstable_cache(
    async () => {
      try {
        const brandsInCategory = await db
          .selectDistinct({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            logoUrl: brands.logoUrl,
            isVerified: brands.isVerified,
            productCount: sql<number>`count(${products.id})`,
          })
          .from(brands)
          .innerJoin(
            products,
            and(
              eq(products.brandId, brands.id),
              eq(products.categoryId, categoryId),
              eq(products.isActive, true)
            )
          )
          .groupBy(brands.id)
          .orderBy(desc(sql`count(${products.id})`))
          .limit(20);

        return { success: true, data: brandsInCategory };
      } catch (error) {
        console.error("Error fetching category brands:", error);
        return { success: false, error: "Failed to fetch brands" };
      }
    },
    [`brands-category-${categoryId}`],
    {
      tags: ["brands", `category-${categoryId}`],
      revalidate: 3600, // 1 hour - category-brand relationships change infrequently
    }
  )();
}

export async function getAlphabeticalBrands() {
  // CACHED: Static global data - alphabetical brand listing changes infrequently
  return unstable_cache(
    async () => {
      try {
        // Get brands grouped by first letter
        const brandsByLetter = await db.query.brands.findMany({
          orderBy: [asc(brands.name)],
        });

        // Group by first letter
        const grouped = brandsByLetter.reduce(
          (acc, brand) => {
            const firstLetter = brand.name[0]?.toUpperCase() || "";
            if (!acc[firstLetter]) {
              acc[firstLetter] = [];
            }
            acc[firstLetter].push(brand);
            return acc;
          },
          {} as Record<string, typeof brandsByLetter>
        );

        return { success: true, data: grouped };
      } catch (error) {
        console.error("Error fetching alphabetical brands:", error);
        return { success: false, error: "Failed to fetch brands" };
      }
    },
    ["alphabetical-brands"],
    {
      tags: ["brands", "alphabetical-brands"],
      revalidate: 86400, // 24 hours - alphabetical listing changes infrequently
    }
  )();
}
