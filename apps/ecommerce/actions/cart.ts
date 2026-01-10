// apps/ecommerce/actions/cart.ts
"use server";

import {
  db,
  carts,
  cartItems,
  products,
  productVariants,
  eq,
  and,
  desc,
} from "@workspace/db";
import {
  getCurrentUserId,
  getOrCreateCurrentUserId,
} from "@/lib/get-current-user-id";

type ProductPrice = {
  base: number;
  list: number;
  final: number;
  discountType: string;
  discountValue: number;
};

/**
 * Get existing cart for current user (does not create user or cart)
 * Returns null if no cart exists
 */
async function getCart() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), eq(carts.status, "active")),
    });

    return cart || null;
  } catch (error) {
    console.error("getCart: Unexpected error:", error);
    return null;
  }
}

/**
 * Ensure cart exists for current user (creates user and cart if needed)
 * Use this when user interaction requires a cart (e.g., adding items)
 */
async function ensureCart() {
  try {
    const userId = await getOrCreateCurrentUserId();
    if (!userId) {
      console.error(
        "ensureCart: Failed to get or create current user ID (authenticated or guest)"
      );
      return null;
    }

    // Try to find cart, or insert if none
    // Prevent multiple active carts per user
    let cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), eq(carts.status, "active")),
    });

    if (!cart) {
      try {
        const [newCart] = await db
          .insert(carts)
          .values({ userId, status: "active", currency: "EGP" })
          .returning();

        if (!newCart) {
          console.error(
            "ensureCart: Failed to create new cart for user",
            userId
          );
          return null;
        }

        cart = newCart;
      } catch (insertError) {
        console.error("ensureCart: Error inserting cart:", insertError);
        // If insert failed, try to get cart again (race condition)
        cart = await db.query.carts.findFirst({
          where: and(eq(carts.userId, userId), eq(carts.status, "active")),
        });

        if (!cart) {
          console.error("ensureCart: Cart still not found after insert retry");
          return null;
        }
      }
    }

    return cart;
  } catch (error) {
    console.error("ensureCart: Unexpected error:", error);
    return null;
  }
}

export const getCartItems = async () => {
  // Use getCart() instead of ensureCart() to avoid creating users on page load
  const cart = await getCart();
  if (!cart)
    return {
      success: true,
      data: { cart: null, items: [], subtotal: 0, itemCount: 0 },
    };

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cart.id),
    with: { product: true },
    orderBy: [desc(cartItems.createdAt)],
  });

  // Fix prices for items that have incorrect prices (0.00)
  const itemsWithFixedPrices = items.map((item) => {
    const productPrice = item.product?.price as ProductPrice | undefined;
    if (Number(item.price) === 0 && productPrice?.final) {
      return {
        ...item,
        price: Number(productPrice.final).toString(),
      };
    }
    return item;
  });

  const subtotal = itemsWithFixedPrices.reduce(
    (sum, i) => sum + Number(i.price) * i.quantity,
    0
  );
  const itemCount = itemsWithFixedPrices.reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  return {
    success: true,
    data: { cart, items: itemsWithFixedPrices, subtotal, itemCount },
  };
};

export async function addToCart(
  productIdOrData:
    | string
    | { productId: string; quantity?: number; variantId?: string },
  quantity = 1,
  variantId?: string
) {
  // Handle both call signatures: addToCart(productId, quantity, variantId) or addToCart({ productId, quantity, variantId })
  let productId: string;
  let qty: number;
  let varId: string | undefined;

  if (typeof productIdOrData === "string") {
    productId = productIdOrData;
    qty = quantity;
    varId = variantId;
  } else {
    productId = productIdOrData.productId;
    qty = productIdOrData.quantity ?? 1;
    varId = productIdOrData.variantId;
  }

  const cart = await ensureCart();
  if (!cart) {
    // Try to get more details about why cart creation failed
    const userId = await getCurrentUserId();
    console.log("userId", userId);
    if (!userId) {
      return {
        success: false,
        error:
          "Unable to create or retrieve user. Please ensure you're logged in or refresh the page.",
      };
    }
    return {
      success: false,
      error: "No cart found. Please try again or refresh the page.",
    };
  }

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.isActive, true)),
  });
  if (!product) return { success: false, error: "Product not found" };

  // Fetch variant if variantId is provided
  let variant = null;
  let variantData = null;
  if (varId) {
    variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.id, varId),
        eq(productVariants.productId, productId)
      ),
    });

    if (!variant) {
      return { success: false, error: "Variant not found" };
    }

    // Check variant stock
    if (Number(variant.stock ?? 0) < qty) {
      return {
        success: false,
        error: "Insufficient stock for selected variant",
      };
    }

    // Store variant data in JSONB format
    variantData = {
      id: variant.id,
      title: variant.title,
      price: variant.price,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3,
      sku: variant.sku,
      imageUrl: variant.imageUrl,
    };
  } else {
    // Check product stock if no variant
    if (Number(product.quantity) < qty) {
      return { success: false, error: "Insufficient stock" };
    }
  }

  // Determine price - use variant price if available, otherwise product price
  const price = variant
    ? Number(variant.price ?? 0)
    : Number((product.price as ProductPrice)?.final) || 0;

  // Check for existing cart item - fetch all items with same productId and filter by variant
  const allItems = await db.query.cartItems.findMany({
    where: and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, productId)
    ),
  });

  // Find matching item - match by variant ID if variantId is provided, otherwise match items without variants
  const existing = allItems.find((item) => {
    if (varId) {
      // Match items with the same variant ID
      return (item.variant as any)?.id === varId;
    } else {
      // Match items without a variant (base product)
      return !item.variant;
    }
  });

  const result = existing
    ? await db
        .update(cartItems)
        .set({
          quantity: existing.quantity + qty,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(cartItems.id, existing.id))
        .returning()
    : await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          sellerId: product.sellerId,
          quantity: qty,
          price,
          variant: variantData,
        } as any)
        .returning();

  return {
    success: true,
    data: result[0],
    message: existing ? "Cart updated" : "Added to cart",
  };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

  const item = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)),
    with: { product: true },
  });
  if (!item) return { success: false, error: "Item not found" };

  if (Number(item.product.quantity) < quantity)
    return { success: false, error: "Insufficient stock" };
  if (quantity <= 0) return removeFromCart(itemId);

  const [updated] = await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date().toISOString() })
    .where(eq(cartItems.id, itemId))
    .returning();

  return { success: true, data: updated };
}

export async function removeFromCart(itemId: string) {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

  await db.delete(cartItems).where(eq(cartItems.id, itemId));

  return { success: true, message: "Item removed" };
}

export async function clearCart() {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

  return { success: true, message: "Cart cleared" };
}
