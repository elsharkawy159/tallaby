import { randomUUID } from "node:crypto";
import { getServiceClient } from "@workspace/db/supabase/service";
import type { ProductImageUploader } from "@workspace/lib/products/agent/server";
import { MEDIA_BUCKET, buildMediaPath, checkMediaPath, mediaPublicUrl } from "@workspace/lib/media";
import { recordMediaAsset } from "@workspace/lib/media/server";
import { imageTypeOf } from "@/app/[locale]/(main)/ai-builder/builder-upload.lib";
import { mediaPathOf } from "../../server/agent-images.server";
import {
  EDIT_AI_FILE_CONTENT_TYPES,
  EDIT_AI_FILE_TYPES,
  EDIT_AI_IMAGE_TYPES,
  EDIT_WITH_AI_LIMITS,
  type EditAiFileExt,
  type EditWithAiAttachment,
  type EditWithAiUpload,
  type EditWithAiUploadsInput,
} from "./edit-with-ai.dto";
import { editAiFilePath, fileBytesMatch, fileExtOf, isOwnEditAiFilePath } from "./edit-with-ai.lib";

/**
 * Storage of "Edit with AI" attachments. Server only; the seller and store
 * are the session's, checked by the action before any call here.
 *
 * - Photos go into the store's media library (`store-media`,
 *   `<seller>/<store>/<uuid>.<ext>`) and are recorded as media rows the way
 *   the media panel records them, so they show in the manual editor too.
 * - Products files go into the private `edit-with-ai-files` bucket (0182),
 *   `<seller>/<store>/<uuid>.<ext>`, which the from-file import opens through
 *   a short-lived signed link.
 *
 * Every path is built here and checked again against the session seller and
 * store on use; the real type comes from the first bytes, never the client.
 */

export const EDIT_AI_FILES_BUCKET = "edit-with-ai-files";

const supabaseUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");

export type SignUploadsResult = { ok: true; uploads: EditWithAiUpload[] } | { ok: false; error: "invalid" | "unavailable" };

/** One signed upload per file, for paths made here. Nothing is written until the browser uploads. */
export async function signEditWithAiUploads(sellerId: string, storeId: string, files: EditWithAiUploadsInput["files"]): Promise<SignUploadsResult> {
  const planned: { kind: "image" | "file"; bucket: string; path: string }[] = [];
  for (const file of files) {
    if (file.kind === "image") {
      if (!(EDIT_AI_IMAGE_TYPES as readonly string[]).includes(file.type) || file.size > EDIT_WITH_AI_LIMITS.imageBytes) return { ok: false, error: "invalid" };
      planned.push({ kind: "image", bucket: MEDIA_BUCKET, path: buildMediaPath(sellerId, storeId, file.type) });
    } else {
      const ext = fileExtOf(file.name);
      if (!ext || !(EDIT_AI_FILE_TYPES[ext] as readonly string[]).includes(file.type) || file.size > EDIT_WITH_AI_LIMITS.fileBytes) return { ok: false, error: "invalid" };
      planned.push({ kind: "file", bucket: EDIT_AI_FILES_BUCKET, path: editAiFilePath(sellerId, storeId, ext, randomUUID()) });
    }
  }
  const storage = getServiceClient().storage;
  const uploads: EditWithAiUpload[] = [];
  for (const item of planned) {
    const { data, error } = await storage.from(item.bucket).createSignedUploadUrl(item.path);
    // A missing files bucket (0182 not applied yet) only turns files off.
    if (error || !data) {
      console.error("[edit-with-ai] sign failed", { bucket: item.bucket });
      return { ok: false, error: item.kind === "file" ? "unavailable" : "invalid" };
    }
    uploads.push({
      kind: item.kind,
      path: item.path,
      bucket: item.bucket,
      token: data.token,
      ...(item.kind === "image" && { url: mediaPublicUrl(supabaseUrl(), item.path) }),
    });
  }
  return { ok: true, uploads };
}

