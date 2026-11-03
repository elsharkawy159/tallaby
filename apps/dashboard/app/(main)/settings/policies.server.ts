"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateSellerProfile } from "@/actions/seller";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

const policiesSchema = z.object({
  returnPolicy: z.string().trim().max(5000),
  shippingPolicy: z.string().trim().max(5000),
  privacyPolicy: z.string().trim().max(5000),
});

export type SavePoliciesResult = { success: true } | { success: false; error: "invalidInput" | "forbidden" | "generic" };

/** The account's policy text, shown on each store's /returns, /shipping and /privacy (F-46). */
export async function savePolicies(input: unknown): Promise<SavePoliciesResult> {
  try {
    await requireSeller({ forWrite: true });
    const parsed = policiesSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    const result = await updateSellerProfile(parsed.data);
    if (!result.success) return { success: false, error: "generic" };
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[settings] policies save failed");
    return { success: false, error: "generic" };
  }
}
