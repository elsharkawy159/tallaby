// apps/ecommerce/actions/cart.ts
"use server";

import { db, carts, cartItems, products, eq, and, desc } from "@workspace/db";
import { getUser } from "./auth";

async function ensureCart() {
  const user = await getUser();
  if (!user) return null;

  // Try to find cart, or insert if none
  let cart = await db.query.carts.findFirst({
    where: and(eq(carts.userId, user.user.id), eq(carts.status, "active")),
  });

  if (!cart) {
    [cart] = await db
      .insert(carts)
      .values({ userId: user.user.id, status: "active", currency: "EGP" })
      .returning();
  }

  return cart;
}

export async function getCartItems() {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cart.id),
    with: { product: true },
    orderBy: [desc(cartItems.createdAt)],
  });

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.price) * i.quantity,
    0
  );
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { success: true, data: { cart, items, subtotal, itemCount } };
}

export async function addToCart(productId: string, quantity = 1) {
  const cart = await ensureCart();
  if (!cart) return { success: false, error: "No cart found" };

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
          price: Number(product.price) || 0,
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
