import { describe, expect, it } from "vitest"
import { AUTOFILL_LIMITS, validateAutofillInput } from "./ai-autofill.dto"
import { AI_IMAGE_STEPS, fitAiImages, nextFitStep, utf8Bytes, type AiImageStep } from "./ai-image-fit.lib"

const MB = 1024 * 1024
const last = AI_IMAGE_STEPS.length - 1

describe("nextFitStep", () => {
  const base = { pdfBytes: 0, textBytes: 0 }

  it("sends photos that already fit", () => {
    expect(nextFitStep({ ...base, sizes: [0.8 * MB, 1.2 * MB], steps: [0, 0] })).toEqual({ kind: "fits" })
  })

  it("shrinks a photo over its own cap first", () => {
    expect(nextFitStep({ ...base, sizes: [0.5 * MB, 2 * MB], steps: [0, 0] })).toEqual({ kind: "shrink", index: 1 })
  })

  it("gives up on a photo still over its cap at the last step", () => {
    expect(nextFitStep({ ...base, sizes: [2 * MB], steps: [last] })).toEqual({ kind: "tooLarge", error: "photosTooLarge" })
  })

  it("shrinks the largest photo that can still shrink when the total is over", () => {
    const limits = { ...AUTOFILL_LIMITS, maxTotalBytes: 3 * MB }
    expect(nextFitStep({ ...base, sizes: [1 * MB, 1.4 * MB, 1.3 * MB], steps: [0, last, 0] }, limits)).toEqual({ kind: "shrink", index: 2 })
  })

  it("blames the PDF when it is over its cap, or takes most of a request that cannot shrink", () => {
    expect(nextFitStep({ sizes: [], steps: [], pdfBytes: 5 * MB, textBytes: 0 })).toEqual({ kind: "tooLarge", error: "pdfTooLarge" })
    const limits = { ...AUTOFILL_LIMITS, maxTotalBytes: 4 * MB }
    expect(nextFitStep({ sizes: [1 * MB], steps: [last], pdfBytes: 3.9 * MB, textBytes: 0 }, limits)).toEqual({ kind: "tooLarge", error: "pdfTooLarge" })
  })

  it("lets four photos at their cap, a PDF at its cap and full text through the real limits", () => {
    const max = AUTOFILL_LIMITS.maxImageBytes
    const textBytes = utf8Bytes("ع".repeat(AUTOFILL_LIMITS.maxTextLength)) + utf8Bytes("ع".repeat(AUTOFILL_LIMITS.maxCurrentLength))
    expect(
      nextFitStep({ sizes: [max, max, max, max], steps: [0, 0, 0, 0], pdfBytes: AUTOFILL_LIMITS.maxPdfBytes, textBytes })
    ).toEqual({ kind: "fits" })
  })
})

describe("fitAiImages", () => {
  /** A fake encoder: bytes fall with quality and with the square of the side, like JPEG. */
  const fakeEncoder = (originals: number[]) => {
    const calls: Array<[number, AiImageStep]> = []
    const encode = async (index: number, step: AiImageStep) => {
      calls.push([index, step])
      const scale = (step.maxSide / 1536) ** 2
      return { bytes: Math.round(originals[index]! * scale * (step.quality / 0.85)) }
    }
    return { calls, encode }
  }

  it("keeps the first step for photos that fit (no extra encoding)", async () => {
    const { calls, encode } = fakeEncoder([0.7 * MB, 0.9 * MB])
    const result = await fitAiImages(2, encode, (e) => e.bytes, { pdfBytes: 0, textBytes: 0 })
    expect(result.ok).toBe(true)
    expect(calls).toHaveLength(2)
  })

  it("fits four very detailed phone photos (2.5 MB each at the first step) without an error", async () => {
    const { encode } = fakeEncoder([2.5 * MB, 2.5 * MB, 2.5 * MB, 2.5 * MB])
    const result = await fitAiImages(4, encode, (e) => e.bytes, { pdfBytes: 0, textBytes: 100 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.images.map((image) => image.index)).toEqual([0, 1, 2, 3])
    for (const image of result.images) expect(image.encoded.bytes).toBeLessThanOrEqual(AUTOFILL_LIMITS.maxImageBytes)
  })

  it("fits a 4 MB PDF and four photos under the total cap", async () => {
    const { encode } = fakeEncoder([1.4 * MB, 1.4 * MB, 1.4 * MB, 1.4 * MB])
    const pdfBytes = AUTOFILL_LIMITS.maxPdfBytes
    const result = await fitAiImages(4, encode, (e) => e.bytes, { pdfBytes, textBytes: 3000 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const total = result.images.reduce((sum, image) => sum + image.encoded.bytes, 0) + pdfBytes + 3000
    expect(total).toBeLessThanOrEqual(AUTOFILL_LIMITS.maxTotalBytes)
  })

  it("shrinks under a tight total cap, largest first, and stops at the last step", async () => {
    const { encode } = fakeEncoder([1.2 * MB, 1.2 * MB])
    const limits = { ...AUTOFILL_LIMITS, maxTotalBytes: 1 * MB }
    const fits = await fitAiImages(2, encode, (e) => e.bytes, { pdfBytes: 0, textBytes: 0 }, limits)
    expect(fits.ok).toBe(true)
    const tooTight = await fitAiImages(2, encode, (e) => e.bytes, { pdfBytes: 0, textBytes: 0 }, { ...limits, maxTotalBytes: 0.2 * MB })
    expect(tooTight).toEqual({ ok: false, error: "photosTooLarge" })
  })

  it("drops a photo the browser cannot read", async () => {
    const encode = async (index: number) => (index === 1 ? null : { bytes: 1000 })
    const result = await fitAiImages(3, encode, (e) => e.bytes, { pdfBytes: 0, textBytes: 0 })
    expect(result.ok && result.images.map((image) => image.index)).toEqual([0, 2])
  })
})

describe("validateAutofillInput size codes", () => {
  const image = { mediaType: "image/jpeg", size: 1000, data: new Uint8Array() }

  it("names a photo over its cap and a PDF over its cap", () => {
    expect(
      validateAutofillInput({ text: "", images: [{ ...image, size: AUTOFILL_LIMITS.maxImageBytes + 1 }], pdf: null })
    ).toBe("photosTooLarge")
    expect(
      validateAutofillInput({
        text: "",
        images: [],
        pdf: { mediaType: "application/pdf", size: AUTOFILL_LIMITS.maxPdfBytes + 1, data: new Uint8Array() },
      })
    ).toBe("pdfTooLarge")
  })

  it("accepts every file at its own cap at once", () => {
    const photo = { ...image, size: AUTOFILL_LIMITS.maxImageBytes }
    const pdf = { mediaType: "application/pdf", size: AUTOFILL_LIMITS.maxPdfBytes, data: new Uint8Array() }
    expect(validateAutofillInput({ text: "a", images: Array(AUTOFILL_LIMITS.maxImages).fill(photo), pdf })).toBeNull()
  })
})
