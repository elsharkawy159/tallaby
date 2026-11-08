import { randomUUID } from "node:crypto";
import { aiConfigured, aiErrorKind, checkDailyCap, generateStructured, logAiUsage, modelIdForTier } from "@workspace/ai";
import { and, count, db, desc, eq, inArray, isNull, products, sellers } from "@workspace/db";
import { fetchPublicImage } from "@workspace/lib/agents/server";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, getAiCreditStatus, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { createProduct, setProductPublished } from "@/actions/products";
import { getServiceClient } from "@workspace/db/supabase/service";
import { ensureTaxonomyItem } from "../../categories-brands/categories-brands.server";
import { loadAllCategories } from "./from-file-categories.server";
import {
  BULK_CREDITS_PER_AI_PRODUCT,
  BULK_FEATURES,
  bulkCopyOutputSchema,
  columnMappingOutputSchema,
  pdfRowsOutputSchema,
  type AddBatchInput,
  type AddBatchResult,
  type BulkErrorCode,
  type BulkField,
  type BulkNote,
  type BulkRowResult,
  type BulkStatus,
  type BulkStop,
  type ColumnMapping,
  type MapColumnsInput,
  type MapColumnsResult,
  type MappedRow,
} from "./from-file.dto";
import {
  buildPlainVariants,
  buildProductPayload,
  categoryNames,
  checkDeclaredFile,
  cleanCopyOutput,
  cleanMapping,
  cleanPdfRows,
  findBorrowedTitles,
  firstLeafCategory,
  guessMapping,
  matchCategory,
  importSku,
  mappingIsConfident,
  mergeCopy,
  needsAiCopy,
  templateMapping,
  validateRow,
  type RowCopy,
  type ValidRow,
} from "./from-file.lib";
import { BULK_COPY_RULES, BULK_MAP_RULES, BULK_PDF_RULES, copyRequestText, mapRequestText, pdfRequestText } from "./from-file-prompt.lib";

/**
 * The server side of "add many products from a file" (PLAN.md AI-3), called by
 * the server actions and the PDF route after the session check. No `"use server"`
 * here: these take the seller as an argument, so none of them may become a
 * public endpoint. Cost rules: docs/ai.md.
 */

/** The same seller sending the same input again within this window gets the stored answer, free. */
const RESULT_CACHE_MS = 10 * 60_000;

/** Page-level maxDuration is 60 s: copy, then photos, then saving, with time left to answer. */
const COPY_BUDGET_MS = 28_000;
const IMAGES_BUDGET_MS = 12_000;
const IMAGE_TIMEOUT_MS = 6_000;
const IMAGES_AT_ONCE = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Same multiplier as the autofill: Pro's credits need a higher abuse guard. */
const PRO_DAILY_MULTIPLIER = 10;

const envLimit = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
};

/**
 * Model calls per seller per Cairo day. One copy call writes up to 10 products,
 * so 100 calls is about 1,000 products. The credit system is the real price
 * once it is on; this is what bounds the cost before the USD switch.
 */
const COPY_DAILY_LIMIT = () => envLimit("AI_PRODUCT_BULK_DAILY_LIMIT", 100);
const MAP_DAILY_LIMIT = () => envLimit("AI_PRODUCT_BULK_MAP_DAILY_LIMIT", 20);
const PDF_DAILY_LIMIT = () => envLimit("AI_PRODUCT_BULK_PDF_DAILY_LIMIT", 40);

const logError = (label: string, error: unknown) => console.error(`[ai] ${label}`, error instanceof Error ? error.message : error);

type Billing = { usdLive: boolean; isPro: boolean };

/** Fails closed, like the autofill: null means no AI. */
async function loadBilling(sellerId: string): Promise<Billing | null> {
  const billing = await getBillingState().catch(() => null);
  if (!billing) return null;
  if (!billing.usdLive) return { usdLive: false, isPro: false };
  const [plan] = await db
    .select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil })
    .from(sellers)
    .where(eq(sellers.id, sellerId));
  return { usdLive: true, isPro: Boolean(plan && isProActive(plan)) };
}

const capFor = (sellerId: string, feature: string, baseLimit: number, billing: Billing) =>
  checkDailyCap(sellerId, feature, billing.isPro ? baseLimit * PRO_DAILY_MULTIPLIER : baseLimit).catch((error: unknown) => {
    logError("daily cap check failed", error);
    return null;
  });

