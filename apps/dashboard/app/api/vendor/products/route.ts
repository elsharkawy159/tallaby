import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  products,
  productListings,
  productVariants,
  categories,
  brands,
  sellers,
  productImages,
  productAttributes,
  attributeValues,
} from "@workspace/db/src/drizzle/schema";
import {
  productSchema,
  productListingSchema,
  productSearchSchema,
  bulkProductUpdateSchema,
  productVariantSchema,
} from "@/lib/validations/vendor-schemas";
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

// GET /api/vendor/products - Get vendor's products with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate search parameters
    const searchData = {
      sellerId: searchParams.get("sellerId"),
      query: searchParams.get("query") || "",
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      status: searchParams.get("status") || "all",
      priceMin: searchParams.get("priceMin")
        ? parseFloat(searchParams.get("priceMin")!)
        : undefined,
      priceMax: searchParams.get("priceMax")
        ? parseFloat(searchParams.get("priceMax")!)
        : undefined,
      stockStatus: searchParams.get("stockStatus") || "all",
      condition: searchParams.get("condition") || "all",
      fulfillmentType: searchParams.get("fulfillmentType") || "all",
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      includeStats: searchParams.get("includeStats") === "true",
      includeVariants: searchParams.get("includeVariants") === "true",
      includeAnalytics: searchParams.get("includeAnalytics") === "true",
    };

    // Validate seller ID
    if (!searchData.sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Validate search parameters
    try {
      productSearchSchema.parse(searchData);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error },
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
          like(products.description, `%${searchData.query}%`),
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

    // Status filter
    if (searchData.status && searchData.status !== "all") {
      switch (searchData.status) {
        case "active":
          conditions.push(eq(productListings.isActive, true));
          break;
        case "inactive":
          conditions.push(eq(productListings.isActive, false));
          break;
        case "featured":
          conditions.push(eq(productListings.isFeatured, true));
          break;
        case "on_sale":
          conditions.push(eq(productListings.salePrice, not(isNull())));
          break;
        case "out_of_stock":
          conditions.push(eq(productListings.quantity, 0));
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
      }
    }

    // Condition filter
    if (searchData.condition && searchData.condition !== "all") {
      conditions.push(eq(productListings.condition, searchData.condition));
    }

    // Fulfillment type filter
    if (searchData.fulfillmentType && searchData.fulfillmentType !== "all") {
      conditions.push(
        eq(productListings.fulfillmentType, searchData.fulfillmentType)
      );
    }

    // Build sort order
    const sortField =
      searchData.sortBy === "title"
        ? products.title
        : searchData.sortBy === "price"
          ? productListings.price
          : searchData.sortBy === "sales"
            ? products.reviewCount // Using reviewCount as proxy for sales
            : searchData.sortBy === "rating"
              ? products.averageRating
              : searchData.sortBy === "reviews"
                ? products.reviewCount
                : searchData.sortBy === "updated_at"
                  ? products.updatedAt
                  : products.createdAt;

    const sortOrder =
      searchData.sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // Get products with listings using Drizzle
    const vendorProducts = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        bulletPoints: products.bulletPoints,
        basePrice: products.basePrice,
        listPrice: products.listPrice,
        averageRating: products.averageRating,
        reviewCount: products.reviewCount,
        isActive: products.isActive,
        isBestSeller: products.isBestSeller,
        isAdult: products.isAdult,
        isPlatformChoice: products.isPlatformChoice,
        mainCategoryId: products.mainCategoryId,
        brandId: products.brandId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Listing fields
        listingId: productListings.id,
        sku: productListings.sku,
        price: productListings.price,
        salePrice: productListings.salePrice,
        quantity: productListings.quantity,
        condition: productListings.condition,
        fulfillmentType: productListings.fulfillmentType,
        isFeatured: productListings.isFeatured,
        isActive: productListings.isActive,
        handlingTime: productListings.handlingTime,
        restockDate: productListings.restockDate,
        maxOrderQuantity: productListings.maxOrderQuantity,
        notes: productListings.notes,
        listingCreatedAt: productListings.createdAt,
        listingUpdatedAt: productListings.updatedAt,
        // Category and brand info
        categoryName: categories.name,
        brandName: brands.name,
      })
      .from(products)
      .innerJoin(productListings, eq(products.id, productListings.productId))
      .leftJoin(categories, eq(products.mainCategoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(and(...conditions))
      .orderBy(sortOrder)
      .limit(searchData.limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(products)
      .innerJoin(productListings, eq(products.id, productListings.productId))
      .where(and(...conditions));

    // Get variants if requested
    let variants = [];
    if (searchData.includeVariants && vendorProducts.length > 0) {
      const productIds = vendorProducts.map((p) => p.id);
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
          createdAt: productVariants.createdAt,
          updatedAt: productVariants.updatedAt,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds));
    }

    // Get analytics if requested
    let analytics = null;
    if (searchData.includeAnalytics) {
      const productIds = vendorProducts.map((p) => p.id);

      // Get product views
      const viewsResult = await db
        .select({
          productId: productViews.productId,
          viewCount: count(),
        })
        .from(productViews)
        .where(inArray(productViews.productId, productIds))
        .groupBy(productViews.productId);

      // Get order statistics
      const orderStats = await db
        .select({
          productId: orderItems.productId,
          totalOrders: count(),
          totalQuantity: sum(orderItems.quantity),
          totalRevenue: sum(orderItems.total),
        })
        .from(orderItems)
        .where(inArray(orderItems.productId, productIds))
        .groupBy(orderItems.productId);

      analytics = {
        views: viewsResult,
        orders: orderStats,
      };
    }

    // Get stats if requested
    let stats = null;
    if (searchData.includeStats) {
      const statsResult = await db
        .select({
          totalProducts: count(products.id),
          activeProducts: count(
            and(
              eq(productListings.isActive, true),
              eq(productListings.sellerId, searchData.sellerId)
            )
          ),
          featuredProducts: count(
            and(
              eq(productListings.isFeatured, true),
              eq(productListings.sellerId, searchData.sellerId)
            )
          ),
          outOfStockProducts: count(
            and(
              eq(productListings.quantity, 0),
              eq(productListings.sellerId, searchData.sellerId)
            )
          ),
          totalValue: sum(productListings.price),
          averagePrice: avg(productListings.price),
          totalQuantity: sum(productListings.quantity),
        })
        .from(products)
        .innerJoin(productListings, eq(products.id, productListings.productId))
        .where(eq(productListings.sellerId, searchData.sellerId));

      stats = statsResult[0];
    }

    // Group variants by product
    const productsWithVariants = vendorProducts.map((product) => ({
      ...product,
      variants: variants.filter((v) => v.productId === product.id),
      analytics: searchData.includeAnalytics
        ? {
            views:
              analytics?.views.find((v) => v.productId === product.id)
                ?.viewCount || 0,
            orders:
              analytics?.orders.find((o) => o.productId === product.id) || null,
          }
        : null,
    }));

    return NextResponse.json({
      products: productsWithVariants,
      pagination: {
        page: searchData.page,
        limit: searchData.limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / searchData.limit),
      },
      stats,
      analytics: searchData.includeAnalytics ? analytics : null,
    });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/vendor/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate product data
    const validatedProduct = productSchema.parse(body.product);
    const validatedListing = productListingSchema.parse(body.listing);

    // Check if product with same slug exists
    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, validatedProduct.slug))
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json(
        { error: "Product with this slug already exists" },
        { status: 409 }
      );
    }

    // Check if listing SKU already exists for this seller
    const existingListing = await db
      .select({ id: productListings.id })
      .from(productListings)
      .where(
        and(
          eq(productListings.sku, validatedListing.sku),
          eq(productListings.sellerId, validatedListing.sellerId)
        )
      )
      .limit(1);

    if (existingListing.length > 0) {
      return NextResponse.json(
        { error: "SKU already exists for this seller" },
        { status: 409 }
      );
    }

    // Validate category exists
    if (validatedProduct.mainCategoryId) {
      const categoryExists = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, validatedProduct.mainCategoryId))
        .limit(1);

      if (categoryExists.length === 0) {
        return NextResponse.json(
          { error: "Selected category does not exist" },
          { status: 400 }
        );
      }
    }

    // Validate brand exists if provided
    if (validatedProduct.brandId) {
      const brandExists = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.id, validatedProduct.brandId))
        .limit(1);

      if (brandExists.length === 0) {
        return NextResponse.json(
          { error: "Selected brand does not exist" },
          { status: 400 }
        );
      }
    }

    // Create product and listing in a transaction using Drizzle
    const result = await db.transaction(async (tx) => {
      // Insert product
      const [newProduct] = await tx
        .insert(products)
        .values({
          title: validatedProduct.title,
          slug: validatedProduct.slug,
          description: validatedProduct.description,
          bulletPoints: validatedProduct.bulletPoints || [],
          brandId: validatedProduct.brandId,
          mainCategoryId: validatedProduct.mainCategoryId,
          listPrice: validatedProduct.listPrice,
          basePrice: validatedProduct.basePrice,
          isActive: validatedProduct.isActive,
          isAdult: validatedProduct.isAdult,
          isPlatformChoice: validatedProduct.isPlatformChoice,
          isBestSeller: validatedProduct.isBestSeller,
          taxClass: validatedProduct.taxClass,
          metaTitle: validatedProduct.metaTitle,
          metaDescription: validatedProduct.metaDescription,
          metaKeywords: validatedProduct.metaKeywords,
          searchKeywords: validatedProduct.searchKeywords,
        })
        .returning();

      // Insert product listing
      const [newListing] = await tx
        .insert(productListings)
        .values({
          productId: newProduct.id,
          variantId: validatedListing.variantId,
          sellerId: validatedListing.sellerId,
          sku: validatedListing.sku,
          condition: validatedListing.condition,
          fulfillmentType: validatedListing.fulfillmentType,
          price: validatedListing.price,
          salePrice: validatedListing.salePrice,
          quantity: validatedListing.stockQuantity,
          isActive: validatedListing.isActive,
          isFeatured: validatedListing.isFeatured,
          isOnSale: validatedListing.isOnSale,
          handlingTime: validatedListing.handlingTime || 1,
          maxOrderQuantity: validatedListing.maxOrderQuantity,
          notes: validatedListing.notes,
        })
        .returning();

      // Create variants if provided
      let variants = [];
      if (body.variants && Array.isArray(body.variants)) {
        for (const variantData of body.variants) {
          const validatedVariant = productVariantSchema.parse(variantData);
          const [newVariant] = await tx
            .insert(productVariants)
            .values({
              productId: newProduct.id,
              sku: validatedVariant.sku,
              name: validatedVariant.name,
              attributes: validatedVariant.attributes || {},
              price: validatedVariant.price,
              listPrice: validatedVariant.listPrice,
              isDefault: validatedVariant.isDefault,
              weight: validatedVariant.weight,
              dimensions: validatedVariant.dimensions,
              isActive: validatedVariant.isActive,
            })
            .returning();
          variants.push(newVariant);
        }
      }

      // Insert product images if provided
      let images = [];
      if (validatedProduct.images && validatedProduct.images.length > 0) {
        for (let i = 0; i < validatedProduct.images.length; i++) {
          const [newImage] = await tx
            .insert(productImages)
            .values({
              productId: newProduct.id,
              url: validatedProduct.images[i],
              position: i,
              isPrimary: i === 0, // First image is primary
            })
            .returning();
          images.push(newImage);
        }
      }

      return { product: newProduct, listing: newListing, variants, images };
    });

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: result.product,
        listing: result.listing,
        variants: result.variants,
        images: result.images,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid product data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/products - Bulk update products
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate bulk update data
    const validatedData = bulkProductUpdateSchema.parse(body);

    // Update products in a transaction using Drizzle
    const result = await db.transaction(async (tx) => {
      const updateData: any = {};

      // Build update object for products table
      if (validatedData.updates.isActive !== undefined) {
        updateData.isActive = validatedData.updates.isActive;
      }
      if (validatedData.updates.isBestSeller !== undefined) {
        updateData.isBestSeller = validatedData.updates.isBestSeller;
      }
      if (validatedData.updates.categoryId !== undefined) {
        updateData.mainCategoryId = validatedData.updates.categoryId;
      }
      if (validatedData.updates.brandId !== undefined) {
        updateData.brandId = validatedData.updates.brandId;
      }

      // Update products
      const updatedProducts = await tx
        .update(products)
        .set({
          ...updateData,
          updatedAt: new Date().toISOString(),
        })
        .where(inArray(products.id, validatedData.productIds))
        .returning();

      // Update listings if needed
      const listingUpdates: any = {};
      if (validatedData.updates.isFeatured !== undefined) {
        listingUpdates.isFeatured = validatedData.updates.isFeatured;
      }
      if (validatedData.updates.price !== undefined) {
        listingUpdates.price = validatedData.updates.price;
      }
      if (validatedData.updates.listPrice !== undefined) {
        listingUpdates.listPrice = validatedData.updates.listPrice;
      }
      if (validatedData.updates.salePrice !== undefined) {
        listingUpdates.salePrice = validatedData.updates.salePrice;
      }
      if (validatedData.updates.quantity !== undefined) {
        listingUpdates.quantity = validatedData.updates.quantity;
      }

      let updatedListings = [];
      if (Object.keys(listingUpdates).length > 0) {
        updatedListings = await tx
          .update(productListings)
          .set({
            ...listingUpdates,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              inArray(productListings.productId, validatedData.productIds),
              eq(productListings.sellerId, validatedData.sellerId)
            )
          )
          .returning();
      }

      return { products: updatedProducts, listings: updatedListings };
    });

    return NextResponse.json({
      message: "Products updated successfully",
      updatedProducts: result.products.length,
      updatedListings: result.listings.length,
      products: result.products,
      listings: result.listings,
    });
  } catch (error) {
    console.error("Error updating products:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update products" },
      { status: 500 }
    );
  }
}
