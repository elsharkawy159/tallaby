"use server";

import { db } from "@workspace/db";
import {
  carts,
  cartItems,
  userAddresses,
  paymentMethods,
  eq,
  and,
  desc,
} from "@workspace/db";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { validateCoupon } from "./coupons";
import { calculateOrderShippingCost } from "@/lib/shipping";
import type { CheckoutSummary } from "@/lib/coupon-utils";

const cartWithShippingItems = {
  cartItems: {
    where: eq(cartItems.savedForLater, false),
    with: {
      product: {
        columns: {
          id: true,
          title: true,
          sellerId: true,
          productType: true,
          freeDelivery: true,
          dimensions: true,
        },
        with: {
          seller: {
            columns: {
              displayName: true,
              shippingPolicy: true,
              returnPolicy: true,
              freeDelivery: true,
            },
          },
        },
      },
    },
  },
} as const;

async function getDestinationState(
  userId: string,
  shippingAddressId?: string,
): Promise<string | null> {
  if (!shippingAddressId) {
    return null;
  }

  const address = await db.query.userAddresses.findFirst({
    where: and(
      eq(userAddresses.id, shippingAddressId),
      eq(userAddresses.userId, userId),
    ),
    columns: { state: true },
  });

  return address?.state ?? null;
}

function buildBaseSummary(
  cartItems: Array<{ quantity: number; price: string | number }>,
  shippingCost: number | null,
) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const tax = 0;
  const billedShipping = shippingCost ?? 0;
  const total = subtotal + tax + billedShipping;

  return {
    subtotal,
    tax,
    shippingCost,
    total,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function recalculateCheckoutSummary(data: {
  shippingAddressId?: string;
  couponCode?: string;
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unable to get user ID" };
    }

    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), eq(carts.status, "active")),
      with: cartWithShippingItems,
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const destinationState = await getDestinationState(
      userId,
      data.shippingAddressId,
    );

    const shippingCost = calculateOrderShippingCost(cart.cartItems, {
      destinationState,
    });

    const baseSummary = buildBaseSummary(cart.cartItems, shippingCost);

    if (data.couponCode?.trim()) {
      const couponValidation = await validateCoupon(data.couponCode, cart, {
        shippingAddressId: data.shippingAddressId,
      });

      if (couponValidation.success && couponValidation.data?.summary) {
        return {
          success: true,
          data: { summary: couponValidation.data.summary },
        };
      }
    }

    const summary: CheckoutSummary = {
      ...baseSummary,
      discountAmount: 0,
      shippingDiscount: 0,
      totalAfterDiscount: baseSummary.total,
      appliedCoupon: null,
    };

    return { success: true, data: { summary } };
  } catch (error) {
    console.error("Error recalculating checkout summary:", error);
    return { success: false, error: "Failed to recalculate checkout summary" };
  }
}

export async function getCheckoutData() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unable to get user ID" };
    }

    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), eq(carts.status, "active")),
      with: cartWithShippingItems,
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, userId),
      orderBy: [desc(userAddresses.isDefault)],
    });

    const paymentMethodsList = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.userId, userId),
      orderBy: [desc(paymentMethods.isDefault)],
    });

    const itemsBySeller = cart.cartItems.reduce(
      (acc, item) => {
        const sellerId = item.product.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = {
            seller: item.product.seller,
            items: [],
            subtotal: 0,
          };
        }
        acc[sellerId].items.push(item);
        acc[sellerId].subtotal += Number(item.price) * item.quantity;
        return acc;
      },
      {} as Record<string, any>,
    );

    const defaultAddress =
      addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

    const shippingCost = calculateOrderShippingCost(cart.cartItems, {
      destinationState: defaultAddress?.state,
    });

    const summary = buildBaseSummary(cart.cartItems, shippingCost);

    return {
      success: true,
      data: {
        cart,
        addresses,
        paymentMethods: paymentMethodsList,
        itemsBySeller,
        summary,
      },
    };
  } catch (error) {
    console.error("Error getting checkout data:", error);
    return { success: false, error: "Failed to get checkout data" };
  }
}

export async function validateCheckout(data: {
  cartId: string;
  shippingAddressId: string;
  paymentMethodId?: string;
  couponCode?: string;
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unable to get user ID" };
    }

    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.id, data.cartId),
        eq(carts.userId, userId),
        eq(carts.status, "active"),
      ),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
          with: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Invalid cart" };
    }

    const address = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, data.shippingAddressId),
        eq(userAddresses.userId, userId),
      ),
    });

    if (!address) {
      return { success: false, error: "Invalid shipping address" };
    }

    if (data.paymentMethodId) {
      const paymentMethod = await db.query.paymentMethods.findFirst({
        where: and(
          eq(paymentMethods.id, data.paymentMethodId),
          eq(paymentMethods.userId, userId),
        ),
      });

      if (!paymentMethod) {
        return { success: false, error: "Invalid payment method" };
      }
    }

    const unavailableItems = [];
    for (const item of cart.cartItems) {
      if (Number(item.product.quantity) < item.quantity) {
        unavailableItems.push({
          product: item.product.sku ?? item.productId,
          available: item.product.quantity,
          requested: item.quantity,
        });
      }
    }

    if (unavailableItems.length > 0) {
      return {
        success: false,
        error: "Some items are no longer available",
        unavailableItems,
      };
    }

    let discount = null;
    if (data.couponCode) {
      const couponValidation = await validateCoupon(data.couponCode, cart, {
        shippingAddressId: data.shippingAddressId,
      });
      if (!couponValidation.success) {
        return couponValidation;
      }
      discount = couponValidation.data;
    }

    return {
      success: true,
      data: {
        cart,
        address,
        discount,
      },
    };
  } catch (error) {
    console.error("Error validating checkout:", error);
    return { success: false, error: "Failed to validate checkout" };
  }
}