const blocked = (sellerId: string, feature: string, errorCode: string) =>
  logAiUsage({ sellerId, feature, model: modelIdForTier("fast"), status: "blocked", errorCode });

// ── Status ──────────────────────────────────────────────────────────────────

/** What the confirm screen shows before the seller commits. */
export async function loadBulkStatus(sellerId: string): Promise<BulkStatus> {
  const billing = await loadBilling(sellerId);
  if (!billing) return { ok: false, error: "failed" };
  const [cap, credits] = await Promise.all([
    capFor(sellerId, BULK_FEATURES.copy, COPY_DAILY_LIMIT(), billing),
    billing.usdLive ? getAiCreditStatus(sellerId).catch(() => null) : null,
  ]);
  return {
    ok: true,
    aiEnabled: aiConfigured(),
    creditsLive: billing.usdLive,
    creditsLeft: credits ? credits.total : null,
    callsLeftToday: cap?.remaining ?? 0,
  };
}

// ── Mapping ─────────────────────────────────────────────────────────────────

/**
 * The file's columns, read once. Our own template and headers the code knows
 * need no AI. The model sees the headers and a few cut samples, never the
 * sheet. If AI can't help, the code's best guess goes to the screen, where the
 * seller can correct it. The mapping costs the seller no credits.
 */
export async function mapColumns(sellerId: string, input: MapColumnsInput): Promise<MapColumnsResult> {
  const tooBig = checkDeclaredFile(input);
  if (tooBig) return { ok: false, error: tooBig };

  const columnCount = Math.max(...input.columns.map((column) => column.index)) + 1;
  const headers = Array.from({ length: columnCount }, (_, i) => input.columns.find((column) => column.index === i)?.header ?? "");

  const template = templateMapping(headers);
  if (template) return { ok: true, mapping: template, source: "template" };
  const guess = guessMapping(headers);
  if (mappingIsConfident(headers, guess)) return { ok: true, mapping: guess, source: "dictionary" };

  const fallback: MapColumnsResult = { ok: true, mapping: guess, source: "fallback" };
  if (!aiConfigured()) return fallback;
  const billing = await loadBilling(sellerId);
  if (!billing) return fallback;
  const cap = await capFor(sellerId, BULK_FEATURES.map, MAP_DAILY_LIMIT(), billing);
  if (!cap) return fallback;
  if (!cap.allowed) {
    await blocked(sellerId, BULK_FEATURES.map, "daily_limit");
    return fallback;
  }

  try {
    const { object } = await generateStructured({
      feature: BULK_FEATURES.map,
      sellerId,
      tier: "fast",
      schema: columnMappingOutputSchema,
      system: BULK_MAP_RULES,
      content: [{ type: "text", text: mapRequestText(input.columns) }],
      thinkingLevel: "minimal",
      cacheMs: RESULT_CACHE_MS,
      maxOutputTokens: 400,
      budgetMs: 25_000,
    });
    // Where the model said nothing, the code's guess can still fill the gap.
    const merged = Object.fromEntries(Object.entries(object).map(([field, value]) => [field, value ?? guess[field as BulkField]]));
    return { ok: true, mapping: cleanMapping(merged as Partial<ColumnMapping>, columnCount), source: "ai" };
  } catch (error) {
    logError("bulk column mapping failed", error);
    return fallback;
  }
}

// ── PDF ─────────────────────────────────────────────────────────────────────

/**
 * One batch of PDF pages. The code can't read a PDF, so the model copies the
 * rows; what it returns is checked like any cell. Medium resolution, on purpose:
 * it must read small prices in a price list (docs/ai.md rule 6).
 */
