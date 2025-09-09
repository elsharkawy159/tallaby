// apps/ecommerce/actions/wishlist.ts
"use server";

import { db, wishlists, wishlistItems, products } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUser } from "./auth";

export async function getOrCreateWishlist() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Find default wishlist
    let wishlist = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.userId, user.user.id),
        eq(wishlists.isDefault, true)
      ),
    });

    // Create default wishlist if none exists
    if (!wishlist) {
      const newWishlist = await db
        .insert(wishlists)
        .values({
          userId: user.user.id,
          name: "My Wishlist",
          isDefault: true,
          isPublic: false,
        })
        .returning();

      wishlist = newWishlist[0];
    }

    return { success: true, data: wishlist };
  } catch (error) {
    console.error("Error getting/creating wishlist:", error);
    return { success: false, error: "Failed to get wishlist" };
  }
}

export async function getWishlists() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const userWishlists = await db.query.wishlists.findMany({
      where: eq(wishlists.userId, user.user.id),
      orderBy: [desc(wishlists.isDefault), desc(wishlists.createdAt)],
    });

    return { success: true, data: userWishlists };
  } catch (error) {
    console.error("Error fetching wishlists:", error);
    return { success: false, error: "Failed to fetch wishlists" };
  }
}

export async function getWishlistItems(wishlistId?: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    let targetWishlistId = wishlistId;

    if (!targetWishlistId) {
      const defaultWishlist = await getOrCreateWishlist();
      if (!defaultWishlist.success || !defaultWishlist.data) {
        return { success: false, error: "Failed to get wishlist" };
      }
      targetWishlistId = defaultWishlist.data.id;
    }

    const items = await db.query.wishlistItems.findMany({
      where: eq(wishlistItems.wishlistId, targetWishlistId),
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
            productVariants: {
              limit: 1,
            },
          },
        },
        productVariant: true,
      },
      orderBy: [desc(wishlistItems.priority), desc(wishlistItems.addedAt)],
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return { success: false, error: "Failed to fetch wishlist items" };
  }
}

export async function addToWishlist(data: {
  productId: string;
  variantId?: string;
  wishlistId?: string;
  notes?: string;
  quantity?: number;
  priority?: number;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    let targetWishlistId = data.wishlistId;

    if (!targetWishlistId) {
      const defaultWishlist = await getOrCreateWishlist();
      if (!defaultWishlist.success || !defaultWishlist.data) {
        return { success: false, error: "Failed to get wishlist" };
      }
      targetWishlistId = defaultWishlist.data.id;
    }

    // Verify wishlist belongs to user
    const wishlist = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.id, targetWishlistId),
        eq(wishlists.userId, user.user.id)
      ),
    });

    if (!wishlist) {
      return { success: false, error: "Wishlist not found" };
    }

    // Check if product exists and is active
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, data.productId), eq(products.isActive, true)),
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Check if item already in wishlist
    const existingItem = await db.query.wishlistItems.findFirst({
      where: and(
        eq(wishlistItems.wishlistId, targetWishlistId),
        eq(wishlistItems.productId, data.productId),
        data.variantId
          ? eq(wishlistItems.variantId, data.variantId)
          : (true as any)
      ),
    });

    if (existingItem) {
      return { success: false, error: "Item already in wishlist" };
    }

    const newItem = await db
      .insert(wishlistItems)
      .values({
        wishlistId: targetWishlistId,
        productId: data.productId,
        variantId: data.variantId,
        notes: data.notes,
        quantity: data.quantity || 1,
        priority: data.priority || 0,
      })
      .returning();

    // Update wishlist timestamp
    await db
      .update(wishlists)
      .set({
        updatedAt: new Date().toISOString(),
      })
      .where(eq(wishlists.id, targetWishlistId));

    return { success: true, data: newItem[0], message: "Added to wishlist" };
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return { success: false, error: "Failed to add to wishlist" };
  }
}

