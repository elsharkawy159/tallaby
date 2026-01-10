"use server";

import { db, eq, and } from "@workspace/db";
import { orders, orderItems, userAddresses, reviews } from "@workspace/db";
import type { OrderConfirmationData } from "./order-confirmation.types";
import { getCurrentUserId } from "@/lib/get-current-user-id";

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

    // Fetch order with all related data
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        orderItems: {
          with: {
            product: {
              columns: {
                title: true,
                slug: true,
                images: true,
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
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Calculate summary
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
      orderItems: await Promise.all(
        order.orderItems.map(async (item) => {
          // Check if review exists for this order item
          const existingReview = await db.query.reviews.findFirst({
            where: and(
              eq(reviews.orderItemId, item.id),
              eq(reviews.userId, userId)
            ),
            columns: { id: true },
          });

          return {
            id: item.id,
            productId: item.productId,
            sellerId: item.sellerId,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            product: {
              title: item.product.title,
              slug: item.product.slug,
              images: item.product.images || [],
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
          } as any;
        })
      ),
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
            fullName: order.userAddress_billingAddressId.fullName || "" ,
            addressLine1: order.userAddress_billingAddressId.addressLine1 || "",
            addressLine2: order.userAddress_billingAddressId.addressLine2 || "",
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
