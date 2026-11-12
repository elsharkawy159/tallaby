"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation } from "@workspace/cache";
import { getServiceClient } from "@workspace/db/supabase/service";
import {
  AgentProductError,
  agentCreateProduct,
  agentRestoreProducts,
  agentSearchCategories,
  agentSetProductStatus,
  agentTrashProducts,
} from "@workspace/lib/products/agent/server";
type CategoryRow = Awaited<ReturnType<typeof agentSearchCategories>>[number];

import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  StoreProductsAccessError,
  auditStoreProducts,
  requireStoreProductsAccess,
  sellerFolderImageUploader,
} from "./store-products-access.server";
import { buildCreateInput, storeProductImagePath, type StoreProductFormValues } from "./store-products.lib";

/**
 * Admin › Store › Products actions. Each one: product-admin check, the store
 * from the route id (its seller read from the database), then the shared
 * product command the MCP connector and the in-app agent use
 * (@workspace/lib/products/agent/server), which re-checks that the store is
 * the seller's and the product is in the store, keeps the seller's rules
 * (status, prices, slugs, SKUs, stock history, category counts) and returns
 * the cache invalidation (store data tags carry the seller id). Then one
 * admin_audit_log row. No money or ledger changes.
 */

export type StoreProductActionResult<T = undefined> =
  | ({ success: true; message: string } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };

const ACCESS_MESSAGES = {
  not_admin: "Only admins with product rights can change a store's products.",
  not_found: "This store no longer exists.",
} as const;

const PRODUCT_MESSAGES: Record<string, string> = {
  not_found: "That product is not in this store.",
  store_read_only: "This store is archived or suspended, so its products can't be changed.",
  invalid_category: "That Tallaby category no longer exists. Pick another.",
  category_required: "Pick a Tallaby category.",
  invalid_store_category: "That store category no longer exists. Pick another.",
  store_category_limit: "The store already has the most categories it can have.",
  image_failed: "A photo could not be used. Upload the photos again.",
  image_required: "Add at least one photo before publishing.",
  sku_taken: "That SKU is already used by another of the seller's products.",
  variants_invalid: "The variants are not valid.",
  cannot_publish: "This product can't be published: the seller's account is not approved, or Tallaby took the product down.",
};

function fail(error: unknown, scope: string): { success: false; error: string } {
  if (error instanceof StoreProductsAccessError) return { success: false, error: ACCESS_MESSAGES[error.code] };
  if (error instanceof AgentProductError) return { success: false, error: PRODUCT_MESSAGES[error.code] ?? error.message };
  console.error(`[admin-store-products] ${scope} failed`, error instanceof Error ? error.message : error);
  return { success: false, error: "Something went wrong. Try again." };
}

const refresh = (storeId: string) => revalidatePath(`/stores/${storeId}/products`);

const uploadLimiter = createRateLimiter({ limit: 300, windowMs: 10 * 60_000 });

/** A signed upload into this store's seller folder of the "products" bucket (no write policies since 0153). */
export async function createStoreProductImageUploadUrl(
  storeId: string,
  fileName: string,
): Promise<StoreProductActionResult<{ path: string; token: string; publicUrl: string }>> {
  try {
    const access = await requireStoreProductsAccess(storeId, { forWrite: true });
    const path = storeProductImagePath(access.store.sellerId, String(fileName));
    if (!path) return { success: false, error: "That file name can't be used." };
    if (!uploadLimiter.check(`store-product-image:${access.adminId}`)) return { success: false, error: "Too many uploads. Wait a few minutes." };
    const bucket = getServiceClient().storage.from("products");
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("no signed url");
    return { success: true, message: "", data: { path, token: data.token, publicUrl: bucket.getPublicUrl(path).data.publicUrl } };
  } catch (error) {
    return fail(error, "upload sign");
  }
}

