"use server";

import {
  db,
  sellers,
  products,
  orders,
  orderItems,
  categories,
  brands,
} from "@workspace/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { SellerStatus } from "@/lib/utils/seller";
import { getUser } from "./auth";

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
  images: any;
  sku: string;
  condition: string;
  basePrice: string;
  salePrice?: string;
  listPrice?: string;
  quantity: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating?: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  // Related data
  brand?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

// Removed VendorProductListing - data is now part of VendorProduct

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
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ products: VendorProduct[]; total: number }> => {
  try {
    const offset = (page - 1) * limit;
    const { user } = await getUser();

    // Select only essential fields with proper joins
    const productsData = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        images: products.images,
        sku: products.sku,
        condition: products.condition,
        basePrice: products.basePrice,
        salePrice: products.salePrice,
        listPrice: products.listPrice,
        quantity: products.quantity,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        averageRating: products.averageRating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        brand: {
          id: brands.id,
          name: brands.name,
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.mainCategoryId, categories.id))
      .where(eq(products.sellerId, user.id))
      .orderBy(desc(products.updatedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.sellerId, user.id));

    return {
      products: productsData as VendorProduct[],
      total: totalResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return { products: [], total: 0 };
  }
};

export const getVendorProduct = async (
  productId: string
): Promise<VendorProduct | null> => {
  try {
    const { user } = await getUser();

    const productResult = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        images: products.images,
        sku: products.sku,
        condition: products.condition,
        basePrice: products.basePrice,
        salePrice: products.salePrice,
        listPrice: products.listPrice,
        quantity: products.quantity,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        averageRating: products.averageRating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        brand: {
          id: brands.id,
          name: brands.name,
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.mainCategoryId, categories.id))
      .where(and(eq(products.id, productId), eq(products.sellerId, user.id)))
      .limit(1);

    if (productResult.length === 0) return null;
    return productResult[0] as VendorProduct;
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
        sellerId,
        sku: productData.sku,
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
    await db.insert(products).values({
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
  productId: string,
  productData: Partial<VendorProduct>
): Promise<{ success: boolean; message: string }> => {
  try {
    const { user } = await getUser();

    if (Object.keys(productData).length === 0) {
      return { success: false, message: "No data to update" };
    }

    await db
      .update(products)
      .set({
        ...(productData as any),
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(products.id, productId), eq(products.sellerId, user.id)));

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Error updating vendor product:", error);
    return { success: false, message: "Failed to update product" };
  }
};

export const deleteVendorProduct = async (
  productId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { user } = await getUser();

    const result = await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.sellerId, user.id)))
      .returning({ id: products.id });

    if (result.length === 0) {
      return { success: false, message: "Product not found or access denied" };
    }

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
          productListingId: item.id || "",
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
          .from(products)
          .where(eq(products.sellerId, sellerId)),

        // Active products
        db
          .select({ count: count() })
          .from(products)
          .where(
            and(eq(products.sellerId, sellerId), eq(products.isActive, true))
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
