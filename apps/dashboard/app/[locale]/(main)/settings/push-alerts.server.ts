"use server";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/config";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import {
  pushEndpointInputSchema,
  pushPrefsInputSchema,
  pushSubscriptionInputSchema,
} from "@/lib/push/push-alerts.dto";
import {
  deleteSellerPushSubscription,
  getVapidConfig,
  saveSellerPushPrefs,
  saveSellerPushSubscription,
  sendSellerTestPush,
} from "@/lib/push/push-alerts.server";

/**
 * Settings › Phone alerts (ROADMAP.md F-06). The seller always comes from
 * the session; the browser only sends its own push subscription. Every
 * action is a no-op error while the VAPID keys are not configured.
 */

export type PushActionResult =
  | { success: true }
  | { success: false; error: "disabled" | "invalidInput" | "forbidden" | "generic" };

async function guarded(
  write: boolean,
  action: (sellerId: string) => Promise<PushActionResult>,
): Promise<PushActionResult> {
  if (!getVapidConfig()) return { success: false, error: "disabled" };
  try {
    const seller = await requireSeller(write ? { forWrite: true } : {});
    return await action(seller.sellerId);
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[push-alerts] action failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

/** Saves this browser's subscription (also re-saved on each visit to keep the locale and owner current). */
export async function savePushSubscriptionAction(input: unknown): Promise<PushActionResult> {
  return guarded(true, async (sellerId) => {
    const parsed = pushSubscriptionInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    await saveSellerPushSubscription(sellerId, parsed.data, {
      userAgent: headerStore.get("user-agent"),
      locale: resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value),
    });
    return { success: true };
  });
}

/** Turn off on this device. Allowed for any signed-in seller (stopping alerts is never blocked). */
export async function removePushSubscriptionAction(endpoint: unknown): Promise<PushActionResult> {
  return guarded(false, async (sellerId) => {
    const parsed = pushEndpointInputSchema.safeParse(endpoint);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    await deleteSellerPushSubscription(sellerId, parsed.data);
    return { success: true };
  });
}

export async function savePushPrefsAction(input: unknown): Promise<PushActionResult> {
  return guarded(true, async (sellerId) => {
    const parsed = pushPrefsInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    await saveSellerPushPrefs(sellerId, parsed.data);
    return { success: true };
  });
}

export async function sendTestPushAction(): Promise<PushActionResult> {
  return guarded(false, async (sellerId) => {
    const { sent } = await sendSellerTestPush(sellerId);
    return sent > 0 ? { success: true } : { success: false, error: "generic" };
  });
}
