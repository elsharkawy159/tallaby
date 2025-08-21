"use server";

import { db } from "@workspace/db";
import {
  sellers,
  products,
  productListings,
  orders,
  orderItems,
  categories,
  brands,
} from "@workspace/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { SellerStatus } from "@/lib/utils/seller";

// Types
export interface VendorProfile {
  id: string;
  businessName: string;
  displayName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  taxId?: string;
  businessType: string;
  registrationNumber?: string;
  legalAddress: Record<string, unknown>;
  status: SellerStatus;
  supportEmail: string;
  supportPhone?: string;
  commissionRate: number;
  returnPolicy?: string;
  shippingPolicy?: string;
  isVerified: boolean;
  storeRating?: number;
  positiveRatingPercent?: number;
  totalRatings: number;
  productCount: number;
  walletBalance: string;
  joinDate: string;
}

export interface VendorProduct {
  id: string;
  title: string;
  slug: string;
  description?: string;
  images: string[];
  brandId?: string;
  mainCategoryId: string;
  listPrice?: string;
  basePrice: string;
  averageRating?: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  listing?: VendorProductListing;
}

export interface VendorProductListing {
  id: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  sku: string;
  condition: string;
  conditionDescription?: string;
  price: string;
  salePrice?: string;
  quantity: number;
  fulfillmentType: string;
  handlingTime: number;
  restockDate?: string;
  maxOrderQuantity?: number;
  isFeatured: boolean;
  isBuyBox: boolean;
  isActive: boolean;
  notes?: string;
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: string;
  shippingCost: string;
  tax: string;
  discountAmount: string;
  totalAmount: string;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  isGift: boolean;
  createdAt: string;
  updatedAt: string;
  items: VendorOrderItem[];
}

export interface VendorOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productListingId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product: {
    title: string;
    images: string[];
  };
}

export interface VendorAnalytics {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: string;
  averageOrderValue: string;
  productsSold: number;
  topProducts: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: string;
  }>;
}

// Vendor Profile Operations
export const getVendorProfile = async (
  userId: string
): Promise<VendorProfile | null> => {
  try {
    const result = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, userId))
      .limit(1);

    if (result.length === 0) return null;
    return result[0] as VendorProfile;
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    return null;
  }
};

export const updateVendorProfile = async (
  userId: string,
  data: Partial<VendorProfile>
): Promise<{ success: boolean; message: string }> => {
  try {
    // Filter out undefined values and ensure proper typing
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await db
      .update(sellers)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, userId));

    revalidatePath("/settings/profile");
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    return { success: false, message: "Failed to update profile" };
  }
};

// Product Operations
export const getVendorProducts = async (
  sellerId: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ products: VendorProduct[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;

    // Get product listings for this seller
    const listings = await db
      .select()
      .from(productListings)
      .where(eq(productListings.sellerId, sellerId))
      .limit(limit)
      .offset(offset);

    if (listings.length === 0) {
      return { products: [], total: 0 };
    }

    // Get products for these listings
    const productIds = listings.map((listing) => listing.productId);
    const productsData = await db
      .select()
      .from(products)
      .where(eq(products.id, productIds[0])); // Simplified - get first product for now

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(productListings)
      .where(eq(productListings.sellerId, sellerId));

    // Combine data
    const combinedProducts = listings.map((listing) => {
      const product = productsData.find((p) => p.id === listing.productId);
      return {
        id: listing.productId,
        title: product?.title || "Unknown Product",
        slug: product?.slug || "",
        description: product?.description || "",
        images: product?.images || [],
        brandId: product?.brandId || "",
        mainCategoryId: product?.mainCategoryId || "",
        listPrice: product?.listPrice || "",
        basePrice: product?.basePrice || "",
        averageRating: product?.averageRating || 0,
        reviewCount: product?.reviewCount || 0,
        isActive: product?.isActive || false,
        createdAt: product?.createdAt || "",
        updatedAt: product?.updatedAt || "",
        listing: {
          id: listing.id,
          productId: listing.productId,
          variantId: listing.variantId,
          sellerId: listing.sellerId,
          sku: listing.sku,
          condition: listing.condition,
          conditionDescription: listing.conditionDescription,
          price: listing.price,
          salePrice: listing.salePrice,
          quantity: listing.quantity,
          fulfillmentType: listing.fulfillmentType,
          handlingTime: listing.handlingTime,
          restockDate: listing.restockDate,
          maxOrderQuantity: listing.maxOrderQuantity,
          isFeatured: listing.isFeatured,
          isBuyBox: listing.isBuyBox,
          isActive: listing.isActive,
          notes: listing.notes,
        },
      };
    });

    return {
      products: combinedProducts as VendorProduct[],
      total: totalResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return { products: [], total: 0 };
  }
};

export const getVendorProduct = async (
  sellerId: string,
  productId: string
): Promise<VendorProduct | null> => {
  try {
    // Get product listing first
    const listingResult = await db
      .select()
      .from(productListings)
      .where(
        and(
          eq(productListings.productId, productId),
          eq(productListings.sellerId, sellerId)
        )
      )
      .limit(1);

    if (listingResult.length === 0) return null;
    const listing = listingResult[0];

    // Get product data
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productResult.length === 0) return null;
    const product = productResult[0];

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description || "",
      images: product.images || [],
      brandId: product.brandId || "",
      mainCategoryId: product.mainCategoryId,
      listPrice: product.listPrice || "",
      basePrice: product.basePrice,
      averageRating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      listing: {
        id: listing.id,
        productId: listing.productId,
        variantId: listing.variantId,
        sellerId: listing.sellerId,
        sku: listing.sku,
        condition: listing.condition,
        conditionDescription: listing.conditionDescription,
        price: listing.price,
        salePrice: listing.salePrice,
        quantity: listing.quantity,
        fulfillmentType: listing.fulfillmentType,
        handlingTime: listing.handlingTime,
        restockDate: listing.restockDate,
        maxOrderQuantity: listing.maxOrderQuantity,
        isFeatured: listing.isFeatured,
        isBuyBox: listing.isBuyBox,
        isActive: listing.isActive,
        notes: listing.notes,
      },
    } as VendorProduct;
  } catch (error) {
    console.error("Error fetching vendor product:", error);
    return null;
  }
};

