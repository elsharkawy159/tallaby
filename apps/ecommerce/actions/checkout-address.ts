"use server";

import { getLocale } from "next-intl/server";
import {
  parseCheckoutAddress,
  type CheckoutAddressField,
  type CheckoutAddressInput,
} from "@workspace/lib/shipping/checkout-address";
import { saveCheckoutAddressRow } from "@workspace/lib/shipping/checkout-address/server";
import { getOrCreateCurrentUserId } from "@/lib/get-current-user-id";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * The simple checkout form (ROADMAP.md F-64). The user comes from the session
 * (a guest gets their guest row). The governorate is worked out here again: a
 * client can't pick a delivery price by sending a state.
 */

// The form saves as the customer pauses typing, so this only stops abuse.
const saveLimiter = createRateLimiter({ limit: 40, windowMs: 60_000 });

export type SaveCheckoutAddressResult =
  | { success: true; data: { id: string; state: string; city: string; addressLine1: string; fullName: string; phone: string } }
  | { success: false; errors: CheckoutAddressField[]; needsGovernorate: boolean; failed?: "rateLimited" | "generic" };

export async function saveCheckoutAddress(
  input: CheckoutAddressInput & { addressId?: string | null },
): Promise<SaveCheckoutAddressResult> {
  try {
    const parsed = parseCheckoutAddress(input, await getLocale());
    if (!parsed.ok) return { success: false, errors: parsed.errors, needsGovernorate: parsed.needsGovernorate };

    const userId = await getOrCreateCurrentUserId();
    if (!userId) return { success: false, errors: [], needsGovernorate: false, failed: "generic" };
    if (!saveLimiter.check(`checkout-address:${userId}`)) {
      return { success: false, errors: [], needsGovernorate: false, failed: "rateLimited" };
    }

    const { id } = await saveCheckoutAddressRow(userId, parsed.value, input?.addressId ?? null);
    const { state, city, addressLine1, fullName, phone } = parsed.value;
    return { success: true, data: { id, state, city, addressLine1, fullName, phone } };
  } catch {
    // No customer details in the logs.
    console.error("[checkout] address save failed");
    return { success: false, errors: [], needsGovernorate: false, failed: "generic" };
  }
}
