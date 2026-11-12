import { generateStructured, type GenerateContentPart } from "@workspace/ai"
import type { TaxonomyScope } from "@workspace/lib/stores/scope/server"
import { loadSellerTaxonomyOptions } from "../../categories-brands/categories-brands.data"
import {
  AUTOFILL_CALL_OPTIONS,
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

export type AutofillRun = {
  output: ProductAutofillOutput
  /** True when the answer came from the result cache (no model call, not counted toward the cap). */
  cached: boolean
}

export async function autofillProduct(
  /**
   * The seller and the checked store (F-87d): the prompt names that store's own
   * category names only (a short list the seller owns, docs/ai.md rule 2; the
   * Tallaby category is matched in code from `categoryHint`). The names are part
   * of the prompt, so the result cache never mixes stores.
   */
  taxonomy: TaxonomyScope,
  input: AutofillInput,
  /** Its own usage-log name when another feature calls this (the AI Store Builder). */
  options: { feature?: string; refId?: string } = {},
): Promise<AutofillRun> {
  const { sellerId } = taxonomy
  const today = cairoToday()
  const owned = await loadSellerTaxonomyOptions(taxonomy)
  const storeCategories = owned.categories.map((c) => c.nameAr || c.name).filter(Boolean)

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
    feature: options.feature ?? AUTOFILL_FEATURE,
    refId: options.refId,
    sellerId,
    // Fast tier, medium media resolution, minimal thinking, 10-minute result cache (shared with Admin).
    ...AUTOFILL_CALL_OPTIONS,
    schema: productAutofillOutputSchema,
    system: AUTOFILL_SYSTEM_RULES,
    content,
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
