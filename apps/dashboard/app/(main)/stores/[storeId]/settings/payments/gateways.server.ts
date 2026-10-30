"use server";

import { revalidatePath } from "next/cache";
import {
  connectStoreGateway,
  disconnectStoreGateway,
  type StoreGatewayOverview,
} from "@workspace/lib/payments/store-gateways/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { GatewayErrorKey, GatewayResult } from "./gateways.dto";

/**
 * Store settings › Payment methods › Online card payments (ROADMAP.md F-39).
 * The seller's gateway keys go from the form to the gateway (to verify them)
 * and then into AES-256-GCM; nothing sent back contains them. Never log the
 * input. storeId is explicit and re-checked with requireStore.
 */

/** Connecting calls the gateway with whatever is pasted: 5 a minute per store stops key-guessing through us. */
const connectLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const disconnectLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

const ERRORS: Record<string, GatewayErrorKey> = {
  invalid_secret_key: "invalidSecretKey",
  invalid_public_key: "invalidPublicKey",
  mode_mismatch: "modeMismatch",
  invalid_integration_id: "invalidIntegrationId",
  invalid_hmac_secret: "invalidHmacSecret",
  invalid_merchant_id: "invalidMerchantId",
  invalid_api_key: "invalidApiKey",
  invalid_mode: "invalidMode",
  keys_rejected: "keysRejected",
  gateway_unreachable: "gatewayUnreachable",
  other_gateway_connected: "otherGatewayConnected",
  webhooks_not_configured: "webhooksNotConfigured",
  not_available: "notAvailable",
  unsupported: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

export type GatewayForm = Record<string, string>;

export async function connectGateway(
  storeId: string,
  provider: string,
  input: GatewayForm,
): Promise<GatewayResult<StoreGatewayOverview>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!connectLimiter.check(`gateway-connect:${store.id}`)) return { success: false, error: "rateLimited" };

    // Only the fields a gateway form has, as strings; validated in @workspace/lib.
    const clean: Record<string, string> = {};
    for (const key of ["secretKey", "publicKey", "hmacSecret", "cardIntegrationId", "walletIntegrationId", "merchantId", "paymentApiKey", "mode"]) {
      const value = input?.[key];
      if (typeof value === "string") clean[key] = value.slice(0, 600);
    }

    const result = await connectStoreGateway(seller.sellerId, seller.userId, store.id, String(provider), clean);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(`/stores/${store.id}/settings/payments`);
    return { success: true, data: result.data };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    // The name only: an error object could carry the submitted keys.
    console.error("[store-gateways] connect failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

export async function disconnectGateway(storeId: string, provider: string): Promise<GatewayResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!disconnectLimiter.check(`gateway-disconnect:${store.id}`)) return { success: false, error: "rateLimited" };
    const result = await disconnectStoreGateway(seller.sellerId, seller.userId, store.id, String(provider));
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(`/stores/${store.id}/settings/payments`);
    return { success: true, data: null };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[store-gateways] disconnect failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
