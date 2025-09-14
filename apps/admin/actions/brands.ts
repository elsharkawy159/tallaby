"use server";

import { db } from "@workspace/db";
import { brands, products } from "@workspace/db";
import { eq, and, desc, sql, like, asc, or } from "drizzle-orm";
import { getAdminUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getAllBrands(params?: {
  verified?: boolean;
  official?: boolean;
  sortBy?: "name" | "products" | "rating";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser(); // Verify admin access

    const conditions = [];

    if (params?.verified !== undefined) {
      conditions.push(eq(brands.isVerified, params.verified));
    }

    if (params?.official !== undefined) {
      conditions.push(eq(brands.isOfficial, params.official));
    }

    if (params?.search) {
      conditions.push(
        or(
          like(brands.name, `%${params.search}%`),
          like(brands.description, `%${params.search}%`),
          like(brands.website, `%${params.search}%`)
        )
      );
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

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(brands)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      success: true,
      data: brandList,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching brands:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch brands",
    };
  }
}

export async function getBrandById(brandId: string) {
  try {
    await getAdminUser(); // Verify admin access

    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    // Get product count
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.brandId, brand.id), eq(products.isActive, true)));

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
}

export async function createBrand(data: {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  isVerified?: boolean;
  isOfficial?: boolean;
}) {
  try {
    await getAdminUser(); // Verify admin access

    // Check if brand with same slug already exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.slug, data.slug),
    });

    if (existingBrand) {
      return {
        success: false,
        error: "Brand with this slug already exists",
      };
    }

    const newBrand = await db
      .insert(brands)
      .values({
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl || null,
        description: data.description || null,
        website: data.website || null,
        isVerified: data.isVerified || false,
        isOfficial: data.isOfficial || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    revalidatePath("/withAuth/brands");

    return { success: true, data: newBrand[0] };
  } catch (error) {
    console.error("Error creating brand:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create brand",
    };
  }
}

export async function updateBrand(
  brandId: string,
  data: {
    name?: string;
    slug?: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    isVerified?: boolean;
    isOfficial?: boolean;
  }
) {
  try {
    await getAdminUser(); // Verify admin access

    // Check if brand exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!existingBrand) {
      return { success: false, error: "Brand not found" };
    }

    // If slug is being updated, check if new slug already exists
    if (data.slug && data.slug !== existingBrand.slug) {
      const slugExists = await db.query.brands.findFirst({
        where: eq(brands.slug, data.slug),
      });

      if (slugExists) {
        return {
          success: false,
          error: "Brand with this slug already exists",
        };
      }
    }

    const updatedBrand = await db
      .update(brands)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(brands.id, brandId))
      .returning();

    revalidatePath("/withAuth/brands");

    return { success: true, data: updatedBrand[0] };
  } catch (error) {
    console.error("Error updating brand:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update brand",
    };
  }
}

export async function deleteBrands(brandIds: string[]) {
  try {
    await getAdminUser(); // Verify admin access

    // Check if any brands have products
    const brandsWithProducts = await db
      .select({
        id: brands.id,
        productCount: sql<number>`count(${products.id})`,
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .where(sql`${brands.id} = ANY(${brandIds})`)
      .groupBy(brands.id);

    const brandsToDelete = brandsWithProducts.filter(
      (b) => b.productCount === 0
    );
    const brandsWithProductsList = brandsWithProducts.filter(
      (b) => b.productCount > 0
    );

    if (brandsWithProductsList.length > 0) {
      return {
        success: false,
        error: `Cannot delete brands that have products. ${brandsWithProductsList.length} brand(s) have products.`,
      };
    }

    const deletedBrands = await db
      .delete(brands)
      .where(sql`${brands.id} = ANY(${brandIds})`)
      .returning();

    revalidatePath("/withAuth/brands");

    return { success: true, data: deletedBrands };
  } catch (error) {
    console.error("Error deleting brands:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete brands",
    };
  }
}

export async function updateBrandStatus(
  brandId: string,
  updates: {
    isVerified?: boolean;
    isOfficial?: boolean;
  }
) {
  try {
    await getAdminUser(); // Verify admin access

    const updatedBrand = await db
      .update(brands)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(brands.id, brandId))
      .returning();

    if (!updatedBrand.length) {
      return { success: false, error: "Brand not found" };
    }

    revalidatePath("/withAuth/brands");

    return { success: true, data: updatedBrand[0] };
  } catch (error) {
    console.error("Error updating brand status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update brand status",
    };
  }
}

export async function getBrandStats() {
  try {
    await getAdminUser(); // Verify admin access

    const stats = await db
      .select({
        verified: sql<number>`count(*) filter (where ${brands.isVerified} = true)`,
        unverified: sql<number>`count(*) filter (where ${brands.isVerified} = false)`,
        official: sql<number>`count(*) filter (where ${brands.isOfficial} = true)`,
        unofficial: sql<number>`count(*) filter (where ${brands.isOfficial} = false)`,
        total: sql<number>`count(*)`,
      })
      .from(brands);

    const topBrands = await db.query.brands.findMany({
      orderBy: [desc(brands.productCount), desc(brands.averageRating)],
      limit: 5,
    });

    return {
      success: true,
      data: {
        stats: stats[0],
        topBrands,
      },
    };
  } catch (error) {
    console.error("Error fetching brand stats:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch brand stats",
    };
  }
}
