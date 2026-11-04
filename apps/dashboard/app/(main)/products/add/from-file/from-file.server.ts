"use server";

import { revalidatePath } from "next/cache";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  addBatchInputSchema,
  findExistingInputSchema,
  mapColumnsInputSchema,
  type AddBatchResult,
  type BulkErrorCode,
  type BulkStatus,
  type MapColumnsResult,
} from "./from-file.dto";
import { findExistingSkus, loadBulkStatus, mapColumns, runBulkBatch } from "./from-file-run.server";

/**
 * Server actions for "add many products from a file" (PLAN.md AI-3). The seller
 * always comes from the session; the input is parsed with zod and never trusted.
 * Products belong to the seller's account (a store shows all of them or its
 * picks), so none of this takes a store id. An action, not a route: createProduct
 * refreshes caches with updateTag, which Next allows only in server actions.
 */

/** Bursts per instance; the daily cap and credits are the real limits. */
const mapLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
const batchLimiter = createRateLimiter({ limit: 40, windowMs: 60_000 });

const accessFailure = (error: unknown): { ok: false; error: BulkErrorCode } => {
  if (isAccessError(error)) return { ok: false, error: "unauthorized" };
  // Never the row contents: only what went wrong.
  console.error("[ai] bulk action failed", error instanceof Error ? error.message : error);
  return { ok: false, error: "failed" };
};

export async function getBulkStatusAction(): Promise<BulkStatus> {
  try {
    const seller = await requireSeller();
    return await loadBulkStatus(seller.sellerId);
  } catch (error) {
    return accessFailure(error);
  }
}

export async function mapColumnsAction(input: unknown): Promise<MapColumnsResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = mapColumnsInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    if (!mapLimiter.check(seller.sellerId)) return { ok: false, error: "rateLimited" };
    return await mapColumns(seller.sellerId, parsed.data);
  } catch (error) {
    return accessFailure(error);
  }
}

/** So the confirm screen can leave out rows an earlier run of this file already added. */
export async function findExistingSkusAction(input: unknown): Promise<{ ok: true; existing: string[] } | { ok: false; error: BulkErrorCode }> {
  try {
    const seller = await requireSeller();
    const parsed = findExistingInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const existing = await findExistingSkus(seller.sellerId, parsed.data.skus);
    return { ok: true, existing: existing.map((entry) => entry.sku) };
  } catch (error) {
    return accessFailure(error);
  }
}

export async function addBatchAction(input: unknown): Promise<AddBatchResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = addBatchInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    if (!batchLimiter.check(seller.sellerId)) return { ok: false, error: "rateLimited" };
    const result = await runBulkBatch(seller.sellerId, parsed.data);
    // Each createProduct refreshes its own product's caches; this is the seller's list.
    revalidatePath("/products");
    return result;
  } catch (error) {
    return accessFailure(error);
  }
}
