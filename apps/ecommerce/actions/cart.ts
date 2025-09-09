// apps/ecommerce/actions/cart.ts
"use server";

import { db, carts, cartItems, products, productVariants } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUser, getSessionId } from "./auth";
import { revalidatePath } from "next/cache";

export async function getOrCreateCart() {
  try {
    const user = await getUser();
    const sessionId = await getSessionId();

    if (!user && !sessionId) {
      return { success: false, error: "Unable to identify user session" };
    }

    // Try to find existing cart
    let cart;
    if (user) {
      cart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, user.user.id), eq(carts.status, "active")),
      });
    } else {
      cart = await db.query.carts.findFirst({
        where: and(eq(carts.sessionId, sessionId), eq(carts.status, "active")),
      });
    }

    // Create new cart if none exists
    if (!cart) {
      const newCart = await db
        .insert(carts)
        .values({
          userId: user?.user.id || crypto.randomUUID(), // Use temp ID for anonymous
          sessionId: !user ? sessionId : null,
          status: "active",
          currency: "EGP",
        })
        .returning();

      cart = newCart[0];
    }

    return { success: true, data: cart };
  } catch (error) {
    console.error("Error getting/creating cart:", error);
    return { success: false, error: "Failed to get cart" };
  }
}

export async function getCartItems() {
  try {
    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: "No cart found" };
    }

    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cartResult.data.id),
      with: {
        product: {
          with: {
            brand: true,
            seller: {
              columns: {
                displayName: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [desc(cartItems.createdAt)],
    });

    // Calculate totals
    const subtotal = items
      .filter((item) => !item.savedForLater)
      .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    const itemCount = items
      .filter((item) => !item.savedForLater)
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      success: true,
      data: {
        cart: cartResult.data,
        items,
        subtotal,
        itemCount,
      },
    };
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return { success: false, error: "Failed to fetch cart items" };
  }
}

export async function addToCart(data: {
  productId: string;
  quantity?: number;
  variantId?: string;
  variant?: any;
}) {
  try {
    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: "Failed to get cart" };
    }

    // Fetch product details
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, data.productId), eq(products.isActive, true)),
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Check stock
    if (Number(product.quantity) < (data.quantity || 1)) {
      return { success: false, error: "Insufficient stock" };
    }

    // Get price (from variant if specified, otherwise from product)
    let price = (product.price as any)?.final;
    if (data.variantId) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, data.variantId),
      });
      if (variant?.price) {
        price = variant.price;
      }
    }

    // Check if item already in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cartResult.data.id),
        eq(cartItems.productId, data.productId),
        eq(cartItems.savedForLater, false)
      ),
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + (data.quantity || 1);

      // Check max order quantity
      if (product.maxOrderQuantity && newQuantity > product.maxOrderQuantity) {
        return {
          success: false,
          error: `Maximum order quantity is ${product.maxOrderQuantity}`,
        };
      }

      const updated = await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          variant: data.variant,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();

      const result = {
        success: true,
        data: updated[0],
        message: "Cart updated",
      } as const;
      revalidatePath("/cart");
      return result;
    } else {
      // Add new item
      const newItem = await db
        .insert(cartItems)
        .values({
          cartId: cartResult.data.id,
          productId: data.productId,
          sellerId: product.sellerId,
          quantity: data.quantity || 1,
          price: price.toString(),
          variant: data.variant,
        })
        .returning();

      // Update cart last activity
      await db
        .update(carts)
        .set({
          lastActivity: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(carts.id, cartResult.data.id));

      const result = {
        success: true,
        data: newItem[0],
        message: "Added to cart",
      } as const;
      revalidatePath("/cart");
      return result;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}

export async function updateCartItem(itemId: string, quantity: number) {
  try {
    const user = await getUser();
    const cartResult = await getOrCreateCart();

    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: "No cart found" };
    }

    // Verify item belongs to user's cart
    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, cartResult.data.id)
      ),
      with: {
        product: true,
      },
    });

    if (!item) {
      return { success: false, error: "Item not found in cart" };
    }

    // Check stock
    if (Number(item.product.quantity) < quantity) {
      return { success: false, error: "Insufficient stock" };
    }

    // Check max order quantity
    if (
      item.product.maxOrderQuantity &&
      quantity > item.product.maxOrderQuantity
    ) {
      return {
        success: false,
        error: `Maximum order quantity is ${item.product.maxOrderQuantity}`,
      };
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return removeFromCart(itemId);
    }

    const updated = await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(cartItems.id, itemId))
      .returning();
    const result = { success: true, data: updated[0] } as const;
    revalidatePath("/cart");
    return result;
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { success: false, error: "Failed to update cart item" };
  }
}

