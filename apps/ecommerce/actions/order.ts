// apps/ecommerce/actions/order.ts
"use server";

import { db } from "@workspace/db";
import {
  orders,
  orderItems,
  returns,
  returnItems,
  reviews,
  deliveries,
  payments,
  userWalletTransactions,
  eq,
  and,
  desc,
  inArray,
  sql,
} from "@workspace/db";
import {
  restoreStock,
  type StockLine,
} from "@workspace/db/inventory";
import { cancelPendingAffiliateCommission } from "@workspace/db/affiliates";
import {
  DuplicateWalletTransactionError,
  postWalletTransaction,
  WALLET_REFERENCE_TYPES,
} from "@workspace/db/wallet";
import { placeOrderFromCart } from "@workspace/lib/orders";
import {
  applyInvalidation,
  invalidateProductInventory,
} from "@workspace/cache";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { buildOrderPagePath } from "@/lib/order-access-token";
import { getUser } from "./auth";
import { revalidateCartCheckout } from "@/lib/revalidate-cart-checkout";

/** Internal control-flow signal: a concurrent request already transitioned this order (cancel idempotency guard). */
class OrderAlreadyTransitionedError extends Error {}

/**
 * Formats a number to a string with 2 decimal places for database storage.
 */
function formatDecimal(value: number): string {
  return value.toFixed(2);
}

