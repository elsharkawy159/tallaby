/**
 * Account Merge Logic
 * 
 * When a guest user logs in, merge their guest account data
 * (cart, orders, addresses) into their authenticated account.
 */

"use server";

import { db, users, carts, cartItems, orders, userAddresses, eq, and } from "@workspace/db";
import { getUser } from "./auth";
import { getGuestUID, clearGuestUID } from "@/lib/guest-user";

/**
 * Merge guest account data into authenticated account
 * Called after user successfully logs in
 */
export async function mergeGuestAccount(): Promise<{
  success: boolean;
  error?: string;
  merged?: {
    cartItems: number;
    orders: number;
    addresses: number;
  };
}> {
  try {
    const authUser = await getUser();
    if (!authUser?.user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    const authenticatedUserId = authUser.user.id;

    // Get guest UID from cookie
    const guestUID = await getGuestUID();
    if (!guestUID) {
      // No guest account to merge
      return { success: true, merged: { cartItems: 0, orders: 0, addresses: 0 } };
    }

    // Find guest user by email pattern
    const guestEmail = `guest_${guestUID}@temp.local`;
    const guestUser = await db.query.users.findFirst({
      where: and(eq(users.email, guestEmail), eq(users.isGuest, true)),
    });

    if (!guestUser) {
      // Guest user doesn't exist, clear cookie and return
      await clearGuestUID();
      return { success: true, merged: { cartItems: 0, orders: 0, addresses: 0 } };
    }

    const guestUserId = guestUser.id;
    let mergedCartItems = 0;
    let mergedOrders = 0;
    let mergedAddresses = 0;

    // 1. Merge cart items
    const guestCart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, guestUserId), eq(carts.status, "active")),
      with: {
        cartItems: true,
      },
    });

    if (guestCart && guestCart.cartItems.length > 0) {
      // Get or create authenticated user's cart
      let authCart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, authenticatedUserId), eq(carts.status, "active")),
      });

      if (!authCart) {
        [authCart] = await db
          .insert(carts)
          .values({
            userId: authenticatedUserId,
            status: "active",
            currency: guestCart.currency || "EGP",
          })
          .returning();
      }

      // Merge cart items
      for (const guestItem of guestCart.cartItems) {
        // Check if item already exists in auth cart
        const existingItem = await db.query.cartItems.findFirst({
          where: and(
            eq(cartItems.cartId, authCart!.id),
            eq(cartItems.productId, guestItem.productId)
          ),
        });

        if (existingItem) {
          // Merge quantities
          await db
            .update(cartItems)
            .set({
              quantity: existingItem.quantity + guestItem.quantity,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(cartItems.id, existingItem.id));
        } else {
          // Add new item to auth cart
          await db.insert(cartItems).values({
            cartId: authCart!.id,
            productId: guestItem.productId,
            sellerId: guestItem.sellerId,
            quantity: guestItem.quantity,
            price: guestItem.price,
            variant: guestItem.variant,
          } as any);
        }
        mergedCartItems++;
      }

      // Delete guest cart items
      await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
    }

    // 2. Reassign orders to authenticated user
    const guestOrders = await db.query.orders.findMany({
      where: eq(orders.userId, guestUserId),
    });

    if (guestOrders.length > 0) {
      await db
        .update(orders)
        .set({
          userId: authenticatedUserId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.userId, guestUserId));

      mergedOrders = guestOrders.length;
    }

    // 3. Reassign addresses to authenticated user
    const guestAddresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, guestUserId),
    });

    if (guestAddresses.length > 0) {
      await db
        .update(userAddresses)
        .set({
          userId: authenticatedUserId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userAddresses.userId, guestUserId));

      mergedAddresses = guestAddresses.length;
    }

    // 4. Delete or disable guest user
    // We'll delete the guest user since all data has been transferred
    await db.delete(users).where(eq(users.id, guestUserId));

    // 5. Clear guest UID cookie
    await clearGuestUID();

    return {
      success: true,
      merged: {
        cartItems: mergedCartItems,
        orders: mergedOrders,
        addresses: mergedAddresses,
      },
    };
  } catch (error) {
    console.error("Error merging guest account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge guest account",
    };
  }
}

