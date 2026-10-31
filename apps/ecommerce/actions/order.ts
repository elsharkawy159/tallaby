// apps/ecommerce/actions/order.ts
"use server";

import { db } from "@workspace/db";
import { isOnlineCardPaymentEnabled } from "@workspace/lib/payments";
import { ONLINE_CARD_PAYMENT_ENABLED } from "@/lib/constants";
import {
  carts,
  cartItems,
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
import { richTextToPlainText } from "@workspace/tiptap/plain-text";
import {
  DuplicateWalletTransactionError,
  postWalletTransaction,
  WALLET_REFERENCE_TYPES,
} from "@workspace/db/wallet";
import { placeOrderFromCart, sendOrderEventEmail, sendRefundIssuedEmail } from "@workspace/lib/orders";
import { cartProductsOutsideStoreCatalog } from "@workspace/lib/stores/server";
import {
  applyInvalidation,
  invalidateProductInventory,
} from "@workspace/cache";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import {
  getCartScope,
  getStorefrontCheckoutPayments,
  isCartStoreOffline,
} from "@/lib/storefront.server";
import { hasStoreTrackingConsent, STORE_TRACKING_CONSENT_COOKIE } from "@/lib/storefront-consent";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { after } from "next/server";
import { isMarketplaceRequest } from "@/lib/marketplace/marketplace-host.server";
import { buildOrderPagePath, verifyOrderAccess } from "@/lib/order-access-token";
import { getUser } from "./auth";
import { getServiceClient } from "@workspace/db/supabase/service";
import { STOREFRONT_ONLY_METHODS } from "@workspace/lib/payments/store-methods";
import { parseWalletPartialPaymentMethod } from "@workspace/lib/orders/payment";
import {
  PAYMENT_PROOF_BUCKET,
  PAYMENT_PROOF_MAX_BYTES,
  buildPaymentProofPath,
  sniffPaymentProofType,
} from "@workspace/lib/orders/payment-proof";
import { revalidateCartCheckout } from "@/lib/revalidate-cart-checkout";
import { clearPendingCouponCode } from "@/lib/affiliate-coupon-cookie";
import { getStorefrontCheckoutForm, getStorefrontMinOrder } from "@/lib/storefront-checkout-form.server";
import { applyCheckoutAnswers } from "@workspace/lib/stores/checkout-form";
import { isStoreOrderAllowed, recordStoreOrder, storeOrderRateKeys } from "@/lib/order-rate-limit.server";
import type { OrderRateKeys } from "@/lib/order-rate-limit.lib";
import { activeMinOrderPiastres, checkMinOrder, itemsSubtotalPiastres, piastresToEgpText } from "@workspace/lib/stores/min-order";
import { CAMPAIGN_COOKIE, decodeCampaignCookie } from "@workspace/lib/campaigns/utm";

/** placeOrderFromCart's store-shipping refusals → checkout message keys. */
const STORE_SHIPPING_ERRORS: Record<string, "notDeliveredHere" | "egyptOnly" | "zoneNoCod" | "orderNotAccepted"> = {
  storeShippingNotCovered: "notDeliveredHere",
  storeShippingOutsideEgypt: "egyptOnly",
  storeShippingNoCod: "zoneNoCod",
  // A phone the seller blocked (ROADMAP.md F-02): neutral, never "you are blocked".
  storeCustomerBlocked: "orderNotAccepted",
};

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
  /** Store websites (F-25): the extra checkout fields; checked against the store's form. */
  checkoutAnswers?: { email?: string; secondPhone?: string; customAnswer?: string };
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unable to get user ID" };
    }


    // The seller took this store's website offline: it takes no orders.
    if (await isCartStoreOffline(data.cartId)) {
      return { success: false, error: "This store is temporarily unavailable" };
    }

    // A store with a selected catalog (D24) may have dropped a product after it
    // was added to this cart; refuse like an unavailable product.
    const [unsold] = await cartProductsOutsideStoreCatalog(data.cartId);
    if (unsold) {
      return { success: false, error: `Product is no longer available: ${unsold}` };
    }

    // Storefront: only the store's enabled methods (checked again with the
    // order total inside placeOrderFromCart).
    const storefrontPayments = await getStorefrontCheckoutPayments();

    // WE Pay and Orange Cash are paid to a seller's own wallet, so only a
    // store website offers them; the marketplace has no account for them.
    const transferMethod = parseWalletPartialPaymentMethod(data.paymentMethod) ?? data.paymentMethod;
    if (!storefrontPayments && (STOREFRONT_ONLY_METHODS as readonly string[]).includes(transferMethod)) {
      return { success: false, error: "This payment method is not available" };
    }

    // Card: on a storefront only through the seller's own gateway (F-39,
    // checked in placeOrderFromCart); on the marketplace, Tallaby's switch.
    if (
      data.paymentMethod === "online_payment" &&
      (storefrontPayments
        ? !storefrontPayments.gateway
        : !(ONLINE_CARD_PAYMENT_ENABLED && isOnlineCardPaymentEnabled()))
    ) {
      return { success: false, error: "Online card payment is unavailable" };
    }

    // Store websites: the store's checkout form (ROADMAP.md F-25a). Hidden
    // fields are dropped, required ones enforced, and the answers go into the
    // order notes. Without saved settings the notes pass through unchanged.
    let notes = data.notes;
    // Store websites: orders per IP, phone and user (ROADMAP.md F-02e).
    let orderRateKeys: OrderRateKeys | null = null;
    if (storefrontPayments) {
      const rateScope = await getCartScope();
      if (rateScope) {
        orderRateKeys = await storeOrderRateKeys({ storeId: rateScope.storeId, userId, shippingAddressId: data.shippingAddressId });
        if (!isStoreOrderAllowed(orderRateKeys)) {
          const t = await getTranslations("checkout");
          return { success: false, error: t("tooManyOrders") };
        }
      }

      // Store websites: the store's minimum order (ROADMAP.md F-13b). The
      // items subtotal of this user's cart, before shipping and coupons, in
      // piastres; validation only, no price changes.
      const minOrder = await getStorefrontMinOrder();
      if (activeMinOrderPiastres(minOrder) != null) {
        const lines = await db
          .select({ price: cartItems.price, quantity: cartItems.quantity })
          .from(cartItems)
          .innerJoin(carts, eq(carts.id, cartItems.cartId))
          .where(and(eq(carts.id, data.cartId), eq(carts.userId, userId), eq(cartItems.savedForLater, false)));
        const minCheck = checkMinOrder(minOrder, itemsSubtotalPiastres(lines));
        if (!minCheck.ok) {
          const t = await getTranslations("checkout");
          return {
            success: false,
            error: t("minOrderNotReached", {
              minimum: piastresToEgpText(minCheck.minimumPiastres),
              missing: piastresToEgpText(minCheck.shortPiastres),
            }),
          };
        }
      }

      const checkoutForm = await getStorefrontCheckoutForm();
      if (checkoutForm) {
        const checked = applyCheckoutAnswers(checkoutForm, { ...data.checkoutAnswers, notes: data.notes });
        if (!checked.ok) {
          const t = await getTranslations("storeCheckoutForm");
          return { success: false, error: t(`errors.${checked.error}`) };
        }
        notes = checked.notes;
      }
    }

    const result = await placeOrderFromCart({
      userId,
      cartId: data.cartId,
      shippingAddressId: data.shippingAddressId,
      billingAddressId: data.billingAddressId,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode,
      notes,
      isGift: data.isGift,
      giftMessage: data.giftMessage,
      orderSource: storefrontPayments ? "storefront" : "website",
      locale: "en",
      storefrontPayments: storefrontPayments ?? undefined,
    });

    if (!result.success) {
      if (result.error === "minPurchase" && result.minimumPurchase != null) {
        return {
          success: false,
          error: "minPurchase",
          minimumPurchase: result.minimumPurchase,
        };
      }
      const shippingKey = STORE_SHIPPING_ERRORS[result.error];
      if (shippingKey) {
        const t = await getTranslations("checkout");
        return { success: false, error: t(shippingKey) };
      }
      return { success: false, error: result.error };
    }

    const { order, orderItems: createdOrderItems, inventoryItems } = result.data;
    recordStoreOrder(orderRateKeys);

    await applyInvalidation(invalidateProductInventory(inventoryItems), {
      from: "ecommerce",
      mode: "action",
    });

    revalidateCartCheckout();
    await clearPendingCouponCode();

    // Campaign tracking (ROADMAP.md F-26a): the store host's first-touch UTM
    // cookie, re-sanitized, merged into orders.metadata.utm after the order
    // committed. Reporting only; a failure never touches the order.
    if (storefrontPayments && order.storeId) {
      try {
        const touch = decodeCampaignCookie((await cookies()).get(CAMPAIGN_COOKIE)?.value);
        const scope = touch ? await getCartScope() : null;
        if (touch && scope?.storeId === order.storeId) {
          const orderId = order.id;
          const storeId = order.storeId;
          after(async () => {
            try {
              await db
                .update(orders)
                .set({ metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || jsonb_build_object('utm', ${JSON.stringify(touch)}::jsonb)` })
                .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
            } catch {
              console.error("Order campaign tracking failed");
            }
          });
        }
      } catch {
        console.error("Order campaign tracking failed");
      }
    }

    const metaEventId = order.id;
    // Tallaby CAPI is marketplace-only; storefront orders skip it (PLAN.md P5-05).
    if (await isMarketplaceRequest()) {
      try {
        const { sendMetaCapiEvent } = await import("@/lib/meta/meta.server");
        const { getMetaCapiUserData } = await import("@/lib/meta/meta.user");
        const { toMetaContentIds } = await import("@/lib/meta/meta.product");
        const { DEFAULT_CURRENCY } = await import("@/lib/constants");

        const productIds = createdOrderItems.map((item) => item.productId);
        const numItems = createdOrderItems.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        );
        const { userData, eventSourceUrl } = await getMetaCapiUserData();

        await sendMetaCapiEvent({
          eventName: "Purchase",
          eventId: metaEventId,
          eventSourceUrl: eventSourceUrl ?? undefined,
          userData,
          customData: {
            content_ids: toMetaContentIds(productIds),
            content_type: "product",
            value: Number(order.totalAmount),
            currency: order.currency || DEFAULT_CURRENCY,
            num_items: numItems,
            order_id: order.id,
          },
        });
      } catch (metaError) {
        console.error("Meta CAPI Purchase failed:", metaError);
      }
    } else {
      // The store's own CAPI (PLAN.md P7-05): only for an order of the store
      // this host serves, only after the visitor accepted tracking on it
      // (D19), and only after the response, so a slow or failing Meta call
      // never touches checkout.
      try {
        const scope = await getCartScope();
        const consent = (await cookies()).get(STORE_TRACKING_CONSENT_COOKIE)?.value;
        if (scope && order.storeId === scope.storeId && hasStoreTrackingConsent(consent)) {
          const purchase = {
            storeId: scope.storeId,
            order: { id: order.id, totalAmount: order.totalAmount, currency: order.currency },
            items: createdOrderItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          };
          after(async () => {
            const { sendStorePurchaseEvent } = await import("@/lib/meta/store-meta-capi.server");
            await sendStorePurchaseEvent(purchase);
          });
        }
      } catch {
        console.error("Store Meta CAPI scheduling failed");
      }
    }

    return {
      success: true,
      data: {
        order,
        orderItems: createdOrderItems,
        orderPagePath: buildOrderPagePath(order.id),
        metaEventId,
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
                description: richTextToPlainText(enTranslation?.description) || null,
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

const MANUAL_PAYMENT_METHODS = ["instapay", "vodafone_cash", "e_cash", "we_pay", "orange_cash"] as const;
/** A customer can replace the payment screenshot this many times per order. */
const MAX_PAYMENT_PROOF_UPLOADS = 5;

/**
 * "I've sent the payment" for a manual-transfer order, optionally with a
 * screenshot of the transfer (`proof`, ROADMAP.md F-21p). The shopper is the
 * order's owner (signed in or the guest cookie that placed it) or holds its
 * signed access link (`accessToken`). The file's type is read from its bytes
 * and it goes to the private bucket through the service role; the seller sees
 * it on the order in the dashboard. Payload: FormData { orderId, accessToken?, proof? }.
 */
export async function reportManualPaymentSent(formData: FormData) {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const accessToken = formData.get("accessToken");
    const proof = formData.get("proof");
    const hasAccessLink = typeof accessToken === "string" && accessToken ? verifyOrderAccess(orderId, accessToken) : false;
    const userId = hasAccessLink ? null : await getCurrentUserId();
    if (!hasAccessLink && !userId) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: hasAccessLink ? eq(orders.id, orderId) : and(eq(orders.id, orderId), eq(orders.userId, userId!)),
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

    const metadata = (order.metadata as Record<string, unknown> | null) ?? {};
    const now = new Date().toISOString();
    let paymentProof: { path: string; uploadedAt: string } | null = null;

    if (proof instanceof File && proof.size > 0) {
      const t = await getTranslations("checkout.transfer.proof");
      if (order.status === "cancelled" || order.paymentStatus === "paid" || order.paymentStatus === "collected") {
        return { success: false, error: t("closed") };
      }
      const uploads = Number(metadata.paymentProofUploads ?? 0);
      if (uploads >= MAX_PAYMENT_PROOF_UPLOADS) {
        return { success: false, error: t("tooMany") };
      }
      if (proof.size > PAYMENT_PROOF_MAX_BYTES) {
        return { success: false, error: t("tooLarge") };
      }
      const bytes = new Uint8Array(await proof.arrayBuffer());
      const type = sniffPaymentProofType(bytes);
      if (!type) {
        return { success: false, error: t("notImage") };
      }
      const path = buildPaymentProofPath(order.id, crypto.randomUUID(), type);
      const { error: uploadError } = await getServiceClient()
        .storage.from(PAYMENT_PROOF_BUCKET)
        .upload(path, bytes, { contentType: type, upsert: false });
      if (uploadError) {
        console.error("[payment-proof] upload failed", uploadError.message);
        return { success: false, error: t("uploadFailed") };
      }
      paymentProof = { path, uploadedAt: now };
    }

    await db
      .update(orders)
      .set({
        metadata: {
          ...metadata,
          paymentSelfReported: true,
          paymentSelfReportedAt: now,
          ...(paymentProof && {
            paymentProof,
            paymentProofUploads: Number(metadata.paymentProofUploads ?? 0) + 1,
          }),
        },
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    return {
      success: true,
      data: { orderPagePath: buildOrderPagePath(order.id) },
    };
  } catch (error) {
    console.error("Error reporting manual payment:", error);
    return { success: false, error: "Failed to update order" };
  }
}

const CANCELLABLE_STATUSES = ["pending", "payment_processing", "confirmed"] as const;

/**
 * Cancels an order that has not shipped yet. The shopper is its owner
 * (signed in, or the guest cookie that placed it), or holds the signed
 * access link of the order page (guest checkout, order emails).
 */
export async function cancelOrder(orderId: string, reason?: string, accessToken?: string) {
  try {
    const hasAccessLink = accessToken ? verifyOrderAccess(orderId, accessToken) : false;
    const userId = hasAccessLink ? null : await getCurrentUserId();
    if (!hasAccessLink && !userId) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: userId ? and(eq(orders.id, orderId), eq(orders.userId, userId)) : eq(orders.id, orderId),
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
    let walletRefundAmount = 0;

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
        stockResults = await restoreStock(tx, stockLines, { reason: "cancel", orderId, actorId: userId ?? order.userId });

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
              walletRefundAmount = refundAmount;
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

    // Cancellation mail to the customer and sellers, plus the wallet refund
    // receipt, after the response (best-effort; the backend sends each once).
    after(async () => {
      await sendOrderEventEmail(orderId, "cancelled", "customer");
      if (walletRefundAmount > 0) {
        await sendRefundIssuedEmail({ orderId, method: "wallet", amount: walletRefundAmount });
      }
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