export async function removeFromWishlist(itemId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify item belongs to user's wishlist
    const item = await db.query.wishlistItems.findFirst({
      where: eq(wishlistItems.id, itemId),
      with: {
        wishlist: true,
      },
    });

    if (!item || item.wishlist.userId !== user.user.id) {
      return { success: false, error: "Item not found" };
    }

    await db.delete(wishlistItems).where(eq(wishlistItems.id, itemId));

    return { success: true, message: "Removed from wishlist" };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, error: "Failed to remove from wishlist" };
  }
}

export async function moveToCart(itemId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get wishlist item
    const item = await db.query.wishlistItems.findFirst({
      where: eq(wishlistItems.id, itemId),
      with: {
        wishlist: true,
        product: true,
      },
    });

    if (!item || item.wishlist.userId !== user.user.id) {
      return { success: false, error: "Item not found" };
    }

    // Import cart action to add item
    const { addToCart } = await import("./cart");

    const cartResult = await addToCart({
      productId: item.productId,
      quantity: item.quantity || 1,
      variantId: item.variantId || undefined,
    });

    if (cartResult.success) {
      // Remove from wishlist
      await removeFromWishlist(itemId);
      return { success: true, message: "Moved to cart" };
    }

    return cartResult;
  } catch (error) {
    console.error("Error moving to cart:", error);
    return { success: false, error: "Failed to move to cart" };
  }
}

export async function createWishlist(data: {
  name: string;
  description?: string;
  isPublic?: boolean;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const shareUrl = data.isPublic
      ? `${process.env.NEXT_PUBLIC_URL}/wishlist/${crypto.randomUUID()}`
      : null;

    const newWishlist = await db
      .insert(wishlists)
      .values({
        userId: user.user.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic || false,
        isDefault: false,
        shareUrl,
      })
      .returning();

    return { success: true, data: newWishlist[0] };
  } catch (error) {
    console.error("Error creating wishlist:", error);
    return { success: false, error: "Failed to create wishlist" };
  }
}

export async function updateWishlist(
  wishlistId: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const shareUrl = data.isPublic
      ? `${process.env.NEXT_PUBLIC_URL}/wishlist/${crypto.randomUUID()}`
      : null;

    const updated = await db
      .update(wishlists)
      .set({
        ...data,
        ...(data.isPublic !== undefined && { shareUrl }),
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(wishlists.id, wishlistId), eq(wishlists.userId, user.user.id))
      )
      .returning();

    if (!updated.length) {
      return { success: false, error: "Wishlist not found" };
    }

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return { success: false, error: "Failed to update wishlist" };
  }
}

export async function deleteWishlist(wishlistId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Can't delete default wishlist
    const wishlist = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.id, wishlistId),
        eq(wishlists.userId, user.user.id)
      ),
    });

    if (!wishlist) {
      return { success: false, error: "Wishlist not found" };
    }

    if (wishlist.isDefault) {
      return { success: false, error: "Cannot delete default wishlist" };
    }

    await db.delete(wishlists).where(eq(wishlists.id, wishlistId));

    return { success: true, message: "Wishlist deleted" };
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    return { success: false, error: "Failed to delete wishlist" };
  }
}

export async function getPublicWishlist(shareUrl: string) {
  try {
    const wishlist = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.shareUrl, shareUrl),
        eq(wishlists.isPublic, true)
      ),
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        wishlistItems: {
          with: {
            product: {
              with: {
                brand: true,
              },
            },
          },
          orderBy: [desc(wishlistItems.priority)],
        },
      },
    });

    if (!wishlist) {
      return { success: false, error: "Wishlist not found" };
    }

    return { success: true, data: wishlist };
  } catch (error) {
    console.error("Error fetching public wishlist:", error);
    return { success: false, error: "Failed to fetch wishlist" };
  }
}

export async function checkIfInWishlist(productId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: true, data: false };
    }

    // First get the user's wishlist
    const userWishlist = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, user.user.id),
    });

    if (!userWishlist) {
      return { success: true, data: false };
    }

    // Then check if the product is in that wishlist
    const item = await db.query.wishlistItems.findFirst({
      where: and(
        eq(wishlistItems.productId, productId),
        eq(wishlistItems.wishlistId, userWishlist.id)
      ),
    });

    return { success: true, data: !!item };
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return { success: false, error: "Failed to check wishlist" };
  }
}
