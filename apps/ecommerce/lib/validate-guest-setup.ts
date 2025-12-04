/**
 * Validate Guest User Setup
 *
 * Helper function to validate that guest user setup is working correctly.
 * This can be used for debugging guest checkout issues.
 */

"use server";

import { getGuestUID } from "./guest-user";
import { db, users, eq } from "@workspace/db";

/**
 * Validate guest user setup and return diagnostic information
 */
export async function validateGuestSetup() {
  try {
    const guestUID = await getGuestUID();

    if (!guestUID) {
      return {
        success: false,
        error: "No guest UID found in cookie",
        diagnostics: {
          cookieExists: false,
          guestUID: null,
        },
      };
    }

    const guestEmail = `guest_${guestUID}@temp.local`;

    // Check if guest user exists
    const guestUser = await db.query.users.findFirst({
      where: eq(users.email, guestEmail),
    });

    return {
      success: true,
      diagnostics: {
        cookieExists: true,
        guestUID,
        guestEmail,
        userExists: !!guestUser,
        userId: guestUser?.id || null,
        isGuest: guestUser?.isGuest || false,
      },
    };
  } catch (error) {
    console.error("validateGuestSetup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