export async function extractPdfRows(
  sellerId: string,
  input: { data: Uint8Array; from: number; to: number },
): Promise<{ ok: true; rows: Omit<MappedRow, "row">[] } | { ok: false; error: BulkErrorCode }> {
  if (!aiConfigured()) return { ok: false, error: "disabled" };
  const billing = await loadBilling(sellerId);
  if (!billing) return { ok: false, error: "failed" };
  const cap = await capFor(sellerId, BULK_FEATURES.pdf, PDF_DAILY_LIMIT(), billing);
  if (!cap) return { ok: false, error: "failed" };
  if (!cap.allowed) {
    await blocked(sellerId, BULK_FEATURES.pdf, "daily_limit");
    return { ok: false, error: "dailyLimit" };
  }
  try {
    const { object } = await generateStructured({
      feature: BULK_FEATURES.pdf,
      sellerId,
      tier: "fast",
      schema: pdfRowsOutputSchema,
      system: BULK_PDF_RULES,
      content: [
        { type: "text", text: pdfRequestText(input.from, input.to) },
        { type: "file", data: input.data, mediaType: "application/pdf" },
      ],
      mediaResolution: "medium",
      thinkingLevel: "minimal",
      cacheMs: RESULT_CACHE_MS,
      maxOutputTokens: 8192,
    });
    return { ok: true, rows: cleanPdfRows(object) };
  } catch (error) {
    logError("bulk PDF reading failed", error);
    return { ok: false, error: aiErrorKind(error) };
  }
}

// ── Existing SKUs ───────────────────────────────────────────────────────────

/** Which of these SKUs this seller already has. Trash counts: the database holds the SKU there too. */
export async function findExistingSkus(sellerId: string, skus: readonly string[]): Promise<{ sku: string; inTrash: boolean }[]> {
  if (skus.length === 0) return [];
  const rows = await db
    .select({ sku: products.sku, deletedAt: products.deletedAt })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), inArray(products.sku, [...skus])));
  return rows.flatMap((row) => (row.sku ? [{ sku: row.sku, inTrash: Boolean(row.deletedAt) }] : []));
}

// ── Credits ─────────────────────────────────────────────────────────────────

type RowClaim = { row: number; references: string[] };

async function refundClaim(sellerId: string, claim: RowClaim | undefined): Promise<void> {
  if (!claim) return;
  await Promise.all(claim.references.map((reference) => refundAiCredit(sellerId, reference).catch((error: unknown) => logError("credit refund failed", error))));
  claim.references = [];
}

/**
 * Credits for each row, one claim at a time, so a seller with 3 credits gets 3
 * products written and not an error. `claimFailed` is the database failing, which
 * a retry can fix; running out is the normal stop.
 */
async function claimRows(sellerId: string, rows: readonly ValidRow[]): Promise<{ claims: Map<number, RowClaim>; ranOut: boolean; claimFailed: boolean }> {
  const claims = new Map<number, RowClaim>();
  for (const row of rows) {
    const claim: RowClaim = { row: row.row, references: [] };
    for (let i = 0; i < BULK_CREDITS_PER_AI_PRODUCT; i++) {
      let result;
      try {
        result = await claimAiCredit(sellerId, BULK_FEATURES.copy);
      } catch (error) {
        logError("credit claim failed", error);
        await refundClaim(sellerId, claim);
        return { claims, ranOut: false, claimFailed: true };
      }
      if (!result.ok) {
        await refundClaim(sellerId, claim);
        await blocked(sellerId, BULK_FEATURES.copy, "no_credits");
        return { claims, ranOut: true, claimFailed: false };
      }
      claim.references.push(result.reference);
    }
    claims.set(row.row, claim);
  }
  return { claims, ranOut: false, claimFailed: false };
}

// ── Photos ──────────────────────────────────────────────────────────────────

const todayFolder = () => new Date().toISOString().slice(0, 10);

// The products bucket has no write policies (0153): the service role, after the seller check.
type SessionStorage = ReturnType<typeof getServiceClient>;

/**
 * The photo links of every row, stored the way the dashboard's image import
 * stores them. A link passes the MCP tools' SSRF guard first: https only, no
 * private addresses, each redirect checked, and the bytes must really be a JPEG,
 * PNG or WebP. A photo that fails never fails its product; it is noted instead.
 */
