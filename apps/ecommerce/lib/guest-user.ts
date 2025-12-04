/**
 * Guest User Management
 *
 * Handles temporary user creation for guest checkout flow.
 * Guests are represented as temporary users in the users table with isGuest = true.
 */

import { cookies } from "next/headers";
import { db, users, eq } from "@workspace/db";
import { createClient } from "@/supabase/server";

const GUEST_UID_COOKIE_NAME = "guest_uid";
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
 * Get or create a guest user based on cookie UID
 * Returns the userId (UUID) of the guest user
 */
export async function getOrCreateGuestUser(): Promise<string | null> {
  try {
    let guestUID = await getGuestUID();

    // Generate new UID if none exists
    if (!guestUID) {
      guestUID = await generateAndSetGuestUID();
    }

    // Check if user already exists for this UID
    // We'll use a special email format: guest_<uid>@temp.local
    const guestEmail = `guest_${guestUID}@temp.local`;

    let guestUser = await db.query.users.findFirst({
      where: eq(users.email, guestEmail),
    });

    // Create guest user if it doesn't exist
    if (!guestUser) {
      // Generate a UUID for the user ID (use crypto.randomUUID for better uniqueness)
      const userId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : generateRandomUID();

      // Create user in database
      const [createdUser] = await db
        .insert(users)
        .values({
          id: userId,
          email: guestEmail,
          firstName: "Guest",
          lastName: "User",
          fullName: "Guest User",
          isGuest: true,
          isVerified: false,
          role: "customer",
          receiveMarketingEmails: false,
        } as any)
        .returning();

      if (!createdUser) {
        console.error("Failed to create guest user");
        return null;
      }

      guestUser = createdUser;
    }

    return guestUser.id;
  } catch (error) {
    console.error("Error getting/creating guest user:", error);
    return null;
  }
}

/**
 * Get guest user ID if user is a guest (not authenticated)
 * Returns null if user is authenticated or if guest user doesn't exist
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

    // User is not authenticated, get/create guest user
    return await getOrCreateGuestUser();
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
