import { generateStructured, type GenerateContentPart } from "@workspace/ai"
import { loadSellerTaxonomyOptions } from "../../categories-brands/categories-brands.data"
import {
  AUTOFILL_FEATURE,
  productAutofillOutputSchema,
  type AutofillInput,
  type ProductAutofillOutput,
} from "./ai-autofill.dto"
import { cairoToday, cleanAutofillOutput } from "./ai-autofill.lib"
import { AUTOFILL_SYSTEM_RULES, autofillRequestText } from "./ai-autofill-prompt.lib"

/**
 * Server side of the AI product autofill (PLAN.md AI-1). Called only by the
 * route handler, after the session, limits and input have been checked. The
 * output only fills a form the seller reviews; nothing is saved here.
 * Cost rules: docs/ai.md.
 */

/** The same seller sending the same input again within this window gets the stored answer, free. */
const RESULT_CACHE_MS = 10 * 60_000

export type AutofillRun = {
  output: ProductAutofillOutput
  /** True when the answer came from the result cache (no model call, not counted toward the cap). */
  cached: boolean
}

export async function autofillProduct(sellerId: string, input: AutofillInput): Promise<AutofillRun> {
  const today = cairoToday()
  const taxonomy = await loadSellerTaxonomyOptions(sellerId)
  const storeCategories = taxonomy.categories.map((c) => c.nameAr || c.name).filter(Boolean)

  const content: GenerateContentPart[] = [
    {
      type: "text",
      text: autofillRequestText(
        { ...input, imageCount: input.images.length, hasPdf: Boolean(input.pdf) },
        { today, storeCategories },
      ),
    },
    ...input.images.map((image) => ({ type: "image" as const, data: image.data, mediaType: image.mediaType })),
    ...(input.pdf ? [{ type: "file" as const, data: input.pdf.data, mediaType: input.pdf.mediaType }] : []),
  ]

  const { object, cached } = await generateStructured({
    feature: AUTOFILL_FEATURE,
    sellerId,
    tier: "fast",
    schema: productAutofillOutputSchema,
    system: AUTOFILL_SYSTEM_RULES,
    content,
    // Medium, not low: the model reads small text in review screenshots and spec sheets.
    mediaResolution: "medium",
    // Live 2026-10-29: "low" spent ~1,500 reasoning tokens a call (billed as
    // output) for the same listing that "minimal" wrote with none: $0.0037 → $0.0015.
    thinkingLevel: "minimal",
    cacheMs: RESULT_CACHE_MS,
  })

  return {
    cached: Boolean(cached),
    output: cleanAutofillOutput(object, {
      // In edit mode the current price and stock are the seller's own figures.
      sellerText: input.current ? `${input.text}\n${input.current}` : input.text,
      hasPdf: Boolean(input.pdf),
      imageCount: input.images.length,
      today,
    }),
  }
}