/** Tallaby categories by a word in Arabic or English, for the create form. */
export async function searchStoreProductCategories(storeId: string, query: string): Promise<StoreProductActionResult<CategoryRow[]>> {
  try {
    const access = await requireStoreProductsAccess(storeId, { forWrite: false });
    const term = String(query ?? "").trim();
    if (!term) return { success: true, message: "", data: [] };
    return { success: true, message: "", data: await agentSearchCategories(access.ctx, term.slice(0, 80)) };
  } catch (error) {
    return fail(error, "category search");
  }
}

/** Adds a product to the store, exactly as the seller's own create (shared command). */
export async function createStoreProductAction(
  storeId: string,
  values: StoreProductFormValues,
): Promise<StoreProductActionResult<{ productId: string; status: string }>> {
  try {
    const access = await requireStoreProductsAccess(storeId, { forWrite: true });
    const built = buildCreateInput(values, access.store.id);
    if (!built.ok) return { success: false, error: built.error };
    const created = await agentCreateProduct(access.ctx, built.input, sellerFolderImageUploader(access.store.sellerId));
    await applyInvalidation(created.invalidation, { from: "admin", mode: "action" });
    await auditStoreProducts(access, "create_store_product", {
      productId: created.productId,
      status: created.status,
      title: built.input.title.en,
      price: built.input.price,
    });
    refresh(access.store.id);
    const wantedLive = built.input.publish !== false;
    return {
      success: true,
      message:
        created.status === "active"
          ? "Product added and live on the store"
          : wantedLive
            ? "Product added as a draft: the seller's account can't publish yet"
            : "Product added as a draft",
      data: { productId: created.productId, status: created.status },
    };
  } catch (error) {
    return fail(error, "create");
  }
}

/** Publish ("active") or hide ("draft") one of the store's products. */
export async function setStoreProductStatusAction(storeId: string, productId: string, status: "active" | "draft"): Promise<StoreProductActionResult> {
  try {
    if (status !== "active" && status !== "draft") return { success: false, error: "Unknown status." };
    const access = await requireStoreProductsAccess(storeId, { forWrite: true });
    const out = await agentSetProductStatus(access.ctx, String(productId), status);
    if (!out.changed) return { success: true, message: "Nothing to change" };
    await applyInvalidation(out.invalidation, { from: "admin", mode: "action" });
    await auditStoreProducts(access, "set_store_product_status", { productId, status: out.status });
    refresh(access.store.id);
    return { success: true, message: status === "active" ? "Product published" : "Product hidden (draft)" };
  } catch (error) {
    return fail(error, "status");
  }
}

const idList = (ids: unknown) => (Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(0, 50) : []);

/** Moves products to Trash (30 days, restorable), only the ones in this store. */
export async function trashStoreProductsAction(storeId: string, productIds: string[]): Promise<StoreProductActionResult> {
  try {
    const access = await requireStoreProductsAccess(storeId, { forWrite: true });
    const out = await agentTrashProducts(access.ctx, idList(productIds));
    await applyInvalidation(out.invalidation, { from: "admin", mode: "action" });
    if (out.trashed.length) await auditStoreProducts(access, "trash_store_products", { productIds: out.trashed });
    refresh(access.store.id);
    return out.trashed.length
      ? { success: true, message: out.trashed.length === 1 ? "Moved to Trash" : `${out.trashed.length} products moved to Trash` }
      : { success: false, error: PRODUCT_MESSAGES.not_found! };
  } catch (error) {
    return fail(error, "trash");
  }
}

export async function restoreStoreProductsAction(storeId: string, productIds: string[]): Promise<StoreProductActionResult> {
  try {
    const access = await requireStoreProductsAccess(storeId, { forWrite: true });
    const out = await agentRestoreProducts(access.ctx, idList(productIds));
    await applyInvalidation(out.invalidation, { from: "admin", mode: "action" });
    if (out.restored.length) await auditStoreProducts(access, "restore_store_products", { productIds: out.restored });
    refresh(access.store.id);
    return out.restored.length
      ? { success: true, message: out.restored.length === 1 ? "Restored from Trash" : `${out.restored.length} products restored` }
      : { success: false, error: "Nothing to restore: the product is not in this store's Trash." };
  } catch (error) {
    return fail(error, "restore");
  }
}
