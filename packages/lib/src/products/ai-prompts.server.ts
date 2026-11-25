import { and, db, desc, eq, gt, isNull, productAiPrompts, products, sql } from "@workspace/db";
import { AUTOFILL_LIMITS } from "./autofill/autofill.dto";

/**
 * The prompt behind an AI product fill (0181, owner 2026-11-26), for
 * Admin › Products › <product>. Server-only. The autofill routes record what
 * was typed after a successful call; saving the product links the seller and
 * store's unlinked rows of the last day to it. Only the trimmed text and file
 * counts are kept, never the photos, the PDF or an edit's current listing.
 *
 * Every function is best-effort: it never throws into the caller (the AI
 * answer and the product save must not depend on it), tolerates the table
 * being absent (before 0181 is applied), and logs one short line without the
 * prompt text. Callers pass a seller and store they already checked against
 * the session (CLAUDE.md rule 5); every query filters on both.
 */

export type AutofillPromptMode = "add" | "edit";
export type AutofillPromptSource = "seller" | "admin";

/** Same window as markProductAiAssisted: the form is filled and saved in one sitting. */
export const AI_PROMPT_LINK_WINDOW_MS = 24 * 60 * 60 * 1000;
export const AI_PROMPT_LIST_LIMIT = 20;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);
const isMode = (value: unknown): value is AutofillPromptMode => value === "add" || value === "edit";

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.cause?.code ?? e?.code;
}

function logFailure(scope: string, error: unknown) {
  // 42P01: 0181 not applied yet. Quiet, expected until the migration lands.
  if (pgErrorCode(error) === "42P01") return;
  console.error(`[ai-prompts] ${scope} failed`, pgErrorCode(error) ?? (error instanceof Error ? error.name : "error"));
}

/** The seller's text as stored: trimmed and capped at the autofill text limit (counted like the CHECK, in characters). */
export function promptTextForStorage(text: unknown): string {
  if (typeof text !== "string") return "";
  return Array.from(text.trim()).slice(0, AUTOFILL_LIMITS.maxTextLength).join("");
}

export async function recordAutofillPrompt(input: {
  sellerId: string;
  storeId: string;
  mode: AutofillPromptMode;
  text: string;
  imageCount: number;
  hasPdf: boolean;
  cached: boolean;
  source?: AutofillPromptSource;
  adminId?: string | null;
}): Promise<string | null> {
  try {
    if (!isUuid(input.sellerId) || !isUuid(input.storeId) || !isMode(input.mode)) return null;
    const source: AutofillPromptSource = input.source === "admin" ? "admin" : "seller";
    const [row] = await db
      .insert(productAiPrompts)
      .values({
        sellerId: input.sellerId,
        storeId: input.storeId,
        mode: input.mode,
        source,
        adminId: source === "admin" && isUuid(input.adminId) ? input.adminId : null,
        promptText: promptTextForStorage(input.text),
        imageCount: Math.max(0, Math.trunc(Number(input.imageCount) || 0)),
        hasPdf: Boolean(input.hasPdf),
        cached: Boolean(input.cached),
      })
      .returning({ id: productAiPrompts.id });
    return row?.id ?? null;
  } catch (error) {
    logFailure("record", error);
    return null;
  }
}

/**
 * Links the seller+store's unlinked prompts of the last day (same mode and
 * source; for an admin, that admin's own) to a product the caller just saved.
 * The product must be the seller's. Returns how many rows were linked.
 */
export async function linkAutofillPrompts(input: {
  sellerId: string;
  storeId: string;
  productId: string;
  mode: AutofillPromptMode;
  source?: AutofillPromptSource;
  adminId?: string | null;
  now?: Date;
}): Promise<number> {
  try {
    if (!isUuid(input.sellerId) || !isUuid(input.storeId) || !isUuid(input.productId) || !isMode(input.mode)) return 0;
    const source: AutofillPromptSource = input.source === "admin" ? "admin" : "seller";
    if (source === "admin" && !isUuid(input.adminId)) return 0;
    const since = new Date((input.now ?? new Date()).getTime() - AI_PROMPT_LINK_WINDOW_MS).toISOString();
    const linked = await db
      .update(productAiPrompts)
      .set({ productId: input.productId, linkedAt: sql`now()` })
      .where(
        and(
          eq(productAiPrompts.sellerId, input.sellerId),
          eq(productAiPrompts.storeId, input.storeId),
          eq(productAiPrompts.mode, input.mode),
          eq(productAiPrompts.source, source),
          source === "admin" ? eq(productAiPrompts.adminId, input.adminId as string) : undefined,
          isNull(productAiPrompts.productId),
          gt(productAiPrompts.createdAt, since),
          sql`EXISTS (SELECT 1 FROM ${products} WHERE ${products.id} = ${input.productId} AND ${products.sellerId} = ${input.sellerId})`,
        ),
      )
      .returning({ id: productAiPrompts.id });
    return linked.length;
  } catch (error) {
    logFailure("link", error);
    return 0;
  }
}

export type ProductAiPromptRow = {
  id: string;
  mode: AutofillPromptMode;
  source: AutofillPromptSource;
  promptText: string;
  imageCount: number;
  hasPdf: boolean;
  cached: boolean;
  createdAt: string;
};

/**
 * Admin only (the caller checks admin access): a product's prompts, newest
 * first, at most 20. `null` when they can't be read (table missing, error),
 * so the page can tell "not recorded" from "none".
 */
export async function listProductAiPrompts(productId: string): Promise<ProductAiPromptRow[] | null> {
  try {
    if (!isUuid(productId)) return [];
    const rows = await db
      .select({
        id: productAiPrompts.id,
        mode: productAiPrompts.mode,
        source: productAiPrompts.source,
        promptText: productAiPrompts.promptText,
        imageCount: productAiPrompts.imageCount,
        hasPdf: productAiPrompts.hasPdf,
        cached: productAiPrompts.cached,
        createdAt: productAiPrompts.createdAt,
      })
      .from(productAiPrompts)
      .where(eq(productAiPrompts.productId, productId))
      .orderBy(desc(productAiPrompts.createdAt))
      .limit(AI_PROMPT_LIST_LIMIT);
    return rows.map((row) => ({
      ...row,
      mode: row.mode === "edit" ? "edit" : "add",
      source: row.source === "admin" ? "admin" : "seller",
    }));
  } catch (error) {
    logFailure("list", error);
    return null;
  }
}
