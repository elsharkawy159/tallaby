"use server";

import {
  db,
  products,
  productImages,
  brands,
  categories,
  productListings,
  productVariants,
} from "@workspace/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
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
    // Build the base query
    let query = db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        base_price: products.basePrice,
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
      .leftJoin(productImages, eq(products.id, productImages.productId))
      .where(
        and(
          eq(products.isActive, true),
          // Search condition
          search ? ilike(products.title, `%${search}%`) : undefined,
          // Category filter
          categoryIds.length > 0
            ? inArray(products.mainCategoryId, categoryIds)
            : undefined,
          // Price range
          priceMin
            ? gte(products.basePrice, priceMin.toString() as any)
            : undefined,
          priceMax
            ? lte(products.basePrice, priceMax.toString() as any)
            : undefined
        )
      )
      .groupBy(products.id, brands.name, categories.name);

    // Add sorting
    switch (sort) {
      case "price-low":
        query = query.orderBy(asc(products.basePrice)) as any;
        break;
      case "price-high":
        query = query.orderBy(desc(products.basePrice)) as any;
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
          priceMin
            ? gte(products.basePrice, priceMin.toString() as any)
            : undefined,
          priceMax
            ? lte(products.basePrice, priceMax.toString() as any)
            : undefined
        )
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

export async function getProduct(slug: string) {
  try {
    const product = await db
      .select({
        id: products.id,
        name: products.title,
        slug: products.slug,
        price: products.basePrice,
        originalPrice: products.listPrice,
        rating: products.averageRating,
        reviewCount: products.reviewCount,
        description: products.description,
        features: products.bulletPoints,
        inStock: sql<boolean>`EXISTS (
          SELECT 1 FROM ${productListings}
          WHERE ${productListings.productId} = ${products.id}
          AND ${productListings.isActive} = true
          AND ${productListings.quantity} > 0
        )`,
        brand: {
          name: brands.name,
          rating: brands.averageRating,
          reviews: brands.reviewCount,
        },
        images: sql<Array<{ url: string; alt_text: string }>>`
          COALESCE(
            json_agg(
              json_build_object(
                'url', ${productImages.url},
                'alt_text', ${productImages.altText}
              )
            ) FILTER (WHERE ${productImages.id} IS NOT NULL),
            '[]'
          )
        `,
        variants: sql<Array<{ attributes: any }>>`
          COALESCE(
            json_agg(
              json_build_object(
                'attributes', ${productVariants.attributes}
              )
            ) FILTER (WHERE ${productVariants.id} IS NOT NULL),
            '[]'
          )
        `,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(productImages, eq(products.id, productImages.productId))
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .groupBy(
        products.id,
        brands.name,
        brands.averageRating,
        brands.reviewCount
      )
      .limit(1);

    if (!product[0]) {
      throw new Error("Product not found");
    }

    // Extract sizes and colors from variants
    const variants = product[0].variants || [];
    const sizes = new Set<string>();
    const colors = new Set<{ name: string; hex: string }>();

    variants.forEach((variant: any) => {
      const attrs = variant.attributes || {};
      if (attrs.size) sizes.add(attrs.size);
      if (attrs.color) {
        colors.add({
          name: attrs.color.name || attrs.color,
          hex: attrs.color.hex || "#000000",
        });
      }
    });

    // Transform the data to match the expected format
    const transformedProduct = {
      id: product[0].id,
      name: product[0].name,
      price: Number(product[0].price),
      originalPrice: product[0].originalPrice
        ? Number(product[0].originalPrice)
        : undefined,
      rating: product[0].rating || 0,
      reviewCount: product[0].reviewCount || 0,
      description: product[0].description || "",
      features: (product[0].features as string[]) || [],
      inStock: product[0].inStock,
      seller: {
        name: product[0].brand?.name || "",
        rating: product[0].brand?.rating || 0,
        reviews: product[0].brand?.reviews || 0,
      },
      images: product[0].images.map((img: any) => img.url),
      colors: Array.from(colors),
      sizes: Array.from(sizes),
    };

    return transformedProduct;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
}
