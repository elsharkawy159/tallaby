/**
 * AI product autofill core (PLAN.md AI-1), shared by the seller dashboard
 * and Admin (store products): the input limits, the output schema sent to
 * the model, the prompt, and the code that cleans the answer. Pure: the
 * callers make the model call through `generateStructured` (@workspace/ai).
 */
export * from "./autofill.dto"
export * from "./autofill-prompt.lib"
export * from "./autofill-clean.lib"
export * from "./keywords.lib"