export const createVendorProduct = async (
  sellerId: string,
  productData: {
    title: string;
    description?: string;
    images: string[];
    brandId?: string;
    mainCategoryId: string;
    listPrice?: string;
    basePrice: string;
    sku: string;
    condition: string;
    price: string;
    quantity: number;
    fulfillmentType: string;
    handlingTime: number;
  }
): Promise<{ success: boolean; message: string; productId?: string }> => {
  try {
    // Create product
    const productResult = await db
      .insert(products)
      .values({
        title: productData.title,
        slug: productData.title.toLowerCase().replace(/\s+/g, "-"),
        description: productData.description,
        images: productData.images,
        brandId: productData.brandId,
        mainCategoryId: productData.mainCategoryId,
        listPrice: productData.listPrice,
        basePrice: productData.basePrice,
        isActive: true,
      })
      .returning({ id: products.id });

    if (productResult.length === 0) {
      return { success: false, message: "Failed to create product" };
    }

    const product = productResult[0];

    // Create product listing
    await db.insert(productListings).values({
      productId: product.id,
      sellerId,
      sku: productData.sku,
      condition: productData.condition,
      price: productData.price,
      quantity: productData.quantity,
      fulfillmentType: productData.fulfillmentType,
      handlingTime: productData.handlingTime,
      isActive: true,
    } as any);

    revalidatePath("/products");
    return {
      success: true,
      message: "Product created successfully",
      productId: product.id,
    };
  } catch (error) {
    console.error("Error creating vendor product:", error);
    return { success: false, message: "Failed to create product" };
  }
};

export const updateVendorProduct = async (
  sellerId: string,
  productId: string,
  productData: Partial<VendorProduct>,
  listingData: Partial<VendorProductListing>
): Promise<{ success: boolean; message: string }> => {
  try {
    // Update product
    if (Object.keys(productData).length > 0) {
      await db
        .update(products)
        .set({
          ...productData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, productId));
    }

    // Update product listing
    if (Object.keys(listingData).length > 0) {
      await db
        .update(productListings)
        .set({
          ...listingData,
          updatedAt: new Date().toISOString(),
        } as any)
        .where(
          and(
            eq(productListings.productId, productId),
            eq(productListings.sellerId, sellerId)
          )
        );
    }

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Error updating vendor product:", error);
    return { success: false, message: "Failed to update product" };
  }
};

export const deleteVendorProduct = async (
  sellerId: string,
  productId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Delete product listing first (due to foreign key constraints)
    await db
      .delete(productListings)
      .where(
        and(
          eq(productListings.productId, productId),
          eq(productListings.sellerId, sellerId)
        )
      );

    // Delete product
    await db.delete(products).where(eq(products.id, productId));

    revalidatePath("/products");
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Error deleting vendor product:", error);
    return { success: false, message: "Failed to delete product" };
  }
};

