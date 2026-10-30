"use server";

import { headers } from "next/headers";
import { pushEndpointInputSchema, pushSubscriptionInputSchema } from "@workspace/lib/push";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import {
  deleteAdminPushSubscription,
  getVapidConfig,
  getVapidPublicKey,
  saveAdminPushSubscription,
  sendAdminTestPush,
} from "@/lib/push/admin-push.server";

/**
 * Browser alerts for the admin bell (ROADMAP.md F-06e, 0131). The admin always
 * comes from the session; the browser only sends its own push subscription.
 */

export type AdminPushResult = { success: true } | { success: false; error: string };

async function guarded(action: (userId: string) => Promise<AdminPushResult>): Promise<AdminPushResult> {
  if (!getVapidConfig()) return { success: false, error: "Browser alerts aren't set up on this server yet." };
  try {
    const admin = await getCurrentAdminUser();
    return await action(admin.id);
  } catch (error) {
    console.error("[admin-push] action failed", (error as Error)?.name);
    return { success: false, error: "Something went wrong. Try again." };
  }
}

/** The VAPID public key, or null when push is not configured (the toggle hides). */
export async function getAdminPushPublicKey(): Promise<string | null> {
  await getCurrentAdminUser();
  return getVapidPublicKey();
}

/** Saves this browser (also re-saved on each visit so the owner stays current). */
export async function saveAdminPushSubscriptionAction(input: unknown): Promise<AdminPushResult> {
  return guarded(async (userId) => {
    const parsed = pushSubscriptionInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "This browser sent an alert setup we can't use." };
    await saveAdminPushSubscription(userId, parsed.data, (await headers()).get("user-agent"));
    return { success: true };
  });
}

export async function removeAdminPushSubscriptionAction(endpoint: unknown): Promise<AdminPushResult> {
  return guarded(async (userId) => {
    const parsed = pushEndpointInputSchema.safeParse(endpoint);
    if (!parsed.success) return { success: false, error: "Invalid device." };
    await deleteAdminPushSubscription(userId, parsed.data);
    return { success: true };
  });
}

export async function sendAdminTestPushAction(): Promise<AdminPushResult> {
  return guarded(async (userId) => {
    const { sent } = await sendAdminTestPush(userId);
    return sent > 0
      ? { success: true }
      : { success: false, error: "The test alert couldn't be sent. Turn alerts off and on again." };
  });
}