async function readObject(bucket: string, path: string, maxBytes: number): Promise<Uint8Array | null> {
  const { data, error } = await getServiceClient().storage.from(bucket).download(path);
  if (error || !data) return null;
  if (data.size > maxBytes) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export type VerifiedImage = { path: string; src: string; label: string };
export type VerifiedFile = { path: string; ext: EditAiFileExt; name: string };

export type VerifyResult = { ok: true; images: VerifiedImage[]; files: VerifiedFile[]; recorded: boolean } | { ok: false };

/**
 * Checks each attachment is this seller's and this store's, uploaded, within
 * its size, and really the type it claims (first bytes). Photos are recorded
 * in the media library (idempotent: a photo already there keeps its row).
 */
export async function verifyEditWithAiAttachments(sellerId: string, storeId: string, attachments: readonly EditWithAiAttachment[]): Promise<VerifyResult> {
  const images: VerifiedImage[] = [];
  const files: VerifiedFile[] = [];
  let recorded = false;
  for (const attachment of attachments) {
    if (attachment.kind === "image") {
      // The session seller's folder, and this store or shared (never another store of theirs).
      if (checkMediaPath(attachment.path, sellerId, storeId) !== null) return { ok: false };
      const bytes = await readObject(MEDIA_BUCKET, attachment.path, EDIT_WITH_AI_LIMITS.imageBytes);
      const type = bytes ? imageTypeOf(bytes) : null;
      if (!type || !(EDIT_AI_IMAGE_TYPES as readonly string[]).includes(type)) return { ok: false };
      const row = await recordMediaAsset(sellerId, storeId, { storagePath: attachment.path, filename: `ai-chat-photo.${attachment.path.split(".").pop()}` });
      if (!row.success) return { ok: false };
      recorded = true;
      images.push({ path: attachment.path, src: mediaPublicUrl(supabaseUrl(), attachment.path), label: `photo ${images.length + 1} (uploaded now)` });
    } else {
      if (!isOwnEditAiFilePath(attachment.path, sellerId, storeId)) return { ok: false };
      const ext = fileExtOf(attachment.path)!;
      const bytes = await readObject(EDIT_AI_FILES_BUCKET, attachment.path, EDIT_WITH_AI_LIMITS.fileBytes);
      if (!bytes || !fileBytesMatch(ext, bytes)) return { ok: false };
      const name = (attachment.name ?? "").replace(/[^\p{L}\p{N} ._()-]/gu, "").trim().slice(0, 120);
      files.push({ path: attachment.path, ext, name: name && fileExtOf(name) === ext ? name : `products.${ext}` });
    }
  }
  return { ok: true, images, files, recorded };
}

/** A short-lived signed link to the seller's own attached products file, for the from-file page to read in the browser. */
export async function signEditWithAiFileLink(sellerId: string, storeId: string, path: string): Promise<{ url: string; name: string; type: string } | null> {
  if (!isOwnEditAiFilePath(path, sellerId, storeId)) return null;
  const ext = fileExtOf(path)!;
  const { data, error } = await getServiceClient().storage.from(EDIT_AI_FILES_BUCKET).createSignedUrl(path, 120);
  if (error || !data?.signedUrl) return null;
  return { url: data.signedUrl, name: `products.${ext}`, type: EDIT_AI_FILE_CONTENT_TYPES[ext] };
}

/**
 * The products skill's photo uploader for this chat: only a photo of THIS
 * seller's and store's media library (by its public URL), copied from Storage
 * (no web fetch, so no SSRF) into the `products` bucket the way the dashboard
 * stores product photos (`<seller>/<YYYY-MM-DD>/<uuid>.<ext>`).
 */
export function mediaProductImageUploader(sellerId: string, storeId: string): ProductImageUploader {
  return async (url) => {
    const path = mediaPathOf(url);
    if (!path || checkMediaPath(path, sellerId, storeId) !== null) return { ok: false, reason: "only photos from this store's media can be used" };
    const bytes = await readObject(MEDIA_BUCKET, path, EDIT_WITH_AI_LIMITS.imageBytes).catch(() => null);
    const type = bytes ? imageTypeOf(bytes) : null;
    if (!bytes || !type) return { ok: false, reason: "is not a JPEG, PNG or WebP image up to 5 MB" };
    const ext = type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
    const target = `${sellerId.toLowerCase()}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const { data, error } = await getServiceClient().storage.from("products").upload(target, bytes, { contentType: type, cacheControl: "31536000", upsert: false });
    if (error || !data?.path) return { ok: false, reason: "could not be stored" };
    return { ok: true, path: data.path };
  };
}
