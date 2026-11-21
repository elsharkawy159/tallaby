import { AUTOFILL_LIMITS } from "./ai-autofill.dto"

/**
 * Fitting the AI copies of the photos into the request limits before they are
 * sent (the original photos go to storage untouched). Each photo starts at the
 * first encoding step and moves down the list only while it, or the request as
 * a whole, is too large. The model bills per image at a fixed media
 * resolution, so smaller copies cost the same and read the same.
 */

export type AiImageStep = { maxSide: number; quality: number }

/** Quality first (cheap to lose), then size; 1024 px still shows small text in screenshots. */
export const AI_IMAGE_STEPS: readonly AiImageStep[] = [
  { maxSide: 1536, quality: 0.85 },
  { maxSide: 1536, quality: 0.7 },
  { maxSide: 1536, quality: 0.55 },
  { maxSide: 1280, quality: 0.55 },
  { maxSide: 1024, quality: 0.55 },
]

export type FitLimits = Pick<typeof AUTOFILL_LIMITS, "maxImageBytes" | "maxPdfBytes" | "maxTotalBytes">

export type FitState = {
  /** Bytes of each encoded photo, in send order. */
  sizes: number[]
  /** The step each photo was encoded at (index into the steps list). */
  steps: number[]
  pdfBytes: number
  /** Text and the current listing, as UTF-8 bytes. */
  textBytes: number
}

/** Error codes the client shows when the request cannot be made to fit. */
export type FitError = "pdfTooLarge" | "photosTooLarge"

export type FitDecision =
  | { kind: "fits" }
  | { kind: "shrink"; index: number }
  | { kind: "tooLarge"; error: FitError }

/** What to do next: send, re-encode one photo at its next step, or give up with the error to show. */
export function nextFitStep (
  { sizes, steps, pdfBytes, textBytes }: FitState,
  limits: FitLimits = AUTOFILL_LIMITS,
  stepCount: number = AI_IMAGE_STEPS.length
): FitDecision {
  if (pdfBytes > limits.maxPdfBytes) return { kind: "tooLarge", error: "pdfTooLarge" }
  const canShrink = (index: number) => (steps[index] ?? 0) < stepCount - 1

  // Every photo under its own cap first.
  for (let index = 0; index < sizes.length; index++) {
    if ((sizes[index] ?? 0) <= limits.maxImageBytes) continue
    return canShrink(index) ? { kind: "shrink", index } : { kind: "tooLarge", error: "photosTooLarge" }
  }

  const photoBytes = sizes.reduce((sum, size) => sum + size, 0)
  if (photoBytes + pdfBytes + textBytes <= limits.maxTotalBytes) return { kind: "fits" }

  // Then the request: shrink the largest photo that still has a step left.
  let largest = -1
  for (let index = 0; index < sizes.length; index++) {
    if (canShrink(index) && (largest === -1 || (sizes[index] ?? 0) > (sizes[largest] ?? 0))) largest = index
  }
  if (largest !== -1) return { kind: "shrink", index: largest }
  // Nothing left to shrink: blame the PDF when it alone takes most of the room.
  return { kind: "tooLarge", error: pdfBytes > photoBytes ? "pdfTooLarge" : "photosTooLarge" }
}

/** Bytes a string takes in the request body (Arabic letters are 2 bytes in UTF-8). */
export const utf8Bytes = (value: string) => new TextEncoder().encode(value).length

/**
 * Encodes every photo, then re-encodes until the request fits. `encode` gets
 * the photo's index and step; a photo it cannot read (returns null) is dropped.
 */
export async function fitAiImages<T> (
  count: number,
  encode: (index: number, step: AiImageStep) => Promise<T | null>,
  sizeOf: (encoded: T) => number,
  fixed: { pdfBytes: number; textBytes: number },
  limits: FitLimits = AUTOFILL_LIMITS,
  steps: readonly AiImageStep[] = AI_IMAGE_STEPS
): Promise<{ ok: true; images: Array<{ index: number; encoded: T }> } | { ok: false; error: FitError }> {
  const first = steps[0]
  if (!first) throw new Error("no steps")
  // One at a time: a phone decoding several 12 MP photos at once can run out of memory.
  const kept: Array<{ index: number; encoded: T; step: number }> = []
  for (let index = 0; index < count; index++) {
    const encoded = await encode(index, first)
    if (encoded !== null) kept.push({ index, encoded, step: 0 })
  }

  // Bounded: each pass moves one photo one step down, so at most count × steps passes.
  for (;;) {
    const decision = nextFitStep(
      { sizes: kept.map((item) => sizeOf(item.encoded)), steps: kept.map((item) => item.step), ...fixed },
      limits,
      steps.length
    )
    if (decision.kind === "fits") return { ok: true, images: kept.map(({ index, encoded }) => ({ index, encoded })) }
    if (decision.kind === "tooLarge") return { ok: false, error: decision.error }
    const item = kept[decision.index]!
    const step = steps[item.step + 1]!
    const again = await encode(item.index, step)
    // Unreadable at a smaller step after reading at the first: keep moving down.
    item.step += 1
    if (again !== null) item.encoded = again
  }
}
