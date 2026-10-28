import { NextResponse, type NextRequest } from "next/server"
import { aiConfigured, aiErrorKind, checkDailyCap, logAiUsage, modelIdForTier } from "@workspace/ai"
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server"
import { createRateLimiter } from "@/lib/rate-limit.lib"
import { autofillProduct } from "@/app/(main)/products/add/ai/ai-autofill.server"
import {
  AUTOFILL_FEATURE,
  AUTOFILL_LIMITS,
  validateAutofillInput,
  type AutofillErrorCode,
  type AutofillFile,
  type ProductAutofillResponse,
} from "@/app/(main)/products/add/ai/ai-autofill.dto"

/** AI product autofill (PLAN.md AI-1): photos, a PDF and/or text → form values. Never saves. */

export const maxDuration = 60

// Bursts per instance; the daily cap below is the real, cross-instance limit.
const burstLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 })

const dailyLimit = () => {
  const value = Number(process.env.AI_PRODUCT_AUTOFILL_DAILY_LIMIT)
  return Number.isInteger(value) && value >= 0 ? value : 30
}

const STATUS: Record<AutofillErrorCode, number> = {
  unauthorized: 401,
  disabled: 503,
  empty: 400,
  tooLarge: 413,
  badFile: 415,
  rateLimited: 429,
  dailyLimit: 429,
  busy: 503,
  timeout: 504,
  failed: 502,
}

const fail = (error: AutofillErrorCode) =>
  NextResponse.json<ProductAutofillResponse>({ ok: false, error }, { status: STATUS[error] })

async function readFile(value: FormDataEntryValue): Promise<AutofillFile | null> {
  if (typeof value === "string") return null
  return { mediaType: value.type, size: value.size, data: new Uint8Array(await value.arrayBuffer()) }
}

export async function POST(request: NextRequest) {
  let sellerId: string
  try {
    sellerId = (await requireSeller({ forWrite: true })).sellerId
  } catch (error) {
    if (isAccessError(error)) return fail("unauthorized")
    throw error
  }

  if (!aiConfigured()) return fail("disabled")

  // Reject an oversized body before reading it.
  const declared = Number(request.headers.get("content-length") ?? 0)
  if (declared > AUTOFILL_LIMITS.maxTotalBytes + 64 * 1024) return fail("tooLarge")

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail("badFile")
  }

  const text = typeof form.get("text") === "string" ? (form.get("text") as string) : ""
  const images = (await Promise.all(form.getAll("images").map(readFile))).filter((f): f is AutofillFile => f !== null)
  const pdfEntry = form.get("pdf")
  const pdf = pdfEntry ? await readFile(pdfEntry) : null

  const currentEntry = form.get("current")
  const current = typeof currentEntry === "string" && currentEntry.trim() ? currentEntry : null

  const input = { text, images, pdf, current }
  const invalid = validateAutofillInput(input)
  if (invalid) return fail(invalid)

  if (!burstLimiter.check(sellerId)) return fail("rateLimited")
  // Fails closed: without the usage table (0110) there is no cap, so no AI.
  const cap = await checkDailyCap(sellerId, AUTOFILL_FEATURE, dailyLimit()).catch((error: unknown) => {
    console.error("[ai] daily cap check failed", error instanceof Error ? error.message : error)
    return null
  })
  if (!cap) return fail("failed")
  if (!cap.allowed) {
    await logAiUsage({ sellerId, feature: AUTOFILL_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "daily_limit" })
    return fail("dailyLimit")
  }

  try {
    const { output } = await autofillProduct(sellerId, input)
    return NextResponse.json<ProductAutofillResponse>({
      ok: true,
      result: { output, remainingToday: Math.max(0, cap.remaining - 1) },
    })
  } catch (error) {
    // The usage rows (with the error codes) are written by generateStructured.
    console.error("[ai] product autofill failed", error instanceof Error ? error.message : error)
    // Every model was tried; tell the seller whether to wait or change the input.
    return fail(aiErrorKind(error))
  }
}
