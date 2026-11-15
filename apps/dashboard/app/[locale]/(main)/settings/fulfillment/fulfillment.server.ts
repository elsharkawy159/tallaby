"use server";

import { revalidatePath } from "next/cache";
import { FULFILLMENT_SERVICE_TYPES, TALLABY_SERVICES_ENABLED } from "@workspace/lib/fulfillment";
import { upsertSellerFulfillmentRequest } from "@workspace/lib/fulfillment/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Settings › Fulfillment services: the seller requests Tallaby services
 * (PLAN.md §15, P8-01). The seller id comes only from the session; the
 * library writes `requested_*` only, and an admin activates
 * (docs/fulfillment.md §2).
 */

const requestLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

export type FulfillmentRequestActionResult =
  | { success: true; changed: boolean; needsContact: boolean }
  | {
      success: false;
      error: "validation" | "servicePaused" | "forbidden" | "rateLimited" | "generic";
      errors?: Record<string, string>;
    };

export async function requestFulfillmentServices(input: unknown): Promise<FulfillmentRequestActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!requestLimiter.check(`fulfillment-request:${seller.sellerId}`)) {
      return { success: false, error: "rateLimited" };
    }

    // No Tallaby service can be requested while TALLABY_SERVICES_ENABLED is off.
    if (!TALLABY_SERVICES_ENABLED) {
      const services = (input as { services?: Record<string, { provider?: unknown } | undefined> } | null)?.services;
      const errors: Record<string, string> = {};
      for (const type of FULFILLMENT_SERVICE_TYPES) {
        if (services?.[type]?.provider === "tallaby") errors[`services.${type}.provider`] = "tallaby_service_unavailable";
      }
      if (Object.keys(errors).length) return { success: false, error: "validation", errors };
    }

    const result = await upsertSellerFulfillmentRequest({ sellerId: seller.sellerId, request: input });
    if (!result.success) {
      if (result.error === "invalid_input") return { success: false, error: "validation", errors: result.errors };
      if (result.error === "service_paused") return { success: false, error: "servicePaused" };
      return { success: false, error: "forbidden" };
    }

    if (result.changed) revalidatePath("/settings/fulfillment");
    return { success: true, changed: result.changed, needsContact: result.needsContact };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[settings/fulfillment] request failed");
    return { success: false, error: "generic" };
  }
}
