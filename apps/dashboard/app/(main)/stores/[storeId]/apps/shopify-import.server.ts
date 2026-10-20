"use server";

import { isRichTextEmpty, sanitizeRichTextHtml } from "@workspace/tiptap";
import {
  connectShopify,
  importShopifyChunk,
  previewShopifyImport,
  type ShopifyChunkResult,
  type ShopifyPreview,
  type StoreIntegrationSummary,
} from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { createClient } from "@/supabase/server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Shopify import (PLAN.md §9.2, P7-07). No job system exists,
 * so the client calls `importShopifyBatch` repeatedly with the cursor each
 * call returns; every call re-checks the session seller and the store. New
 * products are DRAFTS of the session seller; images go to the existing
 * `products` bucket through the seller's own Supabase session (Storage RLS
 * applies), under the same `YYYY-MM-DD/uuid.ext` paths the product form uses.
 */

const previewLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });
// One batch = up to 5 products; 600 calls / 10 min ≈ 3,000 products.
const batchLimiter = createRateLimiter({ limit: 600, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_shop_domain: "invalidShopDomain",
  invalid_token: "invalidToken",
  invalid_category: "invalidCategory",
  auth: "shopifyAuth",
  scope: "shopifyScope",
  throttled: "rateLimited",
  unreachable: "shopifyUnreachable",
  failed: "shopifyUnreachable",
  not_connected: "notConnected",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

const apiVersion = () => process.env.SHOPIFY_ADMIN_API_VERSION || undefined;

export async function connectShopifyStore(
  storeId: string,
  input: { shopDomain?: string; accessToken?: string },
): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const raw = {
      shopDomain: typeof input?.shopDomain === "string" ? input.shopDomain : "",
      accessToken: typeof input?.accessToken === "string" ? input.accessToken : "",
    };
    const result = await connectShopify(seller.sellerId, seller.userId, store.id, raw, { apiVersion: apiVersion() });
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] shopify connect failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

export async function previewShopifyStore(storeId: string): Promise<StoreAppsResult<ShopifyPreview>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!previewLimiter.check(`shopify-preview:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await previewShopifyImport(seller.sellerId, store.id, { apiVersion: apiVersion() });
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] shopify preview failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

function todayFolder(): string {
  return new Date().toISOString().slice(0, 10);
}

const MAP_KEYS = 200;

export async function importShopifyBatch(
  storeId: string,
  input: { cursor?: string | null; categoryMap?: Record<string, string>; defaultCategoryId?: string },
): Promise<StoreAppsResult<ShopifyChunkResult>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!batchLimiter.check(`shopify-batch:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const cursor = typeof input?.cursor === "string" && input.cursor.length <= 512 ? input.cursor : null;
    const defaultCategoryId = typeof input?.defaultCategoryId === "string" ? input.defaultCategoryId : "";
    const categoryMap: Record<string, string> = {};
    for (const [type, categoryId] of Object.entries(input?.categoryMap ?? {}).slice(0, MAP_KEYS)) {
      if (typeof type === "string" && type.length <= 100 && typeof categoryId === "string" && categoryId) {
        categoryMap[type] = categoryId;
      }
    }

    const supabase = await createClient();
    const result = await importShopifyChunk(
      seller.sellerId,
      store.id,
      { cursor, categoryMap, defaultCategoryId },
      {
        sanitizeHtml: (html) => {
          const clean = sanitizeRichTextHtml(html);
          return isRichTextEmpty(clean) ? null : clean;
        },
        uploadImage: async (bytes, contentType, ext) => {
          const path = `${todayFolder()}/${crypto.randomUUID()}.${ext}`;
          const { data, error } = await supabase.storage
            .from("products")
            .upload(path, new Blob([bytes], { type: contentType }), { contentType, upsert: false });
          return error || !data?.path ? null : data.path;
        },
      },
      { apiVersion: apiVersion() },
    );
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    if (!result.data.nextCursor) await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] shopify batch failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
