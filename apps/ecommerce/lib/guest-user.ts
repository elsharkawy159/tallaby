/**
 * Guest User Management
 *
 * Handles temporary user creation for guest checkout flow.
 * Guests are represented as temporary users in the users table with isGuest = true.
 */

import { cookies } from "next/headers";
import { db, users, userAddresses, eq, and, sql } from "@workspace/db";
import { createClient } from "@/supabase/server";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const GUEST_UID_COOKIE_NAME = "guest_uid";
const GUEST_UID_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Generate a random UUID v4 string
 * Uses crypto.randomUUID() if available, otherwise falls back to custom generation
 */
function generateRandomUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: Generate UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or generate guest UID from cookie
 */
export async function getGuestUID(): Promise<string | null> {
  const cookieStore = await cookies();
  const guestUID = cookieStore.get(GUEST_UID_COOKIE_NAME)?.value;

  if (!guestUID) {
    return null;
  }

  return guestUID;
}

/**
 * Set guest UID in cookie
 */
export async function setGuestUID(uid: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_UID_COOKIE_NAME, uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GUEST_UID_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Generate a new guest UID and store it in cookie
 */
export async function generateAndSetGuestUID(): Promise<string> {
  const uid = generateRandomUID();
  await setGuestUID(uid);
  return uid;
}

/**
 * Get existing guest user based on cookie UID
 * Returns the userId (UUID) of the guest user if it exists, null otherwise
 * Does NOT create a new user - use createGuestUser() for that
 */
export async function getGuestUser(): Promise<string | null> {
  try {
    const guestUID = await getGuestUID();

    if (!guestUID) {
      return null;
    }

    // Check if user already exists for this UID
    // We'll use a special email format: guest_<uid>@temp.local
    const guestEmail = `guest_${guestUID}@temp.local`;

    const guestUser = await db.query.users.findFirst({
      where: eq(users.email, guestEmail),
    });

    return guestUser?.id || null;
  } catch (error) {
    console.error("Error getting guest user:", error);
    return null;
  }
}

/**
 * Create a guest user based on cookie UID
 * Generates and sets a new guest UID if one doesn't exist
 * Returns the userId (UUID) of the created guest user
 */
export async function createGuestUser(): Promise<string | null> {
  try {
    let guestUID = await getGuestUID();

    // Generate new UID if none exists
    if (!guestUID) {
      guestUID = await generateAndSetGuestUID();
    }

    // Check if user already exists for this UID
    const guestEmail = `guest_${guestUID}@temp.local`;

    let guestUser = await db.query.users.findFirst({
      where: eq(users.email, guestEmail),
    });

    // Only create if it doesn't exist
    if (!guestUser) {
      // Generate a UUID for the user ID
      const userId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : generateRandomUID();

      // Create user in database
      const [createdUser] = await db
        .insert(users)
        .values({
          id: userId,
          fullName: "Guest User",
          email: guestEmail,
          isGuest: true,
        })
        .returning();

      if (!createdUser) {
        console.error("Failed to create guest user");
        return null;
      }

      guestUser = createdUser;
    }

    return guestUser.id;
  } catch (error) {
    console.error("Error creating guest user:", error);
    return null;
  }
}

/**
 * Get or create a guest user based on cookie UID
 * @deprecated Use getGuestUser() or createGuestUser() explicitly instead
 * Returns the userId (UUID) of the guest user
 */
export async function getOrCreateGuestUser(): Promise<string | null> {
  const existing = await getGuestUser();
  if (existing) {
    return existing;
  }
  return await createGuestUser();
}

/**
 * Get guest user ID if user is a guest (not authenticated)
 * Returns null if user is authenticated or if guest user doesn't exist
 * Does NOT create a new user - use createGuestUser() when user interaction occurs
 */
export async function getGuestUserId(): Promise<string | null> {
  try {
    // Check if user is authenticated first
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    // If authenticated, return null (not a guest)
    if (authData?.user) {
      return null;
    }

    // User is not authenticated, get existing guest user (don't create)
    return await getGuestUser();
  } catch (error) {
    console.error("Error getting guest user ID:", error);
    return null;
  }
}

/**
 * Clear guest UID cookie
 */
export async function clearGuestUID(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_UID_COOKIE_NAME);
}

/**
 * Sync guest user's fullName and phone from their first address.
 * Call before inserting the address; only updates if user is guest with zero addresses.
 */
export async function syncGuestProfileFromFirstAddress(
  tx: DbTransaction,
  userId: string,
  data: { fullName: string; phone: string }
): Promise<void> {
  const guestUser = await tx.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.isGuest, true)),
  });

  if (!guestUser) {
    return;
  }

  const [addressCount] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId));

  if (Number(addressCount?.count ?? 0) !== 0) {
    return;
  }

  await tx
    .update(users)
    .set({
      fullName: data.fullName,
      phone: data.phone,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}
