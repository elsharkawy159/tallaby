import { z } from "zod";

/** Caps on what the Code tab sends for one preview (ROADMAP F-101e). */
export const CODE_PREVIEW_MAX_FILE_BYTES = 100 * 1024;
export const CODE_PREVIEW_MAX_VALUES_BYTES = 200 * 1024;

const encoder = new TextEncoder();

/** UTF-8 size of a value as JSON; Infinity when it can't be written as JSON (cycles, BigInt). */
function jsonBytes(value: unknown): number {
  try {
    return encoder.encode(JSON.stringify(value ?? null)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * The input of the code preview action. `settings` and `blocks` stay
 * `unknown`: the file's own schema cleans them (`normalizeCodeNodeProps`);
 * here they are only size-capped, together.
 */
export const codePreviewInputSchema = z
  .object({
    nodeId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    file: z.string().refine((file) => encoder.encode(file).length <= CODE_PREVIEW_MAX_FILE_BYTES),
    settings: z.unknown(),
    blocks: z.unknown(),
    locale: z.enum(["ar", "en"]),
    pageId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
  })
  .refine((input) => jsonBytes([input.settings, input.blocks]) <= CODE_PREVIEW_MAX_VALUES_BYTES);

export type CodePreviewActionInput = z.infer<typeof codePreviewInputSchema>;
