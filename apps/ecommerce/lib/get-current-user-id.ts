/**
 * Get Current User ID Utility
 *
 * Returns the authenticated user ID if logged in, or existing guest user ID if not.
 * This utility is used across cart, checkout, and order actions.
 *
 * IMPORTANT: This function does NOT create guest users. Use getOrCreateCurrentUserId()
 * when you need to ensure a user exists (e.g., when creating a cart, adding to wishlist, etc.)
 */

import { getUser } from "@/actions/auth";
import { getGuestUserId, createGuestUser } from "./guest-user";

/**
 * Get the current user ID (authenticated or existing guest)
 * Returns null if user is not authenticated and no guest user exists
 * Does NOT create a new guest user - use getOrCreateCurrentUserId() for that
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Check if user is authenticated first
  const user = await getUser();
  if (user?.user?.id) {
    return user.user.id;
  }

  // Fall back to existing guest user (don't create)
  return await getGuestUserId();
}

/**
 * Get or create the current user ID (authenticated or guest)
 * Creates a guest user if none exists and user is not authenticated
 * Use this when user interaction requires a user to exist (e.g., adding to cart, creating wishlist)
 */
export async function getOrCreateCurrentUserId(): Promise<string | null> {
  // Check if user is authenticated first
  const user = await getUser();
  if (user?.user?.id) {
    return user.user.id;
  }

  // Get existing guest user or create a new one
  const existingGuest = await getGuestUserId();
  if (existingGuest) {
    return existingGuest;
  }

  // Create new guest user
  return await createGuestUser();
}

/**
 * Check if current user is a guest
 */
export async function isGuestUser(): Promise<boolean> {
  const user = await getUser();
  return !user?.user?.id;
}
