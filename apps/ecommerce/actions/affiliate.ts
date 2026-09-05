"use server";

import { revalidatePath } from "next/cache";
import { db, users, eq } from "@workspace/db";
import {
  joinAffiliateProgram,
  getAffiliateAccount,
  getAffiliateOverview,
  getAffiliateOrders,
  type AffiliateOverview,
  type AffiliateOrderView,
} from "@workspace/db/affiliates";
import { getUser } from "./auth";
import { createNotification } from "./notifications";

/**
 * Server actions for the Tallaby Affiliate Program.
 *
 * Authorization rule that holds for every action here: the acting user comes
 * from the session (getUser(), backed by Supabase auth), never from a
 * client-supplied id — so there is no parameter a caller could tamper with to
 * join, read, or act on someone else's affiliate account. Commission amounts
 * are never accepted from the client; every figure returned here is read back
 * from the database rows the server itself computed at order/delivery time.
 *
 * Deliberately getUser(), not getCurrentUserId() — the latter falls back to a
 * cookie-based guest user id, and "requires an authenticated Tallaby account"
 * means a real Supabase session, not a guest checkout identity.
 */

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getUser();
  return session?.user?.id ?? null;
}

export type AffiliateActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface AffiliateAccountData {
  code: string;
  status: "active" | "inactive";
}

/** Whether the current viewer already has an affiliate account. Used to render the landing page CTA without requiring the profile page. */
export async function getMyAffiliateAccount(): Promise<AffiliateAccountData | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const account = await getAffiliateAccount(db, userId);
  if (!account) return null;

  return { code: account.code, status: account.status };
}

/**
 * Activates the affiliate program for the signed-in user. Idempotent — a
 * user who is already an affiliate gets their existing code back rather than
 * an error, so re-clicking "Join" (or a retried request) is always safe.
 */
export async function joinAffiliateProgramAction(): Promise<
  AffiliateActionResult<AffiliateAccountData>
> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "authenticationRequired" };
    }

    const existing = await getAffiliateAccount(db, userId);

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { fullName: true },
    });

    const account = await joinAffiliateProgram(db, {
      userId,
      fullName: user?.fullName ?? null,
    });

    if (!existing) {
      await createNotification({
        userId,
        type: "marketing",
        title: "You're a Tallaby affiliate",
        message: `Your affiliate code ${account.code} is ready. Share it — customers get 10% off and you earn 10% when their order is delivered.`,
        data: { affiliateCode: account.code },
      });
    }

    revalidatePath("/profile/affiliate");
    revalidatePath("/affiliate");

    return {
      success: true,
      data: { code: account.code, status: account.status },
    };
  } catch (error) {
    console.error("joinAffiliateProgramAction error:", error);
    return { success: false, error: "failedToJoinAffiliateProgram" };
  }
}

/** Everything the /profile/affiliate summary cards render. */
export async function getMyAffiliateOverview(): Promise<
  AffiliateActionResult<AffiliateOverview>
> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "authenticationRequired" };
    }

    const overview = await getAffiliateOverview(db, userId);
    if (!overview) {
      return { success: false, error: "notAnAffiliate" };
    }

    return { success: true, data: overview };
  } catch (error) {
    console.error("getMyAffiliateOverview error:", error);
    return { success: false, error: "failedToLoadAffiliateOverview" };
  }
}

/** Privacy-safe list of referred orders — never includes buyer name/phone/address/email. */
export async function getMyAffiliateOrders(params?: {
  limit?: number;
  offset?: number;
}): Promise<AffiliateActionResult<AffiliateOrderView[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "authenticationRequired" };
    }

    const ordersList = await getAffiliateOrders(db, userId, params);
    return { success: true, data: ordersList };
  } catch (error) {
    console.error("getMyAffiliateOrders error:", error);
    return { success: false, error: "failedToLoadAffiliateOrders" };
  }
}
