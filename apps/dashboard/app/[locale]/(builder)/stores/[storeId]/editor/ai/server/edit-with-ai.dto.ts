import { z } from "zod";
import type { ConfirmCard } from "@workspace/agent";
import { BULK_LIMITS } from "@/app/[locale]/(main)/stores/[storeId]/products/add/from-file/from-file.dto";

/**
 * Inputs and results of "Edit with AI" (owner request 2026-11-26): the
 * website editor's chat page that changes the site's drafts and, through the
 * store agent's confirm cards, products, settings and shipping. Every input
 * is parsed here and never trusted (attachment paths are checked again
 * against the session seller on the server).
 */

export const EDIT_WITH_AI_LIMITS = {
  message: 2000,
  attachments: 6,
  history: 8,
  historyText: 2000,
  /** The media library's own limit (`MEDIA_MAX_BYTES`, the bucket's). */
  imageBytes: 5 * 1024 * 1024,
  /** The from-file import's own limit: a bigger file would only fail there. */
  fileBytes: BULK_LIMITS.maxFileBytes,
  fileName: 200,
} as const;

export const EDIT_AI_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type EditAiImageType = (typeof EDIT_AI_IMAGE_TYPES)[number];

/** Products files the from-file import reads, by extension, with the types a browser may send for them. */
export const EDIT_AI_FILE_TYPES = {
  csv: ["text/csv", "text/plain", "application/vnd.ms-excel", ""],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ""],
  xls: ["application/vnd.ms-excel", ""],
  pdf: ["application/pdf", ""],
} as const;
export type EditAiFileExt = keyof typeof EDIT_AI_FILE_TYPES;

/** The content type each file is stored with (the bucket's allowed list, 0182). */
export const EDIT_AI_FILE_CONTENT_TYPES: Record<EditAiFileExt, string> = {
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pdf: "application/pdf",
};

const locale = z.enum(["ar", "en"]);
const path = z.string().min(1).max(200);

export const editWithAiAttachmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("image"), path }).strict(),
  z.object({ kind: z.literal("file"), path, name: z.string().trim().max(EDIT_WITH_AI_LIMITS.fileName).optional() }).strict(),
]);
export type EditWithAiAttachment = z.infer<typeof editWithAiAttachmentSchema>;

export const editWithAiInputSchema = z
  .object({
    message: z.string().trim().min(1).max(EDIT_WITH_AI_LIMITS.message),
    /** The seller's dashboard language (replies and summaries). */
    uiLocale: locale,
    /** The page to edit; the home page when left out. */
    pageId: z.uuid().optional(),
    history: z
      .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(EDIT_WITH_AI_LIMITS.historyText) }).strict())
      .max(EDIT_WITH_AI_LIMITS.history)
      .default([]),
    attachments: z.array(editWithAiAttachmentSchema).max(EDIT_WITH_AI_LIMITS.attachments).default([]),
  })
  .strict();
export type EditWithAiInput = z.input<typeof editWithAiInputSchema>;

export const editWithAiUploadsInputSchema = z
  .object({
    files: z
      .array(
        z
          .object({
            kind: z.enum(["image", "file"]),
            type: z.string().max(120),
            size: z.number().int().min(1),
            name: z.string().trim().min(1).max(EDIT_WITH_AI_LIMITS.fileName),
          })
          .strict(),
      )
      .min(1)
      .max(EDIT_WITH_AI_LIMITS.attachments),
  })
  .strict();
export type EditWithAiUploadsInput = z.input<typeof editWithAiUploadsInputSchema>;

export const actionIdSchema = z.string().regex(/^act_[A-Za-z0-9_-]{20,40}$/);
export const undoTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22,64}$/);

export type EditWithAiError =
  | "notFound"
  | "readOnly"
  | "aiUnavailable"
  | "rateLimited"
  | "invalidInput"
  | "attachmentInvalid"
  | "aiDailyLimit"
  | "aiNoCredits"
  | "aiFailed"
  | "draftChanged"
  | "undoExpired"
  | "actionExpired"
  | "actionRunning"
  | "actionFailed"
  | "uploadUnavailable"
  | "generic";

export type EditWithAiResult<T> = { success: true; data: T } | { success: false; error: EditWithAiError };

export type EditWithAiRoute = "site" | "products" | "settings" | "shipping" | "design" | "import" | "none";

export type EditWithAiTarget = { kind: "page"; pageId: string; sectionId?: string } | { kind: "header" | "footer" };

export type EditWithAiProposal = {
  actionId: string;
  tool: string;
  skill: string;
  /** i18n keys under `agent.card.*` with their params. */
  card: ConfirmCard;
  /** AI credits charged when the seller confirms it. */
  credits: number;
  expiresAt: string;
};

export type EditWithAiCard = {
  kind: "import_products";
  /** The attached file (its stored path, owned by the seller); the from-file page opens with it. */
  fileRef: string;
  fileName: string;
  /** Dashboard path (no locale) of the from-file import with this file preloaded. */
  href: string;
};

export type EditWithAiTurnView = {
  reply: string;
  route: EditWithAiRoute;
  /** What a site turn saved to the drafts; null when nothing was saved. */
  siteChanges: {
    target: EditWithAiTarget;
    lines: string[];
    undoToken: string;
    /** A fresh "preview on my store" link for the drafts as saved (null when previews are off). */
    previewUrl: string | null;
  } | null;
  /** Store changes waiting for the seller's Confirm (nothing is written before). */
  proposals: EditWithAiProposal[];
  cards: EditWithAiCard[];
  /** Ops or proposals that were refused, by code only. */
  rejected: { code: string; index?: number; tool?: string }[];
  creditsUsed: number;
};

export type EditWithAiUpload = {
  kind: "image" | "file";
  /** The path to send back as the attachment's `path`. */
  path: string;
  /** Bucket and token for `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)`. */
  bucket: string;
  token: string;
  /** Images: their public media URL once uploaded. */
  url?: string;
};
