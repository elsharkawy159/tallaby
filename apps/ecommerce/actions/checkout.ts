"use server";

import { db } from "@workspace/db";
import {
  carts,
  cartItems,
  userAddresses,
  paymentMethods,
  eq,
  and,
  sql,
  gte,
  lte,
  desc,
} from "@workspace/db";
import { getUser } from "./auth";
import { validateCoupon } from "./coupons";
import { roundPrice } from "@workspace/lib/src/utils/formatPrice";

export async function getCheckoutData() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get active cart
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, user.user.id), eq(carts.status, "active")),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
          with: {
            product: {
              with: {
                seller: {
                  columns: {
                    displayName: true,
                    shippingPolicy: true,
                    returnPolicy: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Get user addresses
    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, user.user.id),
      orderBy: [desc(userAddresses.isDefault)],
    });

    // Get payment methods
    const paymentMethodsList = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.userId, user.user.id),
      orderBy: [desc(paymentMethods.isDefault)],
    });

    // Calculate totals by seller for shipping
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
        acc[sellerId].subtotal += roundPrice(Number(item.price) * item.quantity);
        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate totals
    const subtotal = cart.cartItems.reduce(
      (sum, item) => sum + roundPrice(Number(item.price) * item.quantity),
      0
    );

    const tax = 0;
    const shippingCost = Object.keys(itemsBySeller).length * 25; // Flat rate per seller
    const total = subtotal + tax + shippingCost;

    return {
      success: true,
      data: {
        cart,
        addresses,
        paymentMethods: paymentMethodsList,
        itemsBySeller,
        user: user.user,
        summary: {
          subtotal,
          tax,
          shippingCost,
          total,
          itemCount: cart.cartItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
        },
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
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Validate cart
    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.id, data.cartId),
        eq(carts.userId, user.user.id),
        eq(carts.status, "active")
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

    // Validate address
    const address = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, data.shippingAddressId),
        eq(userAddresses.userId, user.user.id)
      ),
    });

    if (!address) {
      return { success: false, error: "Invalid shipping address" };
    }

    // Validate payment method if provided
    if (data.paymentMethodId) {
      const paymentMethod = await db.query.paymentMethods.findFirst({
        where: and(
          eq(paymentMethods.id, data.paymentMethodId),
          eq(paymentMethods.userId, user.user.id)
        ),
      });

      if (!paymentMethod) {
        return { success: false, error: "Invalid payment method" };
      }
    }

    // Check product availability
    const unavailableItems = [];
    for (const item of cart.cartItems) {
      if (Number(item.product.quantity) < item.quantity) {
        unavailableItems.push({
          product: item.product.title,
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

    // Validate coupon if provided
    let discount = null;
    if (data.couponCode) {
      const couponValidation = await validateCoupon(data.couponCode, cart);
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

export async function calculateShipping(data: {
  addressId: string;
  cartId: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get address
    const address = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, data.addressId),
        eq(userAddresses.userId, user.user.id)
      ),
    });

    if (!address) {
      return { success: false, error: "Address not found" };
    }

    // Get cart items grouped by seller
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, data.cartId), eq(carts.userId, user.user.id)),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
          with: {
            product: {
              with: {
                seller: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    // Calculate shipping cost by seller
    const shippingOptions = [];
    const itemsBySeller = cart.cartItems.reduce(
      (acc, item) => {
        const sellerId = item.product.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = {
            seller: item.product.seller,
            items: [],
          };
        }
        acc[sellerId].items.push(item);
        return acc;
      },
      {} as Record<string, any>
    );

    for (const [sellerId, data] of Object.entries(itemsBySeller)) {
      // Calculate weight and dimensions
      let totalWeight = 0;
      let totalItems = 0;

      for (const item of data.items) {
        totalItems += item.quantity;
        // Add weight calculation if available
      }

      // Shipping options per seller
      const options = [
        {
          sellerId,
          sellerName: data.seller.displayName,
          method: "standard",
          name: "Standard Shipping",
          cost: 25,
          estimatedDays: "5-7 business days",
        },
        {
          sellerId,
          sellerName: data.seller.displayName,
          method: "express",
          name: "Express Shipping",
          cost: 50,
          estimatedDays: "2-3 business days",
        },
        {
          sellerId,
          sellerName: data.seller.displayName,
          method: "overnight",
          name: "Overnight Shipping",
          cost: 100,
          estimatedDays: "1 business day",
        },
      ];

      shippingOptions.push(...options);
    }

    return { success: true, data: shippingOptions };
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return { success: false, error: "Failed to calculate shipping" };
  }
}
