import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  productListings,
  products,
  productVariants,
  categories,
  brands,
  sellers,
  productImages,
} from "@workspace/db/src/drizzle/schema";
import { inventoryUpdateSchema } from "@/lib/validations/vendor-schemas";
import {
  eq,
  and,
  desc,
  asc,
  like,
  gte,
  lte,
  inArray,
  sql,
  or,
  not,
  isNull,
  count,
  sum,
  avg,
  max,
  min,
} from "drizzle-orm";

// GET /api/vendor/inventory - Get vendor's inventory with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate search parameters
    const searchData = {
      sellerId: searchParams.get("sellerId"),
      query: searchParams.get("query") || "",
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      stockStatus: searchParams.get("stockStatus") || "all",
      priceMin: searchParams.get("priceMin")
        ? parseFloat(searchParams.get("priceMin")!)
        : undefined,
      priceMax: searchParams.get("priceMax")
        ? parseFloat(searchParams.get("priceMax")!)
        : undefined,
      sortBy: searchParams.get("sortBy") || "quantity",
      sortOrder: searchParams.get("sortOrder") || "asc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      includeVariants: searchParams.get("includeVariants") === "true",
      includeImages: searchParams.get("includeImages") === "true",
    };

    // Validate seller ID
    if (!searchData.sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    const offset = (searchData.page - 1) * searchData.limit;

    // Build query conditions
    const conditions = [eq(productListings.sellerId, searchData.sellerId)];

    // Text search across multiple fields
    if (searchData.query) {
      conditions.push(
        or(
          like(products.title, `%${searchData.query}%`),
          like(products.slug, `%${searchData.query}%`),
          like(productListings.sku, `%${searchData.query}%`)
        )
      );
    }

    // Category filter
    if (searchData.category && searchData.category !== "all") {
      conditions.push(eq(products.mainCategoryId, searchData.category));
    }

    // Brand filter
    if (searchData.brand && searchData.brand !== "all") {
      conditions.push(eq(products.brandId, searchData.brand));
    }

    // Stock status filter
    if (searchData.stockStatus && searchData.stockStatus !== "all") {
      switch (searchData.stockStatus) {
        case "in_stock":
          conditions.push(sql`${productListings.quantity} > 0`);
          break;
        case "low_stock":
          conditions.push(
            sql`${productListings.quantity} > 0 AND ${productListings.quantity} <= 10`
          );
          break;
        case "out_of_stock":
          conditions.push(eq(productListings.quantity, 0));
          break;
        case "critical_stock":
          conditions.push(
            sql`${productListings.quantity} > 0 AND ${productListings.quantity} <= 5`
          );
          break;
      }
    }

    // Price range filter
    if (searchData.priceMin !== undefined) {
      conditions.push(gte(productListings.price, searchData.priceMin));
    }
    if (searchData.priceMax !== undefined) {
      conditions.push(lte(productListings.price, searchData.priceMax));
    }

    // Build sort order
    const sortField =
      searchData.sortBy === "title"
        ? products.title
        : searchData.sortBy === "price"
          ? productListings.price
          : searchData.sortBy === "sku"
            ? productListings.sku
            : searchData.sortBy === "updated_at"
              ? productListings.updatedAt
              : productListings.quantity;

    const sortOrder =
      searchData.sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // Get inventory items using Drizzle
    const inventoryItems = await db
      .select({
        id: productListings.id,
        productId: productListings.productId,
        variantId: productListings.variantId,
        sku: productListings.sku,
        price: productListings.price,
        salePrice: productListings.salePrice,
        quantity: productListings.quantity,
        condition: productListings.condition,
        fulfillmentType: productListings.fulfillmentType,
        isActive: productListings.isActive,
        isFeatured: productListings.isFeatured,
        handlingTime: productListings.handlingTime,
        restockDate: productListings.restockDate,
        maxOrderQuantity: productListings.maxOrderQuantity,
        notes: productListings.notes,
        createdAt: productListings.createdAt,
        updatedAt: productListings.updatedAt,
        // Product info
        productTitle: products.title,
        productSlug: products.slug,
        productDescription: products.description,
        productIsActive: products.isActive,
        // Category and brand info
        categoryName: categories.name,
        brandName: brands.name,
      })
      .from(productListings)
      .innerJoin(products, eq(productListings.productId, products.id))
      .leftJoin(categories, eq(products.mainCategoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(and(...conditions))
      .orderBy(sortOrder)
      .limit(searchData.limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(productListings)
      .innerJoin(products, eq(productListings.productId, products.id))
      .where(and(...conditions));

    // Get variants if requested
    let variants = [];
    if (searchData.includeVariants && inventoryItems.length > 0) {
      const productIds = inventoryItems.map((item) => item.productId);
      variants = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          sku: productVariants.sku,
          name: productVariants.name,
          attributes: productVariants.attributes,
          price: productVariants.price,
          listPrice: productVariants.listPrice,
          isDefault: productVariants.isDefault,
          weight: productVariants.weight,
          dimensions: productVariants.dimensions,
          isActive: productVariants.isActive,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds));
    }

    // Get images if requested
    let images = [];
    if (searchData.includeImages && inventoryItems.length > 0) {
      const productIds = inventoryItems.map((item) => item.productId);
      images = await db
        .select({
          id: productImages.id,
          productId: productImages.productId,
          url: productImages.url,
          altText: productImages.altText,
          position: productImages.position,
          isPrimary: productImages.isPrimary,
        })
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.position));
    }

    // Get inventory statistics
    const inventoryStats = await db
      .select({
        totalItems: count(productListings.id),
        activeItems: count(
          and(
            eq(productListings.isActive, true),
            eq(productListings.sellerId, searchData.sellerId)
          )
        ),
        inStock: count(
          and(
            sql`${productListings.quantity} > 0`,
            eq(productListings.sellerId, searchData.sellerId)
          )
        ),
        lowStock: count(
          and(
            sql`${productListings.quantity} > 0 AND ${productListings.quantity} <= 10`,
            eq(productListings.sellerId, searchData.sellerId)
          )
        ),
        outOfStock: count(
          and(
            eq(productListings.quantity, 0),
            eq(productListings.sellerId, searchData.sellerId)
          )
        ),
        criticalStock: count(
          and(
            sql`${productListings.quantity} > 0 AND ${productListings.quantity} <= 5`,
            eq(productListings.sellerId, searchData.sellerId)
          )
        ),
        totalValue: sum(
          sql`${productListings.price} * ${productListings.quantity}`
        ),
        averagePrice: avg(productListings.price),
        totalQuantity: sum(productListings.quantity),
      })
      .from(productListings)
      .where(eq(productListings.sellerId, searchData.sellerId));

    // Group variants and images by product
    const itemsWithDetails = inventoryItems.map((item) => ({
      ...item,
      variants: variants.filter((v) => v.productId === item.productId),
      images: images.filter((i) => i.productId === item.productId),
      stockStatus:
        item.quantity === 0
          ? "out_of_stock"
          : item.quantity <= 5
            ? "critical_stock"
            : item.quantity <= 10
              ? "low_stock"
              : "in_stock",
    }));

    return NextResponse.json({
      items: itemsWithDetails,
      pagination: {
        page: searchData.page,
        limit: searchData.limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / searchData.limit),
      },
      stats: inventoryStats[0] || {
        totalItems: 0,
        activeItems: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        criticalStock: 0,
        totalValue: 0,
        averagePrice: 0,
        totalQuantity: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST /api/vendor/inventory - Bulk update inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // Validate all updates
    const validatedUpdates = await Promise.all(
      updates.map(async (update) => {
        const validated = inventoryUpdateSchema.parse(update);

        // Verify listing exists and belongs to seller
        const listingExists = await db
          .select({ id: productListings.id })
          .from(productListings)
          .where(
            and(
              eq(productListings.id, validated.listingId),
              eq(productListings.sellerId, validated.sellerId)
            )
          )
          .limit(1);

        if (listingExists.length === 0) {
          throw new Error(
            `Listing ${validated.listingId} not found or access denied`
          );
        }

        return validated;
      })
    );

    // Update inventory in a transaction using Drizzle
    const result = await db.transaction(async (tx) => {
      const updatedItems = [];

      for (const update of validatedUpdates) {
        const updateData: any = {};

        if (update.quantity !== undefined) {
          updateData.quantity = update.quantity;
        }
        if (update.lowStockThreshold !== undefined) {
          updateData.lowStockThreshold = update.lowStockThreshold;
        }
        if (update.isActive !== undefined) {
          updateData.isActive = update.isActive;
        }
        if (update.price !== undefined) {
          updateData.price = update.price;
        }
        if (update.listPrice !== undefined) {
          updateData.listPrice = update.listPrice;
        }
        if (update.salePrice !== undefined) {
          updateData.salePrice = update.salePrice;
        }

        const [updatedItem] = await tx
          .update(productListings)
          .set({
            ...updateData,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(productListings.id, update.listingId),
              eq(productListings.sellerId, update.sellerId)
            )
          )
          .returning();

        updatedItems.push(updatedItem);
      }

      return updatedItems;
    });

    return NextResponse.json({
      message: "Inventory updated successfully",
      updatedCount: result.length,
      items: result,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/inventory - Update single inventory item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, sellerId, updates } = body;

    if (!listingId || !sellerId) {
      return NextResponse.json(
        { error: "Listing ID and Seller ID are required" },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedUpdate = inventoryUpdateSchema.parse({
      listingId,
      sellerId,
      ...updates,
    });

    // Verify listing exists and belongs to seller
    const listingExists = await db
      .select({ id: productListings.id })
      .from(productListings)
      .where(
        and(
          eq(productListings.id, listingId),
          eq(productListings.sellerId, sellerId)
        )
      )
      .limit(1);

    if (listingExists.length === 0) {
      return NextResponse.json(
        { error: "Listing not found or access denied" },
        { status: 404 }
      );
    }

    // Update inventory item using Drizzle
    const updateData: any = {};

    if (validatedUpdate.quantity !== undefined) {
      updateData.quantity = validatedUpdate.quantity;
    }
    if (validatedUpdate.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = validatedUpdate.lowStockThreshold;
    }
    if (validatedUpdate.isActive !== undefined) {
      updateData.isActive = validatedUpdate.isActive;
    }
    if (validatedUpdate.price !== undefined) {
      updateData.price = validatedUpdate.price;
    }
    if (validatedUpdate.listPrice !== undefined) {
      updateData.listPrice = validatedUpdate.listPrice;
    }
    if (validatedUpdate.salePrice !== undefined) {
      updateData.salePrice = validatedUpdate.salePrice;
    }

    const [updatedItem] = await db
      .update(productListings)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(productListings.id, listingId),
          eq(productListings.sellerId, sellerId)
        )
      )
      .returning();

    return NextResponse.json({
      message: "Inventory item updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}
