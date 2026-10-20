"use server";

import { db, sql } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { getServiceClient } from "@workspace/db/supabase/service";
import { MEDIA_MAX_BYTES } from "@workspace/lib/media";
import { assertAdminActor } from "@workspace/lib/admin/server";
import type { MediaAssetView, MediaErrorKey, MediaResult } from "@workspace/store-editor/media/media.dto";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { LIBRARY_MEDIA_BUCKET, isLibraryMediaPath, libraryMediaPath, libraryMediaUrl, mimeMatchesLibraryPath } from "./library-media.lib";

/**
 * Uploads into the public `library-media` bucket (0086) for library sections
 * (Task 11) and templates (Task 15). The admin's session cannot write there
 * (no storage policies): the server makes a fresh `library/<uuid>.<ext>` path,
 * signs a one-time upload for exactly that path with the service role (the
 * key never leaves the server), and records the upload by checking the stored
 * object's own size and type. There is no library listing: editing is
 * upload-only. Admin / super_admin only (re-checked in the database).
 */

const uploadLimiter = createRateLimiter({ limit: 120, windowMs: 10 * 60_000 });

const fail = <T,>(error: MediaErrorKey): MediaResult<T> => ({ success: false, error });

async function withAdmin<T>(label: string, run: (actorId: string) => Promise<MediaResult<T>>): Promise<MediaResult<T>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("notFound");
  try {
    await assertAdminActor(db, actorId);
    if (!uploadLimiter.check(`library-media:${actorId}`)) return fail("rateLimited");
    return await run(actorId);
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "not_admin") return fail("notFound");
    logServerError("admin", `library media ${label} failed`, {}, error);
    return fail("generic");
  }
}

/** A fresh object path for one image of type `mime`. */
export async function createLibraryUploadPath(mime: string): Promise<MediaResult<string>> {
  return withAdmin("path", async () => {
    const path = libraryMediaPath(mime);
    return path ? { success: true, data: path } : fail("invalidType");
  });
}

/** A one-time signed upload for a path from createLibraryUploadPath. */
export async function createLibrarySignedUpload(path: string): Promise<MediaResult<{ path: string; token: string }>> {
  return withAdmin("sign", async () => {
    if (!isLibraryMediaPath(path)) return fail("invalidPath");
    const { data, error } = await getServiceClient().storage.from(LIBRARY_MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(`signed upload failed: ${error?.message ?? "no data"}`);
    return { success: true, data: { path: data.path, token: data.token } };
  });
}

/**
 * Checks an uploaded object (it exists, is at most 5 MB and its type fits the
 * extension; a rejected one is removed again) and returns it as an asset the
 * editor can use: its public URL becomes the image's fixed `src`.
 */
export async function recordLibraryUpload(input: {
  storagePath: string;
  filename?: string;
  width?: number | null;
  height?: number | null;
}): Promise<MediaResult<MediaAssetView>> {
  return withAdmin("record", async () => {
    const path = input?.storagePath;
    if (!isLibraryMediaPath(path)) return fail("invalidPath");
    const [object] = await db.execute<{ size: string | null; mimetype: string | null; created_at: string | null }>(sql`
      SELECT metadata->>'size' AS size, metadata->>'mimetype' AS mimetype, created_at::text AS created_at
      FROM storage.objects
      WHERE bucket_id = ${LIBRARY_MEDIA_BUCKET} AND name = ${path}
      LIMIT 1
    `);
    if (!object) return fail("objectMissing");
    const bytes = Number(object.size);
    const problem: MediaErrorKey | null =
      !Number.isFinite(bytes) || bytes < 0 ? "objectMissing" : bytes > MEDIA_MAX_BYTES ? "tooLarge" : !mimeMatchesLibraryPath(object.mimetype, path) ? "invalidType" : null;
    if (problem) {
      const { error } = await getServiceClient().storage.from(LIBRARY_MEDIA_BUCKET).remove([path]);
      if (error) console.error("[library-media] discard failed", error.message);
      return fail(problem);
    }
    const size = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value > 0 && value < 100_000 ? value : null);
    return {
      success: true,
      data: {
        id: path,
        storeId: null,
        folderId: null,
        storagePath: path,
        url: libraryMediaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", path),
        filename: String(input.filename ?? "image").slice(0, 200),
        mimeType: object.mimetype ?? "",
        bytes,
        width: size(input.width),
        height: size(input.height),
        altText: {},
        createdAt: object.created_at ?? new Date().toISOString(),
        usage: 0,
      },
    };
  });
}