export async function createOrder(data: {
  cartId: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  isGift?: boolean;
  giftMessage?: string;
  variantId?: string;
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unable to get user ID" };
    }

    const result = await placeOrderFromCart({
      userId,
      cartId: data.cartId,
      shippingAddressId: data.shippingAddressId,
      billingAddressId: data.billingAddressId,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode,
      notes: data.notes,
      isGift: data.isGift,
      giftMessage: data.giftMessage,
      orderSource: "website",
      locale: "en",
    });

    if (!result.success) {
      if (result.error === "minPurchase" && result.minimumPurchase != null) {
        return {
          success: false,
          error: "minPurchase",
          minimumPurchase: result.minimumPurchase,
        };
      }
      return { success: false, error: result.error };
    }

    const { order, orderItems: createdOrderItems, inventoryItems } = result.data;

    await applyInvalidation(invalidateProductInventory(inventoryItems), {
      from: "ecommerce",
      mode: "action",
    });

    revalidateCartCheckout();

    return {
      success: true,
      data: {
        order,
        orderItems: createdOrderItems,
        orderPagePath: buildOrderPagePath(order.id),
      },
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function getOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const conditions = [eq(orders.userId, userId)];

    if (params?.status) {
      conditions.push(eq(orders.status, params.status as any));
    }

    const userOrders = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        orderItems: {
          with: {
            product: {
              columns: {
                images: true,
              },
              with: {
                productTranslations: {
                  columns: {
                    locale: true,
                    title: true,
                    slug: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
        userAddress_shippingAddressId: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(and(...conditions));

    const enrichedOrders = await Promise.all(
      userOrders.map(async (order) => {
        const orderItemsWithReviews = await Promise.all(
          order.orderItems.map(async (item) => {
            const productReview = await db.query.reviews.findFirst({
              where: and(
                eq(reviews.orderItemId, item.id),
                eq(reviews.userId, userId),
                eq(reviews.reviewType, "product")
              ),
              columns: { id: true },
            });

            const translations = item.product?.productTranslations ?? [];
            const enTranslation =
              translations.find((t) => t.locale === "en") ?? translations[0];

            return {
              ...item,
              sellerId: item.sellerId,
              hasReview: !!productReview,
              reviewId: productReview?.id ?? null,
              product: {
                title: enTranslation?.title ?? item.productName,
                slug: enTranslation?.slug ?? "",
                images: (item.product?.images as string[] | null) ?? null,
                description: enTranslation?.description ?? null,
              },
            };
          })
        );

        const sellerIds = [
          ...new Set(orderItemsWithReviews.map((item) => item.sellerId)),
        ];
        const storeSellers = await Promise.all(
          sellerIds.map(async (sellerId) => {
            const storeReview = await db.query.reviews.findFirst({
              where: and(
                eq(reviews.orderId, order.id),
                eq(reviews.sellerId, sellerId),
                eq(reviews.userId, userId),
                eq(reviews.reviewType, "store")
              ),
              columns: { id: true },
            });
            return {
              sellerId,
              hasStoreReview: !!storeReview,
            };
          })
        );

        return {
          ...order,
          orderItems: orderItemsWithReviews,
          storeSellers,
        };
      })
    );

    return {
      success: true,
      data: enrichedOrders,
      totalCount: Number(totalCount[0]?.count),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function getOrder(orderId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: {
          with: {
            product: true,
            seller: {
              columns: {
                displayName: true,
                slug: true,
              },
            },
            reviews: {
              where: eq(reviews.userId, user.user.id),
            },
          },
        },
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
        payments: true,
        shipments: {
          with: {
            deliveries: {
              orderBy: [desc(deliveries.createdAt)],
              limit: 1,
            },
          },
        },
        returns: {
          with: {
            returnItems: true,
            refunds: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching order:", error);
    return { success: false, error: "Failed to fetch order" };
  }
}

const MANUAL_PAYMENT_METHODS = ["instapay", "vodafone_cash", "e_cash"] as const;

export async function reportManualPaymentSent(orderId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (
      !MANUAL_PAYMENT_METHODS.includes(
        order.paymentMethod as (typeof MANUAL_PAYMENT_METHODS)[number]
      )
    ) {
      return { success: false, error: "Order is not a manual-transfer payment" };
    }

    await db
      .update(orders)
      .set({
        metadata: {
          ...((order.metadata as Record<string, unknown> | null) ?? {}),
          paymentSelfReported: true,
          paymentSelfReportedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      data: { orderPagePath: buildOrderPagePath(orderId) },
    };
  } catch (error) {
    console.error("Error reporting manual payment:", error);
    return { success: false, error: "Failed to update order" };
  }
}

const CANCELLABLE_STATUSES = ["pending", "payment_processing", "confirmed"] as const;

export async function cancelOrder(orderId: string, reason?: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (
      !CANCELLABLE_STATUSES.includes(
        order.status as (typeof CANCELLABLE_STATUSES)[number]
      )
    ) {
      return {
        success: false,
        error: "Order cannot be cancelled at this stage",
      };
    }

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
      with: {
        product: {
          columns: { categoryId: true, brandId: true },
        },
      },
    });

    let updatedOrder: typeof orders.$inferSelect | undefined;
    let stockResults: Awaited<ReturnType<typeof restoreStock>> = [];

    try {
      await db.transaction(async (tx) => {
        const [row] = await tx
          .update(orders)
          .set({
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: reason || order.notes,
          })
          .where(
            and(eq(orders.id, orderId), inArray(orders.status, [...CANCELLABLE_STATUSES]))
          )
          .returning();

        if (!row) {
          throw new OrderAlreadyTransitionedError();
        }
        updatedOrder = row;

        await tx
          .update(orderItems)
          .set({
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orderItems.orderId, orderId));

        const stockLines: StockLine[] = items.map((item) =>
          item.variantId
            ? { kind: "variant" as const, id: item.variantId, quantity: item.quantity }
            : { kind: "product" as const, id: item.productId, quantity: item.quantity }
        );
        stockResults = await restoreStock(tx, stockLines);

        await cancelPendingAffiliateCommission(tx, orderId);

        const orderPaymentDebit =
          await tx.query.userWalletTransactions.findFirst({
            where: and(
              eq(
                userWalletTransactions.referenceType,
                WALLET_REFERENCE_TYPES.order,
              ),
              eq(userWalletTransactions.referenceId, orderId),
              eq(userWalletTransactions.type, "order_payment"),
              eq(userWalletTransactions.status, "completed"),
            ),
            columns: {
              id: true,
              walletId: true,
              userId: true,
              amount: true,
            },
          });

        if (orderPaymentDebit) {
          const refundAmount = Math.abs(Number(orderPaymentDebit.amount));
          if (refundAmount > 0) {
            try {
              await postWalletTransaction(tx, {
                walletId: orderPaymentDebit.walletId,
                userId: orderPaymentDebit.userId,
                type: "refund",
                amount: formatDecimal(refundAmount),
                direction: "credit",
                referenceType: WALLET_REFERENCE_TYPES.order,
                referenceId: orderId,
                description: `Refund for cancelled order`,
              });
            } catch (err) {
              if (!(err instanceof DuplicateWalletTransactionError)) {
                throw err;
              }
            }

            await tx
              .update(payments)
              .set({
                status: "refunded",
                updatedAt: new Date().toISOString(),
              })
              .where(
                and(
                  eq(payments.orderId, orderId),
                  eq(payments.method, "wallet"),
                  eq(payments.status, "paid"),
                ),
              );
          }
        }
      });
    } catch (err) {
      if (err instanceof OrderAlreadyTransitionedError) {
        return {
          success: false,
          error: "Order was already updated by another request",
        };
      }
      throw err;
    }

    const inventoryItems = stockResults.map((r) => {
      const item = items.find((i) => (i.variantId ?? i.productId) === r.id)!;
      return {
        snapshot: {
          id: item.productId,
          sellerId: item.sellerId,
          categoryId: item.product?.categoryId ?? null,
          brandId: item.product?.brandId ?? null,
        },
        stockBoundaryCrossed: r.stockBoundaryCrossed,
      };
    });
    await applyInvalidation(invalidateProductInventory(inventoryItems), {
      from: "ecommerce",
      mode: "action",
    });

    return { success: true, data: updatedOrder };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}

export async function initiateReturn(data: {
  orderId: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason: string;
    condition: string;
    details?: string;
  }>;
  returnType?: "refund" | "exchange";
  additionalDetails?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, data.orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "delivered") {
      return {
        success: false,
        error: "Order must be delivered to initiate return",
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (order.deliveredAt && new Date(order.deliveredAt) < thirtyDaysAgo) {
      return { success: false, error: "Return period has expired" };
    }

    let totalAmount = 0;
    for (const item of data.items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.id === item.orderItemId
      );
      if (orderItem) {
        totalAmount += Number(orderItem.price) * item.quantity;
      }
    }

    const rmaNumber = `RMA${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    let newReturn: typeof returns.$inferSelect | undefined;

    await db.transaction(async (tx) => {
      [newReturn] = await tx
        .insert(returns)
        .values({
          orderId: data.orderId,
          userId: user.user.id,
          rmaNumber,
          status: "requested",
          returnReason: data.items[0]?.reason as any,
          returnType: data.returnType || "refund",
          additionalDetails: data.additionalDetails,
          totalAmount: formatDecimal(totalAmount),
        })
        .returning();

      const returnItemsData = data.items.map((item) => ({
        returnId: newReturn!.id,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition,
        details: item.details,
        status: "pending",
      }));

      await tx.insert(returnItems).values(returnItemsData as any);

      for (const item of data.items) {
        await tx
          .update(orderItems)
          .set({
            isReturned: true,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orderItems.id, item.orderItemId));
      }
    });

    return {
      success: true,
      data: {
        return: newReturn,
        rmaNumber,
      },
    };
  } catch (error) {
    console.error("Error initiating return:", error);
    return { success: false, error: "Failed to initiate return" };
  }
}

export async function trackOrder(orderNumber: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      columns: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
      },
      with: {
        shipments: {
          columns: {
            trackingNumber: true,
            carrier: true,
            status: true,
            estimatedDeliveryDate: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error tracking order:", error);
    return { success: false, error: "Failed to track order" };
  }
}

export async function reorderItems(orderId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const { addToCart } = await import("./cart");

    let addedCount = 0;
    for (const item of order.orderItems) {
      const result = await addToCart({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId || undefined,
      } as any);

      if (result.success) {
        addedCount++;
      }
    }

    return {
      success: true,
      message: `${addedCount} items added to cart`,
    };
  } catch (error) {
    console.error("Error reordering items:", error);
    return { success: false, error: "Failed to reorder items" };
  }
}
