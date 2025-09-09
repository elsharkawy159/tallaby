
"use server";

import { db } from "@workspace/db";
import { brands, products } from "@workspace/db";
import { eq, and, desc, sql, like, asc, or } from "drizzle-orm";

export async function getAllBrands(params?: {
  verified?: boolean;
  official?: boolean;
  sortBy?: 'name' | 'products' | 'rating';
  limit?: number;
  offset?: number;
}) {
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
      case 'products':
        orderBy.push(desc(brands.productCount));
        break;
      case 'rating':
        orderBy.push(desc(brands.averageRating));
        break;
      case 'name':
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
}

export async function getBrandBySlug(slug: string) {
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
      .where(and(
        eq(products.brandId, brand.id),
        eq(products.isActive, true)
      ));

    return { 
      success: true, 
      data: {
        ...brand,
        productCount: productCount[0]?.count || 0,
      }
    };
  } catch (error) {
    console.error("Error fetching brand:", error);
    return { success: false, error: "Failed to fetch brand" };
  }
}

export async function getPopularBrands() {
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
}

export async function getFeaturedBrands() {
  try {
    const featuredBrands = await db.query.brands.findMany({
      where: and(
        eq(brands.isVerified, true),
        eq(brands.isOfficial, true)
      ),
      orderBy: [desc(brands.averageRating)],
      limit: 8,
    });

    return { success: true, data: featuredBrands };
  } catch (error) {
    console.error("Error fetching featured brands:", error);
    return { success: false, error: "Failed to fetch featured brands" };
  }
}

export async function searchBrands(query: string) {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const searchResults = await db.query.brands.findMany({
      where: or(
        like(brands.name, `%${query}%`),
        like(brands.description, `%${query}%`)
      ),
      orderBy: [desc(brands.isVerified), desc(brands.productCount)],
      limit: 10,
    });

    return { success: true, data: searchResults };
  } catch (error) {
    console.error("Error searching brands:", error);
    return { success: false, error: "Failed to search brands" };
  }
}

export async function getBrandsByCategory(categoryId: string) {
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
      .innerJoin(products, and(
        eq(products.brandId, brands.id),
        eq(products.categoryId, categoryId),
        eq(products.isActive, true)
      ))
      .groupBy(brands.id)
      .orderBy(desc(sql`count(${products.id})`))
      .limit(20);

    return { success: true, data: brandsInCategory };
  } catch (error) {
    console.error("Error fetching category brands:", error);
    return { success: false, error: "Failed to fetch brands" };
  }
}

export async function getAlphabeticalBrands() {
  try {
    // Get brands grouped by first letter
    const brandsByLetter = await db.query.brands.findMany({
      orderBy: [asc(brands.name)],
    });

    // Group by first letter
    const grouped = brandsByLetter.reduce((acc, brand) => {
      const firstLetter = brand.name[0]?.toUpperCase() || "";
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(brand);
      return acc;
    }, {} as Record<string, typeof brandsByLetter>);

    return { success: true, data: grouped };
  } catch (error) {
    console.error("Error fetching alphabetical brands:", error);
    return { success: false, error: "Failed to fetch brands" };
  }
}