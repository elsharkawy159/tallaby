"use server";

import { db, products, brands, categories } from "@workspace/db";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { SearchParams } from "@/hooks/use-url-params";

export async function getProducts(params: SearchParams) {
  const {
    search = "",
    categories: categoryIds = [],
    priceMin = 0,
    priceMax,
    sort = "popularity",
    page = 1,
    pageSize = 20,
  } = params;

  try {
    // Base price expression from JSON price column
    const basePriceExpr = sql<number>`(products.price->>'base')::numeric`;

    // Build the base query
    let query = db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        base_price: basePriceExpr,
        average_rating: products.averageRating,
        review_count: products.reviewCount,
        brand: {
          name: brands.name,
        },
        category: {
          name: categories.name,
        },
        images: products.images,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.mainCategoryId, categories.id))
      .where(
        and(
          eq(products.isActive, true),
          search ? ilike(products.title, `%${search}%`) : undefined,
          categoryIds.length > 0
            ? inArray(products.mainCategoryId, categoryIds)
            : undefined,
          priceMin ? sql`${basePriceExpr} >= ${priceMin}` : undefined,
          priceMax ? sql`${basePriceExpr} <= ${priceMax}` : undefined
        ) as any
      )
      .groupBy(products.id, brands.name, categories.name);

    // Add sorting
    switch (sort) {
      case "price-low":
        query = query.orderBy(asc(basePriceExpr as any)) as any;
        break;
      case "price-high":
        query = query.orderBy(desc(basePriceExpr as any)) as any;
        break;
      case "newest":
        query = query.orderBy(desc(products.createdAt)) as any;
        break;
      case "rating":
        query = query.orderBy(desc(products.averageRating)) as any;
        break;
      default: // popularity
        query = query.orderBy(desc(products.reviewCount)) as any;
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          search ? ilike(products.title, `%${search}%`) : undefined,
          categoryIds.length > 0
            ? inArray(products.mainCategoryId, categoryIds)
            : undefined,
          priceMin ? sql`${basePriceExpr} >= ${priceMin}` : undefined,
          priceMax ? sql`${basePriceExpr} <= ${priceMax}` : undefined
        ) as any
      );

    // Execute both queries in parallel
    const [productsData, countResult] = await Promise.all([
      query.limit(pageSize).offset((page - 1) * pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      products: productsData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

// Define types for better type safety
interface ProductVariant {
  id: string;
  attributes: any;
  stock: number;
  isActive: boolean;
}

interface Brand {
  name: string;
  averageRating: number | null;
  reviewCount: number;
}

interface ProductWithDetails {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isActive: boolean;
  brand: Brand;
  variants: any[] | null;
  // Add other product fields as needed
  availableSizes: string[];
  availableColors: { name: string; hex: string }[];
}

export async function getProduct(slug: string): Promise<ProductWithDetails> {
  try {
    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: {
        brand: {
          columns: {
            name: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
      columns: {
        id: true,
        slug: true,
        title: true,
        description: true,
        isActive: true,
        variants: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Extract sizes and colors from variants
    const variants = (product.variants as any[]) || [];
    const sizes = new Set<string>();
    const colors = new Set<{ name: string; hex: string }>();

    variants.forEach((variant: any) => {
      const attrs = (variant && (variant.attributes || variant)) || ({} as any);

      // Handle size attribute
      if (attrs.size) {
        sizes.add(attrs.size);
      }

      // Handle color attribute
      if (attrs.color) {
        const colorName =
          typeof attrs.color === "string"
            ? attrs.color
            : attrs.color.name || "Unknown";

        const colorHex =
          typeof attrs.color === "object" && attrs.color.hex
            ? attrs.color.hex
            : "#000000";

        // Add to Set (note: Set with objects requires manual duplicate checking)
        const existingColor = Array.from(colors).find(
          (c) => c.name === colorName
        );
        if (!existingColor) {
          colors.add({ name: colorName, hex: colorHex });
        }
      }
    });

    // Transform the data to match the expected format
    return {
      ...product,
      availableSizes: Array.from(sizes),
      availableColors: Array.from(colors),
    } as ProductWithDetails;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
}
