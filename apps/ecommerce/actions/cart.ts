// apps/ecommerce/actions/cart.ts
"use server";

import { db, carts, cartItems, products, eq, and, desc } from "@workspace/db";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { revalidatePath } from "next/cache";

type ProductPrice = {
  base: number;
  list: number;
  final: number;
  discountType: string;
  discountValue: number;
};

async function ensureCart() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error(
        "ensureCart: Failed to get current user ID (authenticated or guest)"
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

export async function getCartItems() {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

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
}

export async function addToCart(productId: string, quantity = 1) {
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
  if (Number(product.quantity) < quantity)
    return { success: false, error: "Insufficient stock" };

  const existing = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, productId)
    ),
  });

  const result = existing
    ? await db
        .update(cartItems)
        .set({
          quantity: existing.quantity + quantity,
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
          quantity,
          price: Number((product.price as ProductPrice)?.final) || 0,
        } as any)
        .returning();

  // Revalidate cart page to reflect changes
  revalidatePath("/cart");
  revalidatePath("/cart/checkout");

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

  // Revalidate cart page to reflect changes
  revalidatePath("/cart");
  revalidatePath("/cart/checkout");

  return { success: true, data: updated };
}

export async function removeFromCart(itemId: string) {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  // Revalidate cart page to reflect changes
  revalidatePath("/cart");
  revalidatePath("/cart/checkout");
  return { success: true, message: "Item removed" };
}

export async function clearCart() {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  // Revalidate cart page to reflect changes
  revalidatePath("/cart");
  revalidatePath("/cart/checkout");
  return { success: true, message: "Cart cleared" };
}