export async function removeFromCart(itemId: string) {
  try {
    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: "No cart found" };
    }

    // Verify item belongs to user's cart
    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, cartResult.data.id)
      ),
    });

    if (!item) {
      return { success: false, error: "Item not found in cart" };
    }

    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    revalidatePath("/cart");
    return { success: true, message: "Item removed from cart" } as const;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { success: false, error: "Failed to remove from cart" };
  }
}

export async function toggleSaveForLater(itemId: string) {
  try {
    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: "No cart found" };
    }

    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, cartResult.data.id)
      ),
    });

    if (!item) {
      return { success: false, error: "Item not found in cart" };
    }

    const updated = await db
      .update(cartItems)
      .set({
        savedForLater: !item.savedForLater,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(cartItems.id, itemId))
      .returning();

    const result = {
      success: true,
      data: updated[0],
      message: updated[0]?.savedForLater ? "Saved for later" : "Moved to cart",
    } as const;
    revalidatePath("/cart");
    return result;
  } catch (error) {
    console.error("Error toggling save for later:", error);
    return { success: false, error: "Failed to update item" };
  }
}

export async function clearCart() {
  try {
    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: "No cart found" };
    }

    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartResult.data.id),
          eq(cartItems.savedForLater, false)
        )
      );

    revalidatePath("/cart");
    return { success: true, message: "Cart cleared" } as const;
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false, error: "Failed to clear cart" };
  }
}

export async function mergeAnonymousCart(anonymousSessionId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Find anonymous cart
    const anonymousCart = await db.query.carts.findFirst({
      where: and(
        eq(carts.sessionId, anonymousSessionId),
        eq(carts.status, "active")
      ),
      with: {
        cartItems: true,
      },
    });

    if (!anonymousCart || anonymousCart.cartItems.length === 0) {
      return { success: true, message: "No items to merge" };
    }

    // Get or create user's cart
    const userCartResult = await getOrCreateCart();
    if (!userCartResult.success || !userCartResult.data) {
      return { success: false, error: "Failed to get user cart" };
    }

    // Move items from anonymous cart to user cart
    for (const item of anonymousCart.cartItems) {
      await addToCart({
        productId: item.productId,
        quantity: item.quantity,
        variant: item.variant,
      });
    }

    // Mark anonymous cart as merged
    await db
      .update(carts)
      .set({
        status: "merged",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(carts.id, anonymousCart.id));

    return { success: true, message: "Cart merged successfully" };
  } catch (error) {
    console.error("Error merging cart:", error);
    return { success: false, error: "Failed to merge cart" };
  }
}

export async function getCartSummary() {
  try {
    const cartData = await getCartItems();
    if (!cartData.success || !cartData.data) {
      return { success: false, error: "Failed to get cart" };
    }

    const activeItems = cartData.data.items.filter(
      (item) => !item.savedForLater
    );
    const savedItems = cartData.data.items.filter((item) => item.savedForLater);

    // Group by seller for shipping calculation
    const itemsBySeller = activeItems.reduce(
      (acc, item) => {
        const sellerId = item.product.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      },
      {} as Record<string, typeof activeItems>
    );

    return {
      success: true,
      data: {
        activeItems,
        savedItems,
        itemsBySeller,
        subtotal: cartData.data.subtotal,
        itemCount: cartData.data.itemCount,
      },
    };
  } catch (error) {
    console.error("Error getting cart summary:", error);
    return { success: false, error: "Failed to get cart summary" };
  }
}
