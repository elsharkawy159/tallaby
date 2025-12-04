/**
 * Get Current User ID Utility
 *
 * Returns the authenticated user ID if logged in, or guest user ID if not.
 * This utility is used across cart, checkout, and order actions.
 */

import { getUser } from "@/actions/auth";
import { getGuestUserId } from "./guest-user";

/**
 * Get the current user ID (authenticated or guest)
 * Returns null only if guest user creation fails
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Check if user is authenticated first
  const user = await getUser();
  if (user?.user?.id) {
    return user.user.id;
  }

  // Fall back to guest user
  return await getGuestUserId();
}

/**
 * Check if current user is a guest
 */
export async function isGuestUser(): Promise<boolean> {
  const user = await getUser();
  return !user?.user?.id;
}
