import { z } from "zod";
import type { FieldError } from "@workspace/lib/store-forms";

/**
 * Storefront form submission payload (PLAN.md §8.4, P4-10). Deliberately has
 * no store or seller id: the store comes from the request host.
 */
export const storeFormSubmitSchema = z
  .object({
    formId: z.string().uuid(),
    values: z.record(z.string().max(60), z.union([z.string().max(5000), z.boolean()])).refine((v) => Object.keys(v).length <= 30),
    /** The hidden honeypot input; humans leave it empty. */
    honeypot: z.string().max(500).optional(),
  })
  .strict();
export type StoreFormSubmitInput = z.input<typeof storeFormSubmitSchema>;

export type StoreFormSubmitError = "notFound" | "invalid" | "rateLimited" | "generic";

export type StoreFormSubmitResult =
  | { ok: true; message: string }
  | { ok: false; error: StoreFormSubmitError; fieldErrors?: Record<string, FieldError> };
