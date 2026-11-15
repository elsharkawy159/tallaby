/**
 * AI product autofill (PLAN.md AI-1): input limits and the model's output
 * schema. The core lives in @workspace/lib/products/autofill so Admin's store
 * products use the same prompt, schema and cleaning.
 */
export {
  AUTOFILL_CALL_OPTIONS,
  AUTOFILL_FEATURE,
  AUTOFILL_IMAGE_TYPES,
  AUTOFILL_LIMITS,
  AUTOFILL_MAX_REVIEWS,
  AUTOFILL_PDF_TYPE,
  CONDITIONS,
  CONTENT_BLOCK_KINDS,
  MISSING_FIELDS,
  VARIANT_KINDS,
  countPdfPages,
  productAutofillOutputSchema,
  validateAutofillInput,
  type AutofillErrorCode,
  type AutofillFile,
  type AutofillInput,
  type AutofillLocalizedOutput,
  type MissingField,
  type ProductAutofillOutput,
  type ProductAutofillRawOutput,
  type ProductAutofillResponse,
  type ProductAutofillResult,
} from "@workspace/lib/products/autofill"
