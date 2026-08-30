"use server";

import { db, eq, and } from "@workspace/db";
import { orders, reviews } from "@workspace/db";
import type {
  OrderConfirmationData,
  OrderItemReview,
  StoreSellerReview,
} from "./order-confirmation.types";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { getLocale } from "next-intl/server";
import {
  pickTranslationFromArray,
  type ProductLocale,
} from "@/lib/product-translations";

export async function getOrderConfirmationData(orderId: string): Promise<{
  success: boolean;
  data?: OrderConfirmationData;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const locale = (await getLocale()) as ProductLocale;

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        orderItems: {
          with: {
            product: {
              columns: {
                images: true,
              },
              with: {
                productTranslations: true,
              },
            },
            seller: {
              columns: {
                displayName: true,
                slug: true,
              },
            },
            productVariant: {
              columns: {
                imageUrl: true,
              },
            },
          },
        },
        shipments: {
          columns: {
            trackingNumber: true,
            carrier: true,
            status: true,
            estimatedDeliveryDate: true,
          },
        },
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const subtotal = order.orderItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );
    const tax = Number(order.tax) || 0;
    const shippingCost = Number(order.shippingCost) || 0;
    const discountAmount = Number(order.discountAmount) || 0;
    const totalAmount = Number(order.totalAmount);
    const itemCount = order.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const orderItems = await Promise.all(
      order.orderItems.map(async (item) => {
        const existingReview = await db.query.reviews.findFirst({
          where: and(
            eq(reviews.orderItemId, item.id),
            eq(reviews.userId, userId),
            eq(reviews.reviewType, "product")
          ),
          columns: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            images: true,
            status: true,
            isAnonymous: true,
          },
        });

        const translation = pickTranslationFromArray(
          item.product.productTranslations ?? [],
          locale
        );

        const review: OrderItemReview | null = existingReview
          ? {
              ...existingReview,
              images: (existingReview.images as string[] | null) ?? null,
            }
          : null;

        return {
          id: item.id,
          productId: item.productId,
          sellerId: item.sellerId,
          productName: item.productName,
          variantName: item.variantName ?? undefined,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          product: {
            title: translation?.title ?? item.productName,
            slug: translation?.slug ?? "",
            images: (item.product.images as string[] | null) ?? [],
          },
          variant: item.productVariant
            ? {
                imageUrl: item.productVariant.imageUrl || null,
              }
            : null,
          seller: {
            displayName: item.seller.displayName,
            slug: item.seller.slug,
          },
          hasReview: !!existingReview,
          review,
        };
      })
    );

    const sellerMap = new Map<string, StoreSellerReview>();
    for (const item of orderItems) {
      if (!sellerMap.has(item.sellerId)) {
        const storeReview = await db.query.reviews.findFirst({
          where: and(
            eq(reviews.orderId, orderId),
            eq(reviews.sellerId, item.sellerId),
            eq(reviews.userId, userId),
            eq(reviews.reviewType, "store")
          ),
          columns: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            status: true,
            isAnonymous: true,
          },
        });

        sellerMap.set(item.sellerId, {
          sellerId: item.sellerId,
          displayName: item.seller.displayName,
          slug: item.seller.slug,
          hasStoreReview: !!storeReview,
          storeReview: storeReview ?? null,
        });
      }
    }

    const confirmationData: OrderConfirmationData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status || "",
        createdAt: order.createdAt || "",
        totalAmount: order.totalAmount,
        currency: order.currency || "",
        paymentStatus: order.paymentStatus || "",
        paymentMethod: order.paymentMethod || "",
        isGift: order.isGift || false,
        giftMessage: order.giftMessage || "",
        notes: order.notes || "",
      },
      orderItems,
      storeSellers: Array.from(sellerMap.values()),
      shipments: (order.shipments ?? []).map((s) => ({
        trackingNumber: s.trackingNumber ?? null,
        carrier: s.carrier ?? null,
        status: s.status ?? null,
        estimatedDeliveryDate: s.estimatedDeliveryDate ?? null,
      })),
      shippingAddress: {
        fullName: order.userAddress_shippingAddressId?.fullName || "",
        addressLine1: order.userAddress_shippingAddressId?.addressLine1 || "",
        addressLine2: order.userAddress_shippingAddressId?.addressLine2 || "",
        city: order.userAddress_shippingAddressId?.city || "",
        state: order.userAddress_shippingAddressId?.state || "",
        postalCode: order.userAddress_shippingAddressId?.postalCode || "",
        country: order.userAddress_shippingAddressId?.country || "",
        phone: order.userAddress_shippingAddressId?.phone || "",
      },
      billingAddress: order.userAddress_billingAddressId
        ? {
            fullName: order.userAddress_billingAddressId.fullName || "",
            addressLine1:
              order.userAddress_billingAddressId.addressLine1 || "",
            addressLine2:
              order.userAddress_billingAddressId.addressLine2 || "",
            city: order.userAddress_billingAddressId.city || "",
            state: order.userAddress_billingAddressId.state || "",
            postalCode: order.userAddress_billingAddressId.postalCode || "",
            country: order.userAddress_billingAddressId.country || "",
          }
        : undefined,
      summary: {
        subtotal,
        tax,
        shippingCost,
        discountAmount,
        totalAmount,
        itemCount,
      },
    };

    return { success: true, data: confirmationData };
  } catch (error) {
    console.error("Error fetching order confirmation data:", error);
    return { success: false, error: "Failed to fetch order details" };
  }
}
