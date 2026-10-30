"use server";

import {
  audienceFile,
  audienceFileCount,
  audienceFileName,
  parseAudienceFormat,
  parseAudienceSegment,
} from "@workspace/lib/audiences";
import { loadStoreAudience } from "@workspace/lib/audiences/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/**
 * Orders › Customers › Export audience (ROADMAP.md F-16b): one segment of the
 * store's own customers as a Meta / TikTok custom-audience CSV. Takes an
 * explicit storeId, re-checked against the session's seller (requireStore);
 * the queries are scoped by that seller again. Never cached, never logged.
 */

export type ExportAudienceResult =
  | { success: true; csv: string; fileName: string; count: number }
  | { success: false; error: "notFound" | "invalid" | "empty" | "generic" };

export async function exportAudience(input: { storeId: string; segment: string; format: string }): Promise<ExportAudienceResult> {
  try {
    const segment = parseAudienceSegment(input?.segment);
    const format = parseAudienceFormat(input?.format);
    if (!segment || !format) return { success: false, error: "invalid" };
    const { seller, store } = await requireStore(String(input?.storeId ?? ""));
    const rows = await loadStoreAudience(seller.sellerId, store.id, segment);
    const count = audienceFileCount(rows, format);
    if (count === 0) return { success: false, error: "empty" };
    const date = new Date().toISOString().slice(0, 10);
    return { success: true, csv: audienceFile(rows, format), fileName: audienceFileName(segment, format, date), count };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[customers] audience export failed");
    return { success: false, error: "generic" };
  }
}