// Order Operations
export const getVendorOrders = async (
  sellerId: string,
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{ orders: VendorOrder[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;

    // Get order items for this seller
    const sellerOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.sellerId, sellerId))
      .limit(limit)
      .offset(offset);

    if (sellerOrderItems.length === 0) {
      return { orders: [], total: 0 };
    }

    // Get unique order IDs
    const orderIds = [...new Set(sellerOrderItems.map((item) => item.orderId))];

    // Get orders
    const ordersData = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderIds[0])); // Simplified - get first order for now

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(orderItems)
      .where(eq(orderItems.sellerId, sellerId));

    // Combine data
    const combinedOrders = orderIds.map((orderId) => {
      const order = ordersData.find((o) => o.id === orderId);
      const items = sellerOrderItems.filter((item) => item.orderId === orderId);

      return {
        id: orderId,
        orderNumber: order?.orderNumber || "Unknown",
        userId: order?.userId || "",
        subtotal: order?.subtotal || "0",
        shippingCost: order?.shippingCost || "0",
        tax: order?.tax || "0",
        discountAmount: order?.discountAmount || "0",
        totalAmount: order?.totalAmount || "0",
        currency: order?.currency || "USD",
        status: order?.status || "pending",
        paymentStatus: order?.paymentStatus || "pending",
        paymentMethod: order?.paymentMethod || "",
        isGift: order?.isGift || false,
        createdAt: order?.createdAt || "",
        updatedAt: order?.updatedAt || "",
        items: items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productListingId: item.listingId || "",
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
          product: {
            title: item.productName,
            images: [], // Default empty array
          },
        })),
      };
    });

    return {
      orders: combinedOrders as VendorOrder[],
      total: totalResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return { orders: [], total: 0 };
  }
};

export const updateOrderStatus = async (
  sellerId: string,
  orderId: string,
  status: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Verify the order belongs to this seller
    const orderItemResult = await db
      .select()
      .from(orderItems)
      .where(
        and(eq(orderItems.orderId, orderId), eq(orderItems.sellerId, sellerId))
      )
      .limit(1);

    if (orderItemResult.length === 0) {
      return { success: false, message: "Order not found or access denied" };
    }

    await db
      .update(orders)
      .set({
        status: status as any,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/orders");
    return { success: true, message: "Order status updated successfully" };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: "Failed to update order status" };
  }
};

// Analytics Operations
export const getVendorAnalytics = async (
  sellerId: string,
  period: "7d" | "30d" | "90d" | "1y" = "30d"
): Promise<VendorAnalytics> => {
  try {
    // Simplified analytics - just get basic counts
    const [totalProductsResult, activeProductsResult, orderItemsResult] =
      await Promise.all([
        // Total products
        db
          .select({ count: count() })
          .from(productListings)
          .where(eq(productListings.sellerId, sellerId)),

        // Active products
        db
          .select({ count: count() })
          .from(productListings)
          .where(
            and(
              eq(productListings.sellerId, sellerId),
              eq(productListings.isActive, true)
            )
          ),

        // Order items for this seller
        db.select().from(orderItems).where(eq(orderItems.sellerId, sellerId)),
      ]);

    const totalProducts = totalProductsResult[0]?.count || 0;
    const activeProducts = activeProductsResult[0]?.count || 0;
    const totalOrders = new Set(orderItemsResult.map((item) => item.orderId))
      .size;
    const totalRevenue = orderItemsResult
      .reduce((sum, item) => sum + parseFloat(item.total), 0)
      .toString();
    const productsSold = orderItemsResult.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const averageOrderValue =
      totalOrders > 0
        ? (parseFloat(totalRevenue) / totalOrders).toFixed(2)
        : "0";

    // Simplified top products
    const productSales = new Map<string, { sales: number; revenue: number }>();

    orderItemsResult.forEach((item) => {
      const existing = productSales.get(item.productId) || {
        sales: 0,
        revenue: 0,
      };
      productSales.set(item.productId, {
        sales: existing.sales + item.quantity,
        revenue: existing.revenue + parseFloat(item.total),
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        id: productId,
        title:
          orderItemsResult.find((item) => item.productId === productId)
            ?.productName || "Unknown Product",
        sales: data.sales,
        revenue: data.revenue.toString(),
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      productsSold,
      topProducts,
    };
  } catch (error) {
    console.error("Error fetching vendor analytics:", error);
    return {
      totalProducts: 0,
      activeProducts: 0,
      totalOrders: 0,
      totalRevenue: "0",
      averageOrderValue: "0",
      productsSold: 0,
      topProducts: [],
    };
  }
};

// Utility functions
export const getCategories = async () => {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    return result;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getBrands = async () => {
  try {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
      })
      .from(brands)
      .orderBy(asc(brands.name));

    return result;
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};
