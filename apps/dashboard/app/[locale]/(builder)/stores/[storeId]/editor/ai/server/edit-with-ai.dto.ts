import { z } from "zod";
import type { ConfirmCard } from "@workspace/agent";
import type { AgentTarget, SectionOp } from "@workspace/store-sections/agent";
import { BULK_LIMITS } from "@/app/[locale]/(main)/stores/[storeId]/products/add/from-file/from-file.dto";

/**
 * Inputs and results of "Edit with AI" (owner request 2026-11-26): the chat
 * of the website editor's AI layout. A site turn answers with validated ops
 * the editor applies to its drafts (the server writes nothing); products,
 * settings and shipping go through the store agent's confirm cards. Every
 * input is parsed here and never trusted (the page, the selected section and
 * the attachment paths are checked again against the session seller's store
 * on the server).
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
const sectionId = z.string().regex(/^[A-Za-z0-9_:-]{1,64}$/);

/** The section selected on the canvas (or the header or footer): ids only, checked against the saved drafts. */
export const editWithAiTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("page"), sectionId }).strict(),
  z.object({ kind: z.enum(["header", "footer"]) }).strict(),
]);
export type EditWithAiTargetInput = z.infer<typeof editWithAiTargetSchema>;

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
    /** The page to edit (the one active in the editor); the home page when left out. */
    pageId: z.uuid().optional(),
    /** The section the seller selected on the canvas; a site turn then edits it. */
    target: editWithAiTargetSchema.optional(),
    /** The language the canvas shows; the store's default language when it isn't one of the store's. */
    contentLocale: locale.optional(),
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
  | "actionExpired"
  | "actionRunning"
  | "actionFailed"
  | "uploadUnavailable"
  | "generic";

export type EditWithAiResult<T> = { success: true; data: T } | { success: false; error: EditWithAiError };

/**
 * What a turn did. "advice" answers a question about the website (no ops, no
 * credit); "help" is code's answer to something this chat can't do, with
 * links to the page that does it (no model).
 */
export type EditWithAiRoute = "site" | "products" | "settings" | "shipping" | "design" | "import" | "advice" | "help" | "none";

/** Things the chat can't do; each has a dashboard page (`OUT_OF_REACH` in the lib) and a label (`editWithAi.links.*`). */
export const OUT_OF_REACH_KEYS = ["pages", "coupons", "discounts", "domain", "payments", "orders", "apps", "blog"] as const;
export type OutOfReachKey = (typeof OUT_OF_REACH_KEYS)[number];

/** A dashboard page that does what the chat couldn't. `href` is built by the server (no locale). */
export type EditWithAiLink = { key: OutOfReachKey; href: string };

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
  /**
   * A site turn's changes for the editor to apply to its drafts as one undo
   * step (`applyAgentTurn`); nothing was written. Null when no op applied.
   */
  siteChanges: {
    pageId: string;
    target: AgentTarget;
    /** The ops, in order, already validated and normalised against the saved drafts. */
    ops: SectionOp[];
    /** One line per op, in the seller's dashboard language. */
    applied: string[];
    /** Canvas previews of the code elements the ops wrote, by code node id (html cleaned, css scoped). */
    previews: Record<string, { html: string; css: string; props: Record<string, unknown> }>;
    contentLocale: "ar" | "en";
  } | null;
  /** Store changes waiting for the seller's Confirm (nothing is written before). */
  proposals: EditWithAiProposal[];
  cards: EditWithAiCard[];
  /** Up to 3 short follow-up requests the seller can tap (cleaned and capped by the server). */
  suggestions: string[];
  /** Where to do what the chat couldn't (at most 2). */
  links: EditWithAiLink[];
  /** Ops or proposals that were refused, by code only. */
  rejected: { code: string; index?: number; tool?: string }[];
  creditsUsed: number;
  /** AI credits the seller has left after this turn; null when unknown or credits don't apply (before the USD switch). */
  creditsRemaining: number | null;
};

export type EditWithAiConfirmView = { tool: string; result: unknown; creditsUsed: number; creditsRemaining: number | null };

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
