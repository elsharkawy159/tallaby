import { randomUUID } from "node:crypto";
import { db, sql } from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import {
  CUSTOMER_UPLOAD_BUCKET,
  CUSTOMER_UPLOAD_KEEP_DAYS,
  CUSTOMER_UPLOAD_MAX_BYTES,
  CUSTOMER_UPLOAD_TYPES,
  customerUploadPrefix,
  type CustomerUploadMime,
} from "./customer-fields.lib";

/**
 * Customer photos for "Customer requirements" (F-91) in the PRIVATE
 * `order-customer-uploads` bucket (0167, no storage policies). Only server code
 * touches it, with the service role (CLAUDE.md rule 10): it signs one upload
 * into the visitor's own folder, checks a file before a cart line keeps it,
 * signs short-lived views for whoever the caller has already authorised, and
 * deletes uploads no order kept. Every caller checks who is asking first.
 */

const isMime = (value: unknown): value is CustomerUploadMime => typeof value === "string" && value in CUSTOMER_UPLOAD_TYPES;

export type SignedCustomerUpload = { path: string; token: string };

/** One signed upload into `<store|market>/<user>/<uuid>.<ext>`; null when the type or size is not allowed. */
export async function signCustomerUpload(input: {
  storeId: string | null;
  userId: string;
  mime: unknown;
  size: unknown;
}): Promise<SignedCustomerUpload | null> {
  if (!isMime(input.mime)) return null;
  const size = Number(input.size);
  if (!Number.isFinite(size) || size <= 0 || size > CUSTOMER_UPLOAD_MAX_BYTES) return null;
  const path = `${customerUploadPrefix(input.storeId, input.userId)}${randomUUID()}.${CUSTOMER_UPLOAD_TYPES[input.mime]}`;
  const { data, error } = await getServiceClient().storage.from(CUSTOMER_UPLOAD_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[customer-uploads] sign failed", error?.message);
    return null;
  }
  return { path, token: data.token };
}

/**
 * Every path exists and is an allowed image within the size limit (the bucket
 * enforces both too; this is the server-side check before a cart line keeps it).
 */
export async function customerUploadsAreValid(paths: readonly string[]): Promise<boolean> {
  if (!paths.length) return true;
  const storage = getServiceClient().storage.from(CUSTOMER_UPLOAD_BUCKET);
  const checks = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await storage.info(path);
      if (error || !data) return false;
      const size = Number((data as { size?: number }).size ?? data.metadata?.size ?? 0);
      const type = (data as { contentType?: string }).contentType ?? data.metadata?.mimetype;
      return size > 0 && size <= CUSTOMER_UPLOAD_MAX_BYTES && isMime(type);
    }),
  );
  return checks.every(Boolean);
}

/** Short-lived view links (default 10 minutes) for paths the caller already authorised. */
export async function signCustomerUploadViews(paths: readonly string[], seconds = 600): Promise<Record<string, string>> {
  const unique = [...new Set(paths)].slice(0, 100);
  if (!unique.length) return {};
  const { data, error } = await getServiceClient().storage.from(CUSTOMER_UPLOAD_BUCKET).createSignedUrls(unique, seconds);
  if (error || !data) {
    console.error("[customer-uploads] view sign failed", error?.message);
    return {};
  }
  const out: Record<string, string> = {};
  for (const row of data) if (row.path && row.signedUrl && !row.error) out[row.path] = row.signedUrl;
  return out;
}

/** A download link (Content-Disposition: attachment) for one authorised path. */
export async function signCustomerUploadDownload(path: string, fileName: string): Promise<string | null> {
  const { data, error } = await getServiceClient().storage.from(CUSTOMER_UPLOAD_BUCKET).createSignedUrl(path, 300, { download: fileName });
  return error || !data ? null : data.signedUrl;
}

/**
 * Cron cleanup: uploads older than 7 days that no order item and no cart line
 * holds. Idempotent (a second run finds nothing), at most `limit` per run.
 */
export async function deleteStaleCustomerUploads(limit = 200): Promise<{ deleted: number }> {
  const rows = await db.execute<{ name: string }>(sql`
    SELECT o.name
    FROM storage.objects o
    WHERE o.bucket_id = ${CUSTOMER_UPLOAD_BUCKET}
      AND o.created_at < now() - make_interval(days => ${CUSTOMER_UPLOAD_KEEP_DAYS})
      AND NOT EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.customer_inputs IS NOT NULL
          AND oi.created_at >= o.created_at
          AND jsonb_path_exists(oi.customer_inputs, '$.lines[*].files[*] ? (@ == $p)', jsonb_build_object('p', o.name))
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.cart_items ci
        WHERE ci.customer_inputs IS NOT NULL
          AND jsonb_path_exists(ci.customer_inputs, '$.lines[*].files[*] ? (@ == $p)', jsonb_build_object('p', o.name))
      )
    ORDER BY o.created_at
    LIMIT ${limit}
  `);
  const names = (Array.isArray(rows) ? rows : ((rows as { rows?: { name: string }[] }).rows ?? [])).map((row) => row.name);
  if (!names.length) return { deleted: 0 };
  const { error } = await getServiceClient().storage.from(CUSTOMER_UPLOAD_BUCKET).remove(names);
  if (error) {
    console.error("[customer-uploads] cleanup failed", error.message);
    return { deleted: 0 };
  }
  return { deleted: names.length };
}