async function importRowImages(storage: SessionStorage, rows: readonly ValidRow[]): Promise<Map<number, { paths: string[]; failed: boolean }>> {
  const deadline = Date.now() + IMAGES_BUDGET_MS;
  const jobs = rows.flatMap((row) => row.images.map((url, index) => ({ row: row.row, url, index })));
  const stored = new Map<number, { path: string; index: number }[]>();
  const failed = new Set<number>();

  const runJob = async (job: (typeof jobs)[number]) => {
    if (Date.now() > deadline) {
      failed.add(job.row);
      return;
    }
    try {
      const image = await fetchPublicImage(job.url, { maxBytes: MAX_IMAGE_BYTES, timeoutMs: IMAGE_TIMEOUT_MS });
      const path = `${todayFolder()}/${randomUUID()}.${image.ext}`;
      const { data, error } = await storage.storage
        .from("products")
        .upload(path, image.bytes, { contentType: image.mime, cacheControl: "31536000", upsert: false });
      if (error || !data?.path) {
        failed.add(job.row);
        return;
      }
      stored.set(job.row, [...(stored.get(job.row) ?? []), { path: data.path, index: job.index }]);
    } catch {
      failed.add(job.row);
    }
  };

  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(IMAGES_AT_ONCE, jobs.length) }, async () => {
      while (next < jobs.length) await runJob(jobs[next++]!);
    }),
  );

  return new Map(
    rows.map((row) => [
      row.row,
      {
        // In the order the seller listed them: the first one is the main photo.
        paths: (stored.get(row.row) ?? []).sort((a, b) => a.index - b.index).map((image) => image.path),
        failed: failed.has(row.row),
      },
    ]),
  );
}

/** Nothing points at a photo whose product was not saved. */
async function removeImages(storage: SessionStorage, paths: readonly string[]): Promise<void> {
  if (paths.length === 0) return;
  await storage.storage
    .from("products")
    .remove([...paths])
    .catch(() => {});
}

// ── Categories ──────────────────────────────────────────────────────────────

/** The category this seller uses most, for a product the code can't place. */
async function sellerTopCategory(sellerId: string): Promise<string | null> {
  const [top] = await db
    .select({ categoryId: products.categoryId, total: count() })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), isNull(products.deletedAt)))
    .groupBy(products.categoryId)
    .orderBy(desc(count()))
    .limit(1);
  return top?.categoryId ?? null;
}

function mostCommon(values: readonly string[]): string | null {
  const counts = new Map<string, number>();
  let best: string | null = null;
  for (const value of values) {
    const total = (counts.get(value) ?? 0) + 1;
    counts.set(value, total);
    if (!best || total > (counts.get(best) ?? 0)) best = value;
  }
  return best;
}

/** Each name once per batch: `ensureTaxonomyItem` finds or adds it in the seller's own list. */
function taxonomyResolver(kind: "category" | "brand") {
  const seen = new Map<string, Promise<string | null>>();
  return (input: { name: string } | { sourceId: string }) => {
    const key = JSON.stringify(input);
    let found = seen.get(key);
    if (!found) {
      found = ensureTaxonomyItem(kind, input)
        .then((result) => (result.success ? result.data.id : null))
        .catch(() => null);
      seen.set(key, found);
    }
    return found;
  };
}

// ── The batch ───────────────────────────────────────────────────────────────

const isSkuClash = (message: string | undefined) => /\bSKU\b/.test(message ?? "");

/**
 * One batch of rows, start to finish. Safe to run twice: rows whose SKU exists
 * are reported as already added before any AI is used, and the unique index on
 * (seller, SKU) stops two runs at the same moment (see `importSku`). A row that
 * fails gets its credit back. Each product saved stays saved, whatever happens next.
 */
/**
 * How the AI Store Builder runs a batch inside a build (ROADMAP.md F-82f). The
 * file importer's page passes none of these.
 */
export type BulkBatchOptions = {
  /** Written to ai_usage_logs.ref_id (the build id), so the build's spend stop counts this call. */
  refId?: string | null;
  /** False: no credits are claimed (the account's free build). */
  credits?: boolean;
  /** False: no model call (the build's spend stop); rows that need copy are left as "remaining". */
  ai?: boolean;
  /** Every product is saved hidden; the build sets the complete ones live when it publishes (D1, D4). */
  keepDraft?: boolean;
  /** Sheet rows the seller marked as always in stock: saved without stock tracking. */
  unlimitedRows?: ReadonlySet<number>;
};

