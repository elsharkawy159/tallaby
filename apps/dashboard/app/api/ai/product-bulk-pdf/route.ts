import { NextResponse, type NextRequest } from "next/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { AUTOFILL_PDF_TYPE, countPdfPages } from "@/app/(main)/products/add/ai/ai-autofill.dto";
import { BULK_LIMITS, type BulkErrorCode, type PdfChunkResponse } from "@/app/(main)/products/add/from-file/from-file.dto";
import { extractPdfRows } from "@/app/(main)/products/add/from-file/from-file-run.server";

/**
 * One batch of a PDF catalogue (PLAN.md AI-3): a few pages in, rows out. The
 * browser splits the file; a route and not an action, because server actions
 * take 1 MB bodies. Nothing is saved here. Every limit is checked on the bytes
 * that arrive, so a page batch can't be larger than it says.
 */

export const maxDuration = 60;

const burstLimiter = createRateLimiter({ limit: 15, windowMs: 60_000 });

const STATUS: Record<BulkErrorCode, number> = {
  unauthorized: 401,
  disabled: 503,
  invalid: 400,
  tooLarge: 413,
  tooManyProducts: 413,
  pdfTooLong: 413,
  rateLimited: 429,
  dailyLimit: 429,
  busy: 503,
  timeout: 504,
  failed: 502,
};

const fail = (error: BulkErrorCode) => NextResponse.json<PdfChunkResponse>({ ok: false, error }, { status: STATUS[error] });

const intField = (form: FormData, name: string) => {
  const value = Number(form.get(name));
  return Number.isInteger(value) && value >= 0 ? value : null;
};

export async function POST(request: NextRequest) {
  let sellerId: string;
  try {
    sellerId = (await requireSeller({ forWrite: true })).sellerId;
  } catch (error) {
    if (isAccessError(error)) return fail("unauthorized");
    throw error;
  }

  // Reject an oversized body before reading it.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > BULK_LIMITS.maxPdfChunkBytes + 64 * 1024) return fail("tooLarge");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("invalid");
  }

  const file = form.get("file");
  const from = intField(form, "from");
  const to = intField(form, "to");
  const totalPages = intField(form, "totalPages");
  const fileBytes = intField(form, "fileBytes");
  if (!(file instanceof File) || file.type !== AUTOFILL_PDF_TYPE) return fail("invalid");
  if (from === null || to === null || totalPages === null || fileBytes === null) return fail("invalid");
  if (fileBytes > BULK_LIMITS.maxFileBytes || file.size > BULK_LIMITS.maxPdfChunkBytes) return fail("tooLarge");
  if (totalPages > BULK_LIMITS.maxPdfPages || to > BULK_LIMITS.maxPdfPages) return fail("pdfTooLong");

  const data = new Uint8Array(await file.arrayBuffer());
  // Page objects stay readable in what the browser sends (no object streams), so
  // a count we can't read means someone sent something else.
  const pages = countPdfPages(data);
  if (pages === null || to <= from || pages !== to - from) return fail("invalid");
  if (pages > BULK_LIMITS.pdfPagesPerCall) return fail("pdfTooLong");

  if (!burstLimiter.check(sellerId)) return fail("rateLimited");

  const result = await extractPdfRows(sellerId, { data, from, to });
  if (!result.ok) return fail(result.error);
  return NextResponse.json<PdfChunkResponse>({ ok: true, rows: result.rows });
}
