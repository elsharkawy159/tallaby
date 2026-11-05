"use server";

import { db } from "@workspace/db";
import {
  carts,
  cartItems,
  userAddresses,
  users,
  paymentMethods,
  eq,
  and,
  desc,
} from "@workspace/db";
import { getLocale } from "next-intl/server";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import {
  activeCartWhere,
  getCartScope,
  getStoreCurrencyLabel,
  getStorefrontCheckoutPayments,
} from "@/lib/storefront.server";
import {
  mergeProductWithTranslation,
  pickTranslationFromArray,
  type ProductLocale,
} from "@/lib/product-translations";
import { validateCoupon } from "./coupons";
import { isOnlineCardPaymentEnabled } from "@workspace/lib/payments";
import { ONLINE_CARD_PAYMENT_ENABLED } from "@/lib/constants";
import { getCheckoutShipping } from "@/lib/shipping.server";
import { getStorefrontShippingContext } from "@workspace/lib/stores/server";
import { checkoutCountries, isAddressInCountries } from "@workspace/lib/shipping/store-quote";
import { getStorefrontCheckoutForm, getStorefrontMinOrder } from "@/lib/storefront-checkout-form.server";
import {
  buildSummaryWithCoupon,
  type CheckoutStoreShipping,
  type CheckoutSummary,
} from "@/lib/coupon-utils";
import { removeInvalidCartGifts, storeCartDiscounts } from "@workspace/lib/orders/line-discounts/server";
import type { OrderDiscountLine } from "@workspace/lib/orders";
import type { ShippingAddress } from "@workspace/lib/shipping/store-quote";
import { getUserWalletSummary } from "@workspace/db/wallet";
import { getPendingCouponCode } from "@/lib/affiliate-coupon-cookie";
import { getOrderEmailField } from "@workspace/lib/orders/notification-email/server";
import { visibleCheckoutFields } from "@workspace/lib/stores/checkout-form";