export async function runBulkBatch(sellerId: string, input: AddBatchInput, options: BulkBatchOptions = {}): Promise<AddBatchResult> {
  const results: BulkRowResult[] = [];

  // Every row is checked again here: the browser's confirm screen proves nothing.
  const seenSkus = new Set<string>();
  const checked: { row: ValidRow; sku: string }[] = [];
  for (const raw of input.rows) {
    const check = validateRow(raw);
    if (!check.ok) {
      results.push({ row: check.row, outcome: "skipped", problem: check.problem });
      continue;
    }
    const sku = importSku(input.fileKey, input.source, check.value);
    if (seenSkus.has(sku)) {
      results.push({ row: check.value.row, outcome: "skipped", problem: "duplicateSku" });
      continue;
    }
    seenSkus.add(sku);
    checked.push({ row: check.value, sku });
  }

  const existing = new Map((await findExistingSkus(sellerId, checked.map((entry) => entry.sku))).map((entry) => [entry.sku, entry.inTrash]));
  const todo = checked.filter(({ row, sku }) => {
    if (!existing.has(sku)) return true;
    results.push({ row: row.row, outcome: "already", sku, ...(existing.get(sku) ? { inTrash: true } : {}) });
    return false;
  });

  const aiRows = todo.map((entry) => entry.row).filter(needsAiCopy);
  const copies = new Map<number, RowCopy>();
  const claims = new Map<number, RowClaim>();
  const toWrite = new Set<number>();
  let borrowed = new Set<number>();
  let stop: BulkStop | null = null;
  let retryable = false;

  const markRows = (rows: readonly ValidRow[], outcome: "remaining" | "failed") => {
    for (const row of rows) results.push({ row: row.row, outcome, sku: todo.find((entry) => entry.row.row === row.row)?.sku });
  };

  if (aiRows.length > 0) {
    const aiOn = aiConfigured() && options.ai !== false;
    const billing = aiOn ? await loadBilling(sellerId) : null;
    const cap = billing ? await capFor(sellerId, BULK_FEATURES.copy, COPY_DAILY_LIMIT(), billing) : null;
    if (!aiOn) {
      stop = "disabled";
      markRows(aiRows, "remaining");
    } else if (!billing || !cap) {
      retryable = true;
      markRows(aiRows, "failed");
    } else if (!cap.allowed) {
      stop = "dailyLimit";
      await blocked(sellerId, BULK_FEATURES.copy, "daily_limit");
      markRows(aiRows, "remaining");
    } else {
      let writable = aiRows;
      if (billing.usdLive && options.credits !== false) {
        const claimed = await claimRows(sellerId, aiRows);
        for (const [row, claim] of claimed.claims) claims.set(row, claim);
        writable = aiRows.filter((row) => claimed.claims.has(row.row));
        const unclaimed = aiRows.filter((row) => !claimed.claims.has(row.row));
        if (claimed.ranOut) {
          stop = "noCredits";
          markRows(unclaimed, "remaining");
        } else if (claimed.claimFailed) {
          retryable = true;
          markRows(unclaimed, "failed");
        }
      }

      if (writable.length > 0) {
        try {
          const { object, cached } = await generateStructured({
            feature: BULK_FEATURES.copy,
            sellerId,
            refId: options.refId ?? null,
            tier: "fast",
            schema: bulkCopyOutputSchema,
            system: BULK_COPY_RULES,
            content: [{ type: "text", text: copyRequestText(writable) }],
            // Copy work needs no reasoning (docs/ai.md rule 5).
            thinkingLevel: "minimal",
            // A retry of the same rows costs nothing.
            cacheMs: RESULT_CACHE_MS,
            maxOutputTokens: 6000,
            budgetMs: COPY_BUDGET_MS,
          });
          // A stored answer made no model call, so it costs no credit (same as the autofill).
          if (cached) {
            await Promise.all([...claims.values()].map((claim) => refundClaim(sellerId, claim)));
          }
          for (const [row, copy] of cleanCopyOutput(object, writable.map((row) => row.row))) {
            copies.set(row, copy);
            toWrite.add(row);
          }
          borrowed = findBorrowedTitles(writable, copies);
          const unanswered = writable.filter((row) => !copies.has(row.row));
          await Promise.all(unanswered.map((row) => refundClaim(sellerId, claims.get(row.row))));
          if (unanswered.length) {
            retryable = true;
            markRows(unanswered, "failed");
          }
        } catch (error) {
          logError("bulk copy failed", error);
          await Promise.all(writable.map((row) => refundClaim(sellerId, claims.get(row.row))));
          retryable = true;
          markRows(writable, "failed");
        }
      }
    }
  }

  const ready = todo.filter(({ row }) => !needsAiCopy(row) || toWrite.has(row.row));
  if (ready.length > 0) {
    const tree = await loadAllCategories();
    const storage = getServiceClient();
    const images = await importRowImages(storage, ready.map((entry) => entry.row));
    const storeCategory = taxonomyResolver("category");
    const storeBrand = taxonomyResolver("brand");

    const prepared = ready.map((entry) => {
      const ai = copies.get(entry.row.row) ?? null;
      const copy = mergeCopy(entry.row, ai);
      return { ...entry, ai, copy, pick: matchCategory(tree, entry.row, copy, ai?.categoryHint ?? null) };
    });
    // Each of these is only a place to save it: the product stays a draft, and the seller is told.
    let fallbackCategory = mostCommon(prepared.flatMap((entry) => entry.pick?.id ?? []));
    if (!fallbackCategory && prepared.some((entry) => !entry.pick)) {
      fallbackCategory = (await sellerTopCategory(sellerId).catch(() => null)) ?? firstLeafCategory(tree);
    }
    const names = categoryNames(tree);

    const now = new Date().toISOString();
    for (const { row, sku, ai, copy, pick } of prepared) {
      const photos = images.get(row.row) ?? { paths: [], failed: false };
      const giveUp = async () => {
        await removeImages(storage, photos.paths);
        await refundClaim(sellerId, claims.get(row.row));
      };

      const categoryId = pick?.id ?? fallbackCategory;
      if (!categoryId) {
        await giveUp();
        results.push({ row: row.row, outcome: "skipped", sku, problem: "noCategory", title: copy.ar.title || copy.en.title });
        continue;
      }
      const strongCategory = pick?.strong === true;
      const nameInDoubt = row.flagged || borrowed.has(row.row);

      const notes: BulkNote[] = [...row.notes];
      if (photos.failed) notes.push("imageFailed");
      if (photos.paths.length === 0) notes.push("noImage");
      const unlimited = options.unlimitedRows?.has(row.row) === true;
      if (row.stock === null && !unlimited) notes.push("noStock");
      if (!strongCategory) notes.push("checkCategory");
      if (borrowed.has(row.row)) notes.push("checkName");
      if (buildPlainVariants(row, sku).ignored) notes.push("variantsIgnored");

      const [sellerCategoryId, sellerBrandId] = await Promise.all([
        row.category ? storeCategory({ name: row.category }) : strongCategory ? storeCategory({ sourceId: categoryId }) : null,
        row.brand ? storeBrand({ name: row.brand }) : null,
      ]);

      try {
        const payload = buildProductPayload(row, copy, { sku, categoryId, sellerCategoryId, sellerBrandId, imagePaths: photos.paths, aiWritten: Boolean(ai), now });
        const created = await createProduct(
          (unlimited ? { ...payload, trackStock: false } : payload) as unknown as Parameters<typeof createProduct>[0],
          { stockReason: "import" },
        );
        if (!created.success || !created.data) {
          await giveUp();
          if (isSkuClash(created.error)) {
            // Another run added it a moment ago.
            results.push({ row: row.row, outcome: "already", sku });
          } else {
            retryable = true;
            results.push({ row: row.row, outcome: "failed", sku });
          }
          continue;
        }

        // A product that isn't ready to sell stays hidden; createProduct only knows about photos.
        const holdBack = options.keepDraft === true || (row.stock === null && !unlimited) || !strongCategory || nameInDoubt;
        let status = created.data.status;
        if (status === "active" && holdBack) {
          const hidden = await setProductPublished(created.data.id, false);
          if (hidden.success) status = "draft";
        }
        const live = status === "active";
        if (!live && photos.paths.length > 0 && !holdBack) notes.push("accountRestricted");        results.push({ row: row.row, outcome: live ? "live" : "draft", sku, title: copy.ar.title || copy.en.title, notes, productId: created.data.id, categoryName: names.get(categoryId) ?? undefined });
      } catch (error) {
        logError("bulk product save failed", error);
        await giveUp();
        retryable = true;
        results.push({ row: row.row, outcome: "failed", sku });
      }
    }
  }

  const creditsUsed = [...claims.values()].reduce((sum, claim) => sum + claim.references.length, 0);
  return { ok: true, results: results.sort((a, b) => a.row - b.row), creditsUsed, stop, retryable };
}

