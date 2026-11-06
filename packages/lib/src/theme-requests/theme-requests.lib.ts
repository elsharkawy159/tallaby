/**
 * "Request a theme" (ROADMAP.md F-77, migration 0156). Pure: limits, input
 * validation, image paths, and what an admin status change triggers (seller
 * bell + push, email). Server functions are in `./server`.
 *
 * A built theme goes into the normal code-only gallery for everyone (CLAUDE.md
 * rule 17); a request only tracks its status and the admin's reply.
 */
import { z } from "zod";

export const THEME_REQUEST_STATUSES = ["new", "in_progress", "ready", "declined"] as const;
export type ThemeRequestStatus = (typeof THEME_REQUEST_STATUSES)[number];

/** Not ready or declined yet: counts toward the seller's limit. */
export const OPEN_THEME_REQUEST_STATUSES = ["new", "in_progress"] as const satisfies readonly ThemeRequestStatus[];
/** A seller can have this many open requests at a time (owner, 2026-11-06). */
export const MAX_OPEN_THEME_REQUESTS = 3;

export const THEME_REQUEST_BUCKET = "theme-request-images";
export const THEME_REQUEST_MAX_IMAGES = 3;
export const THEME_REQUEST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const THEME_REQUEST_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ThemeRequestImageType = (typeof THEME_REQUEST_IMAGE_TYPES)[number];

/** Same caps as the 0156 CHECK constraints. */
export const THEME_REQUEST_URL_MAX = 500;
export const THEME_REQUEST_DESCRIPTION_MAX = 2000;
export const THEME_REQUEST_NOTE_MAX = 1000;
export const THEME_REQUEST_REPLY_MAX = 2000;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_RE = new RegExp(`^${UUID}$`, "i");

const IMAGE_EXT: Record<ThemeRequestImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isOpenThemeRequest(status: string): boolean {
  return (OPEN_THEME_REQUEST_STATUSES as readonly string[]).includes(status);
}

export function isThemeRequestStatus(value: unknown): value is ThemeRequestStatus {
  return typeof value === "string" && (THEME_REQUEST_STATUSES as readonly string[]).includes(value);
}

/**
 * A public https address: no other scheme, no user:password, a dotted host,
 * no whitespace, within the length cap.
 */
export function isHttpsUrl(value: string): boolean {
  if (value.length > THEME_REQUEST_URL_MAX || /\s/.test(value)) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname;
  return host.includes(".") && !host.startsWith(".") && !host.endsWith(".");
}

/** Why a file can't be attached, or null when it can. Checked in the browser and again when signing. */
export function themeRequestImageProblem(file: { type: string; size: number }): "type" | "size" | null {
  if (!(THEME_REQUEST_IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > THEME_REQUEST_IMAGE_MAX_BYTES) return "size";
  return null;
}

/** `<sellerId>/<fileId>.<ext>` for a new image, or null for an unsupported type or bad ids. */
export function buildThemeRequestImagePath(sellerId: string, fileId: string, mimeType: string): string | null {
  const ext = IMAGE_EXT[mimeType as ThemeRequestImageType];
  if (!ext || !UUID_RE.test(sellerId) || !UUID_RE.test(fileId)) return null;
  return `${sellerId.toLowerCase()}/${fileId.toLowerCase()}.${ext}`;
}

/** Only images in the seller's own folder, in the shape buildThemeRequestImagePath makes. */
export function isOwnThemeRequestImagePath(sellerId: string, path: unknown): path is string {
  if (typeof path !== "string" || !UUID_RE.test(sellerId)) return false;
  return new RegExp(`^${sellerId.toLowerCase()}/${UUID}\\.(jpg|png|webp)$`).test(path);
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max * 2)
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => value === null || value.length <= max, { message: "too_long" });

/** What the seller sends from the dialog. `storeId` is re-checked against the session on the server. */
export const themeRequestInputSchema = z
  .object({
    storeId: z.string().regex(UUID_RE),
    referenceUrl: optionalText(THEME_REQUEST_URL_MAX).refine((value) => value === null || isHttpsUrl(value), {
      message: "invalid_url",
    }),
    description: optionalText(THEME_REQUEST_DESCRIPTION_MAX),
    note: optionalText(THEME_REQUEST_NOTE_MAX),
    imagePaths: z
      .array(z.string().max(200))
      .max(THEME_REQUEST_MAX_IMAGES, { message: "too_many_images" })
      .default([])
      .transform((paths) => [...new Set(paths)]),
  })
  .superRefine((value, ctx) => {
    if (!value.referenceUrl && value.imagePaths.length === 0 && !value.description) {
      ctx.addIssue({ code: "custom", message: "empty", path: ["description"] });
    }
  });

