"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { listStores } from "@workspace/lib/stores/server";
import { updateSellerLegalDetails, updateSellerPayoutDetails } from "@workspace/lib/sellers/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * Business & account › legal details and payout account (PLAN.md P3-05).
 * The seller comes from the session; inputs are validated by the strict
 * schemas in @workspace/lib/sellers. Payout details are never logged.
 */

export type AccountActionResult = { success: true } | { success: false; error: "invalidInput" | "forbidden" | "generic" };

async function run(action: (sellerId: string) => Promise<{ success: boolean; error?: string }>): Promise<AccountActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const result = await action(seller.sellerId);
    if (!result.success) return { success: false, error: result.error === "invalid_input" ? "invalidInput" : "generic" };
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[settings] account save failed");
    return { success: false, error: "generic" };
  }
}

export async function saveLegalDetails(input: { businessType: unknown; legalAddress: unknown }): Promise<AccountActionResult> {
  return run(async (sellerId) => {
    const result = await updateSellerLegalDetails(sellerId, { businessType: input?.businessType, legalAddress: input?.legalAddress });
    // The store footer and hero show the governorate from the cached store profile (by subdomain).
    if (result.success) {
      const stores = await listStores(sellerId).catch(() => []);
      await applyInvalidation(invalidateStorefront(stores.map((store) => store.subdomain)), { from: "dashboard", mode: "action" });
    }
    return result;
  });
}

export async function savePayoutDetails(input: unknown): Promise<AccountActionResult> {
  return run((sellerId) => updateSellerPayoutDetails(sellerId, input));
}
