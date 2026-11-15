import { z } from "zod";

/**
 * Bulk product editing (ROADMAP.md F-24a/F-24b): one change applied to many of
 * the seller's products and their variants. The client sends only product ids
 * and the change; every value written is computed on the server from the rows
 * it reads (scoped by the session's seller).
 */

/** Most products one bulk edit may touch (the products list loads them all). */
export const BULK_EDIT_MAX_PRODUCTS = 500;
/** How long the Undo of a bulk edit stays available. */
export const BULK_EDIT_UNDO_MS = 10 * 60 * 1000;

const money = z.number().finite().positive().max(1_000_000);

export const bulkChangeSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("price"),
    mode: z.enum(["percent", "amount"]),
    direction: z.enum(["increase", "decrease"]),
    value: money,
    /** Round each new price to whole pounds (default on in the UI). */
    roundWhole: z.boolean().default(true),
  }),
  z.object({
    kind: z.literal("discount"),
    /** "none" removes the discount (sale price back to the regular price). */
    mode: z.enum(["percent", "amount", "none"]),
    value: z.number().finite().min(0).max(1_000_000).default(0),
    /** ISO date-time the discount countdown ends at; null = no end date. */
    endsAt: z.string().datetime({ offset: true }).nullable().default(null),
    roundWhole: z.boolean().default(true),
  }),
  z.object({
    kind: z.literal("stock"),
    mode: z.enum(["set", "add", "subtract"]),
    value: z.number().int().min(0).max(1_000_000),
  }),
  z.object({
    kind: z.literal("status"),
    publish: z.boolean(),
  }),
]).superRefine((change, ctx) => {
  if (change.kind === "price" && change.mode === "percent" && change.value > 1000) {
    ctx.addIssue({ code: "custom", message: "percentTooHigh", path: ["value"] });
  }
  if (change.kind === "discount" && change.mode === "percent" && (change.value < 1 || change.value > 99)) {
    ctx.addIssue({ code: "custom", message: "discountPercentRange", path: ["value"] });
  }
  if (change.kind === "discount" && change.mode === "amount" && change.value <= 0) {
    ctx.addIssue({ code: "custom", message: "discountAmountRequired", path: ["value"] });
  }
});

export type BulkChange = z.infer<typeof bulkChangeSchema>;
export type BulkChangeInput = z.input<typeof bulkChangeSchema>;

export const bulkEditInputSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(BULK_EDIT_MAX_PRODUCTS),
  change: bulkChangeSchema,
});

export type BulkEditInput = z.input<typeof bulkEditInputSchema>;

/** Why a selected product is left out of the change. */
export type BulkSkipReason =
  | "rejected"
  | "needsImage"
  | "cannotPublish"
  | "priceTooLow"
  | "discountTooHigh"
  | "noPrice"
  | "notFound";

export type BulkPreviewLine = {
  /** Variant title, or null for the product itself. */
  label: string | null;
  field: "price" | "stock" | "status";
  before: number | string;
  after: number | string;
  /** Regular (strikethrough) price, when the line is a price with a discount. */
  beforeList?: number | null;
  afterList?: number | null;
};

export type BulkPreviewRow = {
  id: string;
  title: string;
  outcome: "change" | "same" | "skip";
  reason?: BulkSkipReason;
  lines: BulkPreviewLine[];
};

export type BulkActionError = "unauthorized" | "readOnly" | "invalidInput" | "expired" | "generic";

export type BulkPreviewResult =
  | { success: true; rows: BulkPreviewRow[]; changeCount: number; skipCount: number }
  | { success: false; error: BulkActionError };

export type BulkApplyResult =
  | {
      success: true;
      changed: number;
      skipped: number;
      /** Server-signed Undo token (10 minutes), null when nothing changed. */
      undoToken: string | null;
      undoExpiresAt: number | null;
    }
  | { success: false; error: BulkActionError };

export type BulkUndoResult =
  | { success: true; restored: number; conflicts: number }
  | { success: false; error: BulkActionError };