const cartWithShippingItems = {
  cartItems: {
    where: eq(cartItems.savedForLater, false),
    with: {
      product: {
        columns: {
          id: true,
          sellerId: true,
          productType: true,
          freeDelivery: true,
          dimensions: true,
          minOrderQuantity: true,
        },
        with: {
          productTranslations: {
            columns: {
              locale: true,
              title: true,
              slug: true,
            },
          },
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

function localizeCartItems<
  T extends {
    product: Record<string, unknown> & {
      productTranslations?: Array<{
        locale: string
        title: string
        slug?: string | null
      }>
    }
  },
>(items: T[], locale: ProductLocale): T[] {
  return items.map((item) => {
    const product = item.product
    if (!product) return item

    const translation = pickTranslationFromArray(
      product.productTranslations ?? [],
      locale,
    )
    const mergedProduct = mergeProductWithTranslation(product, translation)
    const { productTranslations: _translations, ...localizedProduct } =
      mergedProduct

    return {
      ...item,
      product: localizedProduct as unknown as T["product"],
    }
  })
}

/** The customer's own address fields shipping is priced on, or null. */
async function getShippingAddress(
  userId: string,
  shippingAddressId?: string,
): Promise<ShippingAddress | null> {
  if (!shippingAddressId) {
    return null;
  }

  const address = await db.query.userAddresses.findFirst({
    where: and(
      eq(userAddresses.id, shippingAddressId),
      eq(userAddresses.userId, userId),
    ),
    columns: { state: true, city: true, country: true, addressLine1: true },
  });

  return address ?? null;
}

function buildBaseSummary(
  cartItems: Array<{ quantity: number; price: string | number }>,
  shippingCost: number | null,
  sellerFreeDeliveryDiscount = 0,
  storeShipping: CheckoutStoreShipping = null,
  lineOffers: OrderDiscountLine[] = [],
): CheckoutSummary {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const tax = 0;
  const billedShipping = shippingCost ?? 0;
  const total = subtotal + tax + billedShipping;

  return buildSummaryWithCoupon(
    {
      subtotal,
      tax,
      shippingCost,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      sellerFreeDeliveryDiscount,
      storeShipping,
      lineOffers,
    },
    null,
    null,
  );
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

    const scope = await getCartScope();
    const cart = await db.query.carts.findFirst({
      where: activeCartWhere(userId, scope),
      with: cartWithShippingItems,
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const address = await getShippingAddress(userId, data.shippingAddressId);
    const { shippingCost, sellerFreeDeliveryDiscount, storeShipping } =
      await getCheckoutShipping(cart.cartItems, address, scope);

    const offers = await storeCartDiscounts(cart.storeId, cart.cartItems);
    const baseSummary = buildBaseSummary(
      cart.cartItems,
      shippingCost,
      sellerFreeDeliveryDiscount,
      storeShipping,
      offers.discountLines,
    );

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

    return { success: true, data: { summary: baseSummary } };
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

    const scope = await getCartScope();
    // A free gift that no longer qualifies is gone before anything is shown.
    const current = await db.query.carts.findFirst({ where: activeCartWhere(userId, scope) });
    if (current) await removeInvalidCartGifts(current);
    const cart = await db.query.carts.findFirst({
      where: activeCartWhere(userId, scope),
      with: cartWithShippingItems,
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // The seller changed the store's currency since this cart was made.
    if (scope && cart.currency !== scope.currency) {
      await db.update(carts).set({ currency: scope.currency }).where(eq(carts.id, cart.id));
    }

    const locale = (await getLocale()) as ProductLocale;
    const localizedCartItems = localizeCartItems(cart.cartItems, locale);
    const localizedCart = { ...cart, currency: scope?.currency ?? cart.currency, cartItems: localizedCartItems };

    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, userId),
      orderBy: [desc(userAddresses.isDefault)],
    });

    // Fills an empty checkout form (F-64). Never the guest's placeholder email.
    const customer = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { fullName: true, phone: true },
    });

    const paymentMethodsList = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.userId, userId),
      orderBy: [desc(paymentMethods.isDefault)],
    });

    const itemsBySeller = localizedCartItems.reduce(
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

    // A store selling abroad offers its countries; an address elsewhere doesn't apply.
    const shippingContext = scope ? await getStorefrontShippingContext(scope.storeId) : null;
    const addressCountries = shippingContext ? checkoutCountries(shippingContext.currency, shippingContext.zones) : null;
    const usableAddresses = addressCountries
      ? addresses.filter((address) => isAddressInCountries(address, addressCountries.options))
      : addresses;
    const defaultAddress =
      usableAddresses.find((address) => address.isDefault) ?? usableAddresses[0] ?? null;

    const { shippingCost, sellerFreeDeliveryDiscount, storeShipping } =
      await getCheckoutShipping(localizedCartItems, defaultAddress, scope);

    const offers = await storeCartDiscounts(cart.storeId, cart.cartItems);
    let summary = buildBaseSummary(
      localizedCartItems,
      shippingCost,
      sellerFreeDeliveryDiscount,
      storeShipping,
      offers.discountLines,
    );

    // Auto-apply a pending coupon captured from `?coupon=` (affiliate share)
    // or a prior explicit apply. Server validation remains authoritative —
    // an invalid/ineligible code simply leaves the base summary unchanged.
    const pendingCouponCode = await getPendingCouponCode();
    if (pendingCouponCode) {
      try {
        const couponValidation = await validateCoupon(
          pendingCouponCode,
          cart,
          { shippingAddressId: defaultAddress?.id },
        );
        if (couponValidation.success && couponValidation.data?.summary) {
          summary = couponValidation.data.summary;
        }
      } catch (error) {
        console.error("Pending coupon auto-apply failed:", error);
      }
    }

    // On a storefront only the store's enabled methods are offered; card and
    // the customer wallet are not store options (Store settings › Payment methods).
    const storePayments = await getStorefrontCheckoutPayments();
    const walletSummary = storePayments
      ? null
      : await getUserWalletSummary(db, userId);
    // Store websites: which extra fields the checkout shows (F-25a).
    const storeCheckoutForm = storePayments ? await getStorefrontCheckoutForm() : null;
    // Store websites: the store's minimum order (F-13b); createOrder checks it again.
    const storeMinOrder = storePayments ? await getStorefrontMinOrder() : null;
    // Store websites on Order notifications: an optional email (F-64), unless the
    // store's own checkout form already asks for one.
    const emailField = storePayments && scope ? await getOrderEmailField(userId, scope.storeId) : null;
    const formAsksEmail = storeCheckoutForm ? visibleCheckoutFields(storeCheckoutForm).some((f) => f.key === "email") : false;

    return {
      success: true,
      data: {
        cart: localizedCart,
        addresses,
        customer: customer ?? null,
        paymentMethods: paymentMethodsList,
        itemsBySeller,
        summary,
        // Lines outside a product's minimum (0151): their cross-sell offer applies.
        crossSellLineIds: offers.crossSellIndexes.flatMap((index) => cart.cartItems[index]?.id ?? []),
        pendingCouponCode,
        walletAvailableBalance: walletSummary?.availableBalance ?? null,
        walletCurrency: walletSummary?.currency ?? null,
        // Storefronts: card only through the seller's own gateway (F-39).
        onlineCardPaymentEnabled: storePayments
          ? storePayments.methods.includes("online_payment")
          : ONLINE_CARD_PAYMENT_ENABLED && isOnlineCardPaymentEnabled(),
        // The gateway's integration id stays on the server.
        storePayments: storePayments
          ? { ...storePayments, gateway: null }
          : null,
        storeCheckoutForm,
        storeMinOrder,
        addressCountries,
        currency: scope?.currency ?? "EGP",
        currencyLabel: scope ? (await getStoreCurrencyLabel(scope.storeId)) : "EGP",
        orderEmail: emailField?.show && !formAsksEmail ? { lastEmail: emailField.lastEmail } : null,
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
      if (item.product.trackStock !== false && Number(item.product.quantity) < item.quantity) {
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
