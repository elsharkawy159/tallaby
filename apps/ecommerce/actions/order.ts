// apps/ecommerce/actions/order.ts
"use server";

import { db } from "@workspace/db";
import {
  orders,
  orderItems,
  userAddresses,
  couponUsage,
  coupons,
  carts,
  cartItems,
  returns,
  returnItems,
  reviews,
  deliveries,
  eq,
  and,
  desc,
  inArray,
  sql,
} from "@workspace/db";
import {
  decrementStock,
  restoreStock,
  InsufficientStockError,
  type StockLine,
} from "@workspace/db/inventory";
import { claimCouponUsage } from "@workspace/db/coupons";
import {
  applyInvalidation,
  invalidateProductInventory,
} from "@workspace/cache";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { getUser } from "./auth";
import { formatVariantTitle } from "@/lib/variant-utils";
import { pickTranslationFromArray } from "@/lib/product-translations";
import { calculateOrderShippingCost } from "@/lib/shipping";

/** Internal control-flow signal: the coupon lost a concurrent usage-limit race inside the order transaction. */
class CouponClaimFailedError extends Error {}
/** Internal control-flow signal: a concurrent request already transitioned this order (cancel idempotency guard). */
class OrderAlreadyTransitionedError extends Error {}

/**
 * Formats a number to a string with 2 decimal places for database storage.
 * This should only be used when storing values in the database (which uses numeric(10,2)).
 * Calculations should use numbers directly to maintain precision.
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

    // Get cart items with product translations. `product` carries the
    // AUTHORITATIVE status/categoryId/brandId used below — price
    // is still taken from cartItems.price (frozen at add-to-cart, matching
    // what the customer was shown), but every line is re-validated against
    // the live product row before anything is written.
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, data.cartId), eq(carts.userId, userId)),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
          with: {
            product: {
              with: {
                productTranslations: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const isDigitalOnlyCart = cart.cartItems.every(
      (item) => item.product.productType === "digital"
    );

    // Digital-only orders have nothing to ship, so no shipping address is required.
    let shippingAddress: { id: string } | undefined;
    if (!isDigitalOnlyCart) {
      if (!data.shippingAddressId) {
        return { success: false, error: "Shipping address is required" };
      }

      shippingAddress = await db.query.userAddresses.findFirst({
        where: and(
          eq(userAddresses.id, data.shippingAddressId),
          eq(userAddresses.userId, userId)
        ),
      });

      if (!shippingAddress) {
        return { success: false, error: "Shipping address not found" };
      }
    }

    // Fast-fail if a cart item is no longer purchasable. The atomic stock
    // decrement below is the real concurrency guard against overselling;
    // this just gives a clear error for an obviously stale/deactivated item.
    for (const item of cart.cartItems) {
      if (item.product.status !== "active") {
        return {
          success: false,
          error: `Product is no longer available: ${item.product.sku ?? item.productId}`,
        };
      }
    }

    // Calculate totals
    let subtotal = 0;
    const tax = 0;
    const hasDigitalItems = cart.cartItems.some(
      (item) => item.product.productType === "digital"
    );
    const shippingCost = calculateOrderShippingCost(cart.cartItems);

    const orderItemsData = cart.cartItems.map((item) => {
      const itemSubtotal = Number(item.price) * item.quantity;
      subtotal += itemSubtotal;

      const itemCommission = itemSubtotal * 0.1; // 10% commission
      const itemSellerEarning = itemSubtotal * 0.9;

      const variant = item.variant as any;
      const variantTitle = variant ? formatVariantTitle(variant) : null;

      // Get product title from translations (fallback to SKU if no translation)
      const productWithTranslations = item.product as any;
      const translation = pickTranslationFromArray(
        productWithTranslations.productTranslations ?? [],
        "en"
      );
      const productName = translation?.title || `Product ${item.product.sku || item.productId}`;

      return {
        productId: item.productId,
        variantId: variant?.id || null,
        sellerId: item.sellerId,
        sku: variant?.sku || item.product.sku,
        productName,
        variantName: variantTitle,
        quantity: item.quantity,
        price: item.price,
        subtotal: formatDecimal(itemSubtotal),
        tax: formatDecimal(tax),
        // Shipping is recorded once on the order below, not duplicated per line.
        shippingCost: "0.00",
        total: formatDecimal(itemSubtotal),
        discountAmount: "0.00",
        commissionRate: 0.1, // 10% commission
        commissionAmount: formatDecimal(itemCommission),
        sellerEarning: formatDecimal(itemSellerEarning),
        currency: cart.currency || "EGP",
        condition: item.product.condition,
        fulfillmentType: item.product.fulfillmentType,
        status: "pending",
      };
    });

    // Apply coupon if provided. Validation (limits/dates/minimum purchase)
    // happens here to compute totals; the actual usage-count CLAIM happens
    // atomically inside the transaction below via claimCouponUsage, which
    // re-checks the limit at write time and is what actually prevents two
    // concurrent checkouts from both exceeding usageLimit.
    let discountAmount = 0;
    let shippingDiscount = 0;
    let appliedCoupon: typeof coupons.$inferSelect | null = null;

    if (data.couponCode) {
      // Case-insensitive coupon lookup
      const normalizedCode = data.couponCode.trim().toUpperCase();
      const coupon = await db.query.coupons.findFirst({
        where: and(
          sql`UPPER(${coupons.code}) = ${normalizedCode}`,
          eq(coupons.isActive, true),
          sql`(${coupons.startsAt} IS NULL OR ${coupons.startsAt} <= NOW())`,
          sql`(${coupons.expiresAt} IS NULL OR ${coupons.expiresAt} >= NOW())`
        ),
      });

      if (coupon) {
        // Check usage limit
        if (
          coupon.usageLimit &&
          coupon.usageCount &&
          coupon.usageCount >= coupon.usageLimit
        ) {
          return { success: false, error: "Coupon usage limit reached" };
        }

        // Check minimum purchase
        if (
          coupon.minimumPurchase &&
          subtotal < Number(coupon.minimumPurchase)
        ) {
          const minAmount = Number(coupon.minimumPurchase);
          return {
            success: false,
            error: "minPurchase",
            minimumPurchase: minAmount,
          };
        }

        // Calculate discount based on type
        if (coupon.discountType === "percentage") {
          discountAmount = subtotal * (Number(coupon.discountValue) / 100);
        } else if (coupon.discountType === "fixed_amount") {
          discountAmount = Number(coupon.discountValue);
        } else if (coupon.discountType === "free_shipping") {
          shippingDiscount = shippingCost;
        }

        // Apply maximum discount if set (for percentage/fixed_amount)
        if (
          coupon.maximumDiscount &&
          discountAmount > Number(coupon.maximumDiscount)
        ) {
          discountAmount = Number(coupon.maximumDiscount);
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }

        appliedCoupon = coupon;
      }
    }

    // Calculate total discount and final amount
    // shipping_cost stores original delivery cost, discount_amount includes all discounts
    // total_amount = (subtotal + shipping_cost + tax) - discount_amount
    const totalDiscount = discountAmount + shippingDiscount;
    const totalAmount = subtotal + shippingCost + tax - totalDiscount;

    // Generate a more unique order number using nanoid
    const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);
    const orderNumber = `ORD${nanoid()}`;

    // Build the atomic stock-decrement lines. Keyed by (kind,id) so results
    // can be matched back to their cart item afterward regardless of the
    // order decrementStock actually applies them in (it sorts internally to
    // avoid deadlocks against a concurrent multi-item order).
    const stockLineMeta = new Map<string, (typeof cart.cartItems)[number]>();
    const stockLines: StockLine[] = cart.cartItems.map((item) => {
      const variant = item.variant as { id?: string } | null;
      const line: StockLine = variant?.id
        ? { kind: "variant", id: variant.id, quantity: item.quantity }
        : { kind: "product", id: item.productId, quantity: item.quantity };
      stockLineMeta.set(`${line.kind}:${line.id}`, item);
      return line;
    });

    let newOrder: typeof orders.$inferSelect | undefined;
    let createdOrderItems: (typeof orderItems.$inferSelect)[] = [];
    let stockResults: Awaited<ReturnType<typeof decrementStock>> = [];

    try {
      await db.transaction(async (tx) => {
        // 1. Atomic, WHERE-guarded decrement — no read-then-write. Throws
        //    InsufficientStockError (rolling back everything below) the
        //    instant any line can't be satisfied, so a multi-item order
        //    either fully succeeds or fully fails.
        stockResults = await decrementStock(tx, stockLines);

        // 2. Atomic coupon claim — replaces the old read `usageCount` ->
        //    write `usageCount + 1` race.
        if (appliedCoupon) {
          const claimed = await claimCouponUsage(tx, appliedCoupon.id);
          if (!claimed) {
            throw new CouponClaimFailedError();
          }
        }

        // 3. Create order
        [newOrder] = await tx
          .insert(orders)
          .values({
            orderNumber,
            userId,
            cartId: data.cartId,
            subtotal: formatDecimal(subtotal),
            shippingCost: formatDecimal(shippingCost),
            tax: formatDecimal(tax),
            discountAmount: formatDecimal(totalDiscount),
            totalAmount: formatDecimal(totalAmount),
            currency: cart.currency || "EGP",
            status: "pending",
            paymentStatus: "pending",
            paymentMethod: data.paymentMethod,
            shippingAddressId: data.shippingAddressId || null,
            billingAddressId:
              data.billingAddressId || data.shippingAddressId || null,
            isGift: data.isGift || false,
            giftMessage: data.giftMessage,
            couponCode: data.couponCode,
            notes: data.notes,
            hasDigitalItems,
            isDigitalOnly: isDigitalOnlyCart,
          })
          .returning();

        // 4. Create order items
        createdOrderItems = await tx
          .insert(orderItems)
          .values(
            orderItemsData.map((item) => ({
              ...item,
              orderId: newOrder!.id,
            })) as any
          )
          .returning();

        // 5. Record coupon usage
        if (appliedCoupon) {
          await tx.insert(couponUsage).values({
            couponId: appliedCoupon.id,
            userId,
            orderId: newOrder!.id,
            discountAmount: formatDecimal(totalDiscount),
          });
        }

        // 6. Clear cart + mark completed
        await tx
          .delete(cartItems)
          .where(
            and(
              eq(cartItems.cartId, data.cartId),
              eq(cartItems.savedForLater, false)
            )
          );

        await tx
          .update(carts)
          .set({
            status: "completed",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(carts.id, data.cartId));
      });
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        return {
          success: false,
          error: `Insufficient stock for ${err.kind === "variant" ? "a selected option" : "a product"} in your cart`,
        };
      }
      if (err instanceof CouponClaimFailedError) {
        return { success: false, error: "Coupon usage limit reached" };
      }
      throw err;
    }

    // Invalidate inventory-affected caches AFTER commit. Matched by
    // (kind,id) rather than array position since decrementStock's internal
    // lock ordering may not preserve input order.
    const inventoryItems = stockResults.map((r) => {
      const item = stockLineMeta.get(`${r.kind}:${r.id}`)!;
      return {
        snapshot: {
          id: item.productId,
          sellerId: item.sellerId,
          categoryId: item.product.categoryId,
          brandId: item.product.brandId,
        },
        stockBoundaryCrossed: r.stockBoundaryCrossed,
      };
    });
    await applyInvalidation(invalidateProductInventory(inventoryItems), {
      from: "ecommerce",
      mode: "action",
    });

    // Revalidate cart page to reflect cleared cart
    revalidatePath("/cart");
    revalidatePath("/cart/checkout");

    return {
      success: true,
      data: {
        order: newOrder,
        orderItems: createdOrderItems,
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

    // orderItems carries sellerId directly; join to products for
    // categoryId/brandId, needed only for cache invalidation below.
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
        // The WHERE ... status IN (...) clause IS the idempotency guard: a
        // concurrent second cancel request for this order matches zero rows
        // here, so the restock below never runs twice for the same order.
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

    // Verify order belongs to user
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, data.orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if order is eligible for return (delivered within 30 days)
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

    // Calculate total return amount
    let totalAmount = 0;
    for (const item of data.items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.id === item.orderItemId
      );
      if (orderItem) {
        totalAmount += Number(orderItem.price) * item.quantity;
      }
    }

    // Generate RMA number
    const rmaNumber = `RMA${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Note: this only records the return request. Stock is NOT restored
    // here — the item hasn't physically come back to the seller yet.
    // Restoring on receipt/approval is a separate flow this refactor does
    // not add (no such transition exists in the app today); see
    // docs/caching-and-data-fetching.md for the tracked gap.
    let newReturn: typeof returns.$inferSelect | undefined;

    await db.transaction(async (tx) => {
      [newReturn] = await tx
        .insert(returns)
        .values({
          orderId: data.orderId,
          userId: user.user.id,
          rmaNumber,
          status: "requested",
          returnReason: data.items[0]?.reason as any, // Use first item's reason as primary
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

    // Import cart action to add items
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