export type ThemeRequestInput = z.input<typeof themeRequestInputSchema>;
export type ThemeRequestParsedInput = z.output<typeof themeRequestInputSchema>;

/** What an admin sends from the detail view. */
export const themeRequestUpdateSchema = z.object({
  requestId: z.string().regex(UUID_RE),
  status: z.enum(THEME_REQUEST_STATUSES),
  reply: optionalText(THEME_REQUEST_REPLY_MAX),
});
export type ThemeRequestUpdateInput = z.input<typeof themeRequestUpdateSchema>;

/** Statuses the seller hears about (bell + push). */
export const NOTIFIED_THEME_REQUEST_STATUSES = ["in_progress", "ready", "declined"] as const satisfies readonly ThemeRequestStatus[];
/** Statuses that also send an email. */
export const EMAILED_THEME_REQUEST_STATUSES = ["ready", "declined"] as const satisfies readonly ThemeRequestStatus[];
export type EmailedThemeRequestStatus = (typeof EMAILED_THEME_REQUEST_STATUSES)[number];

export type ThemeRequestUpdatePlan = {
  /** Something to write at all (status or reply changed). */
  changed: boolean;
  statusChanged: boolean;
  /** Write a `theme_request_updated` seller bell row. */
  notify: boolean;
  /** Ask the backend for the ready/declined email. The backend's claim still sends it once per status. */
  email: EmailedThemeRequestStatus | null;
};

/**
 * What an admin's save does. The seller hears about a status change only
 * (to in progress, ready or declined); a reply-only edit just shows on the
 * seller's list. Saving the same status again sends nothing.
 */
export function planThemeRequestUpdate(
  current: { status: string; adminReply: string | null },
  next: { status: ThemeRequestStatus; reply: string | null },
): ThemeRequestUpdatePlan {
  const statusChanged = current.status !== next.status;
  const replyChanged = (current.adminReply ?? null) !== (next.reply ?? null);
  const notify = statusChanged && (NOTIFIED_THEME_REQUEST_STATUSES as readonly string[]).includes(next.status);
  const email =
    statusChanged && (EMAILED_THEME_REQUEST_STATUSES as readonly string[]).includes(next.status)
      ? (next.status as EmailedThemeRequestStatus)
      : null;
  return { changed: statusChanged || replyChanged, statusChanged, notify, email };
}

export const THEME_REQUEST_NOTIFICATION_TYPE = "theme_request_updated" as const;

/**
 * The seller bell row for a status change. The dedupe key holds the status,
 * so the same status never notifies twice (even after going back and forth).
 */
export function themeRequestNotification(request: {
  id: string;
  sellerId: string;
  storeId: string | null;
  status: ThemeRequestStatus;
}): {
  sellerId: string;
  storeId: string | null;
  type: typeof THEME_REQUEST_NOTIFICATION_TYPE;
  data: Record<string, string>;
  dedupeKey: string;
} {
  return {
    sellerId: request.sellerId,
    storeId: request.storeId,
    type: THEME_REQUEST_NOTIFICATION_TYPE,
    data: { requestId: request.id, status: request.status, ...(request.storeId ? { storeId: request.storeId } : {}) },
    dedupeKey: `${THEME_REQUEST_NOTIFICATION_TYPE}:${request.id.toLowerCase()}:${request.status}`,
  };
}

/** Where the seller's bell row leads: the Templates page of the store asked from, else the store list. */
export function themeRequestsPath(storeId: string | null | undefined): string {
  return storeId && UUID_RE.test(storeId) ? `/stores/${storeId}/website/templates#theme-requests` : "/stores";
}

/** The seller's list (no image paths: the seller only sees how many were attached). */
export type SellerThemeRequestView = {
  id: string;
  status: ThemeRequestStatus;
  referenceUrl: string | null;
  description: string | null;
  note: string | null;
  imageCount: number;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
};
