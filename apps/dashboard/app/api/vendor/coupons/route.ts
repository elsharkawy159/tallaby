import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  coupons,
  couponUsage,
  sellers,
  products,
  categories,
  brands,
} from "@workspace/db/src/drizzle/schema";
import {
  couponSchema,
  couponSearchSchema,
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

// GET /api/vendor/coupons - Get vendor's coupons with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate search parameters
    const searchData = {
      sellerId: searchParams.get("sellerId"),
      query: searchParams.get("query") || "",
      status: searchParams.get("status") || "all",
      discountType: searchParams.get("discountType") || "all",
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      includeUsage: searchParams.get("includeUsage") === "true",
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
      couponSearchSchema.parse(searchData);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error },
        { status: 400 }
      );
    }

    const offset = (searchData.page - 1) * searchData.limit;

    // Build query conditions
    const conditions = [eq(coupons.sellerId, searchData.sellerId)];

    // Text search across multiple fields
    if (searchData.query) {
      conditions.push(
        or(
          like(coupons.code, `%${searchData.query}%`),
          like(coupons.name, `%${searchData.query}%`),
          like(coupons.description, `%${searchData.query}%`)
        )
      );
    }

    // Status filter
    if (searchData.status && searchData.status !== "all") {
      const now = new Date().toISOString();
      switch (searchData.status) {
        case "active":
          conditions.push(
            and(
              eq(coupons.isActive, true),
              gte(coupons.startsAt, now),
              lte(coupons.expiresAt, now)
            )
          );
          break;
        case "inactive":
          conditions.push(eq(coupons.isActive, false));
          break;
        case "expired":
          conditions.push(lte(coupons.expiresAt, now));
          break;
        case "upcoming":
          conditions.push(gte(coupons.startsAt, now));
          break;
      }
    }

    // Discount type filter
    if (searchData.discountType && searchData.discountType !== "all") {
      conditions.push(eq(coupons.discountType, searchData.discountType));
    }

    // Date range filter
    if (searchData.dateFrom) {
      conditions.push(gte(coupons.createdAt, searchData.dateFrom));
    }
    if (searchData.dateTo) {
      conditions.push(lte(coupons.createdAt, searchData.dateTo));
    }

    // Build sort order
    const sortField =
      searchData.sortBy === "expires_at"
        ? coupons.expiresAt
        : searchData.sortBy === "usage_count"
          ? coupons.usageCount
          : searchData.sortBy === "discount_value"
            ? coupons.discountValue
            : coupons.createdAt;

    const sortOrder =
      searchData.sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // Get coupons using Drizzle
    const vendorCoupons = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        name: coupons.name,
        description: coupons.description,
        discountType: coupons.discountType,
        discountValue: coupons.discountValue,
        minimumPurchase: coupons.minimumPurchase,
        maximumDiscount: coupons.maximumDiscount,
        isActive: coupons.isActive,
        isOneTimeUse: coupons.isOneTimeUse,
        usageLimit: coupons.usageLimit,
        usageCount: coupons.usageCount,
        perUserLimit: coupons.perUserLimit,
        applicableTo: coupons.applicableTo,
        excludeItems: coupons.excludeItems,
        startsAt: coupons.startsAt,
        expiresAt: coupons.expiresAt,
        createdAt: coupons.createdAt,
        updatedAt: coupons.updatedAt,
      })
      .from(coupons)
      .where(and(...conditions))
      .orderBy(sortOrder)
      .limit(searchData.limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(coupons)
      .where(and(...conditions));

    // Get usage statistics if requested
    let usageStats = [];
    if (searchData.includeUsage && vendorCoupons.length > 0) {
      const couponIds = vendorCoupons.map((c) => c.id);
      usageStats = await db
        .select({
          couponId: couponUsage.couponId,
          totalUsage: count(),
          totalDiscount: sum(couponUsage.discountAmount),
          averageDiscount: avg(couponUsage.discountAmount),
          lastUsed: max(couponUsage.createdAt),
        })
        .from(couponUsage)
        .where(inArray(couponUsage.couponId, couponIds))
        .groupBy(couponUsage.couponId);
    }

    // Get applicable products/categories/brands if needed
    let applicableItems = [];
    if (vendorCoupons.length > 0) {
      const applicableToData = vendorCoupons
        .map((c) => c.applicableTo)
        .filter(Boolean);

      if (applicableToData.length > 0) {
        const productIds = applicableToData
          .map((data) => data?.products || [])
          .flat();
        const categoryIds = applicableToData
          .map((data) => data?.categories || [])
          .flat();
        const brandIds = applicableToData
          .map((data) => data?.brands || [])
          .flat();

        const [products, categories, brands] = await Promise.all([
          productIds.length > 0
            ? db
                .select({
                  id: products.id,
                  title: products.title,
                  slug: products.slug,
                })
                .from(products)
                .where(inArray(products.id, productIds))
            : [],
          categoryIds.length > 0
            ? db
                .select({
                  id: categories.id,
                  name: categories.name,
                  slug: categories.slug,
                })
                .from(categories)
                .where(inArray(categories.id, categoryIds))
            : [],
          brandIds.length > 0
            ? db
                .select({
                  id: brands.id,
                  name: brands.name,
                  slug: brands.slug,
                })
                .from(brands)
                .where(inArray(brands.id, brandIds))
            : [],
        ]);

        applicableItems = { products, categories, brands };
      }
    }

    // Calculate additional stats for each coupon
    const couponsWithStats = vendorCoupons.map((coupon) => {
      const usage = usageStats.find((u) => u.couponId === coupon.id);
      const now = new Date();
      const isExpired = new Date(coupon.expiresAt) < now;
      const isUpcoming = new Date(coupon.startsAt) > now;
      const isActive = coupon.isActive && !isExpired && !isUpcoming;

      return {
        ...coupon,
        status: isExpired
          ? "expired"
          : isUpcoming
            ? "upcoming"
            : isActive
              ? "active"
              : "inactive",
        usage: usage || {
          totalUsage: 0,
          totalDiscount: 0,
          averageDiscount: 0,
          lastUsed: null,
        },
        remainingUsage: coupon.usageLimit
          ? coupon.usageLimit - coupon.usageCount
          : null,
        daysUntilExpiry: Math.ceil(
          (new Date(coupon.expiresAt).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      };
    });

    return NextResponse.json({
      coupons: couponsWithStats,
      pagination: {
        page: searchData.page,
        limit: searchData.limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / searchData.limit),
      },
      applicableItems,
    });
  } catch (error) {
    console.error("Error fetching vendor coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST /api/vendor/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate coupon data
    const validatedCoupon = couponSchema.parse(body);

    // Check if coupon code already exists
    const existingCoupon = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, validatedCoupon.code))
      .limit(1);

    if (existingCoupon.length > 0) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    // Validate seller exists
    const sellerExists = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.id, validatedCoupon.sellerId))
      .limit(1);

    if (sellerExists.length === 0) {
      return NextResponse.json(
        { error: "Seller does not exist" },
        { status: 400 }
      );
    }

    // Validate applicable products/categories/brands if provided
    if (validatedCoupon.applicableTo) {
      const {
        products: productIds,
        categories: categoryIds,
        brands: brandIds,
      } = validatedCoupon.applicableTo;

      if (productIds && productIds.length > 0) {
        const existingProducts = await db
          .select({ id: products.id })
          .from(products)
          .where(inArray(products.id, productIds));

        if (existingProducts.length !== productIds.length) {
          return NextResponse.json(
            { error: "Some specified products do not exist" },
            { status: 400 }
          );
        }
      }

      if (categoryIds && categoryIds.length > 0) {
        const existingCategories = await db
          .select({ id: categories.id })
          .from(categories)
          .where(inArray(categories.id, categoryIds));

        if (existingCategories.length !== categoryIds.length) {
          return NextResponse.json(
            { error: "Some specified categories do not exist" },
            { status: 400 }
          );
        }
      }

      if (brandIds && brandIds.length > 0) {
        const existingBrands = await db
          .select({ id: brands.id })
          .from(brands)
          .where(inArray(brands.id, brandIds));

        if (existingBrands.length !== brandIds.length) {
          return NextResponse.json(
            { error: "Some specified brands do not exist" },
            { status: 400 }
          );
        }
      }
    }

    // Create coupon using Drizzle
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        sellerId: validatedCoupon.sellerId,
        code: validatedCoupon.code,
        name: validatedCoupon.name,
        description: validatedCoupon.description,
        discountType: validatedCoupon.discountType,
        discountValue: validatedCoupon.discountValue,
        minimumPurchase: validatedCoupon.minimumPurchase,
        maximumDiscount: validatedCoupon.maximumDiscount,
        isActive: validatedCoupon.isActive,
        isOneTimeUse: validatedCoupon.isOneTimeUse,
        usageLimit: validatedCoupon.usageLimit,
        usageCount: 0,
        perUserLimit: validatedCoupon.perUserLimit,
        applicableTo: validatedCoupon.applicableTo,
        excludeItems: validatedCoupon.excludeItems,
        startsAt: validatedCoupon.startsAt,
        expiresAt: validatedCoupon.expiresAt,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Coupon created successfully",
        coupon: newCoupon,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating coupon:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid coupon data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/coupons - Update coupon
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponId, updates } = body;

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    // Get existing coupon
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);

    if (existingCoupon.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Validate updates
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.discountValue !== undefined) {
      updateData.discountValue = updates.discountValue;
    }
    if (updates.minimumPurchase !== undefined) {
      updateData.minimumPurchase = updates.minimumPurchase;
    }
    if (updates.maximumDiscount !== undefined) {
      updateData.maximumDiscount = updates.maximumDiscount;
    }
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }
    if (updates.usageLimit !== undefined) {
      updateData.usageLimit = updates.usageLimit;
    }
    if (updates.perUserLimit !== undefined) {
      updateData.perUserLimit = updates.perUserLimit;
    }
    if (updates.applicableTo !== undefined) {
      updateData.applicableTo = updates.applicableTo;
    }
    if (updates.excludeItems !== undefined) {
      updateData.excludeItems = updates.excludeItems;
    }
    if (updates.startsAt !== undefined) {
      updateData.startsAt = updates.startsAt;
    }
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt;
    }

    // Update coupon using Drizzle
    const [updatedCoupon] = await db
      .update(coupons)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(coupons.id, couponId))
      .returning();

    return NextResponse.json({
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}
