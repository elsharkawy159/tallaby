/**
 * Account Merge Logic
 *
 * When a guest user logs in, merge their guest account data
 * (cart, orders, addresses) into their authenticated account.
 */

"use server";

import {
  db,
  users,
  carts,
  cartItems,
  orders,
  userAddresses,
  eq,
  and,
} from "@workspace/db";
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
      return {
        success: true,
        merged: { cartItems: 0, orders: 0, addresses: 0 },
      };
    }

    // Find guest user by email pattern
    const guestEmail = `guest_${guestUID}@temp.local`;
    const guestUser = await db.query.users.findFirst({
      where: and(eq(users.email, guestEmail), eq(users.isGuest, true)),
    });

    if (!guestUser) {
      // Guest user doesn't exist, clear cookie and return
      await clearGuestUID();
      return {
        success: true,
        merged: { cartItems: 0, orders: 0, addresses: 0 },
      };
    }

    // Guest can never merge into itself (defensive: shouldn't happen since
    // an authenticated session id is always a real, non-guest user id).
    if (guestUser.id === authenticatedUserId) {
      await clearGuestUID();
      return {
        success: true,
        merged: { cartItems: 0, orders: 0, addresses: 0 },
      };
    }

    const guestUserId = guestUser.id;

    const merged = await db.transaction(async (tx) => {
      let mergedCartItems = 0;
      let mergedOrders = 0;
      let mergedAddresses = 0;

      // 1. Merge cart items
      const guestCart = await tx.query.carts.findFirst({
        where: and(eq(carts.userId, guestUserId), eq(carts.status, "active")),
        with: {
          cartItems: true,
        },
      });

      if (guestCart && guestCart.cartItems.length > 0) {
        // Get or create authenticated user's cart
        let authCart = await tx.query.carts.findFirst({
          where: and(
            eq(carts.userId, authenticatedUserId),
            eq(carts.status, "active")
          ),
        });

        if (!authCart) {
          [authCart] = await tx
            .insert(carts)
            .values({
              userId: authenticatedUserId,
              status: "active",
              currency: guestCart.currency || "EGP",
            })
            .returning();
        }

        // Cart items with the same product but a different variant are
        // distinct line items (mirrors the matching rule addToCart uses in
        // actions/cart.ts) - only fold quantities together when the variant
        // (or lack of one) also matches, otherwise the guest's variant would
        // silently vanish into whatever line the auth cart happened to have.
        const authItems = await tx.query.cartItems.findMany({
          where: eq(cartItems.cartId, authCart!.id),
        });

        for (const guestItem of guestCart.cartItems) {
          const guestVariantId = (guestItem.variant as any)?.id ?? null;
          const existingItem = authItems.find((item) => {
            const itemVariantId = (item.variant as any)?.id ?? null;
            return (
              item.productId === guestItem.productId &&
              itemVariantId === guestVariantId
            );
          });

          if (existingItem) {
            // Merge quantities
            await tx
              .update(cartItems)
              .set({
                quantity: existingItem.quantity + guestItem.quantity,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(cartItems.id, existingItem.id));
          } else {
            // Add new item to auth cart
            const [inserted] = await tx
              .insert(cartItems)
              .values({
                cartId: authCart!.id,
                productId: guestItem.productId,
                sellerId: guestItem.sellerId,
                quantity: guestItem.quantity,
                price: guestItem.price,
                variant: guestItem.variant,
              } as any)
              .returning();
            // Newly inserted items must also be visible to subsequent guest
            // items in this same loop, otherwise two guest lines for the
            // same product+variant would both fall into the "no existing
            // item" branch and create duplicate rows instead of merging.
            if (inserted) authItems.push(inserted);
          }
          mergedCartItems++;
        }

        // Delete guest cart items
        await tx.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
      }

      // 2. Reassign orders to authenticated user
      const guestOrders = await tx.query.orders.findMany({
        where: eq(orders.userId, guestUserId),
      });

      if (guestOrders.length > 0) {
        await tx
          .update(orders)
          .set({
            userId: authenticatedUserId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.userId, guestUserId));

        mergedOrders = guestOrders.length;
      }

      // 3. Reassign addresses to authenticated user
      const guestAddresses = await tx.query.userAddresses.findMany({
        where: eq(userAddresses.userId, guestUserId),
      });

      if (guestAddresses.length > 0) {
        await tx
          .update(userAddresses)
          .set({
            userId: authenticatedUserId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userAddresses.userId, guestUserId));

        mergedAddresses = guestAddresses.length;
      }

      // 4. Delete the guest user now that everything of value has been
      // transferred. Any remaining guest-only rows (e.g. its now-empty
      // cart) cascade-delete with it, keeping the database free of
      // abandoned guest accounts.
      await tx.delete(users).where(eq(users.id, guestUserId));

      return {
        cartItems: mergedCartItems,
        orders: mergedOrders,
        addresses: mergedAddresses,
      };
    });

    // 5. Clear guest UID cookie
    await clearGuestUID();

    return {
      success: true,
      merged,
    };
  } catch (error) {
    console.error("Error merging guest account:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to merge guest account",
    };
  }
}
