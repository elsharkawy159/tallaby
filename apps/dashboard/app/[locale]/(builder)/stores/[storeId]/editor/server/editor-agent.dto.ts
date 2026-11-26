import { z } from "zod";
import { MAX_SECTIONS_PER_PAGE } from "@workspace/store-sections";

/** Caps on one editor agent turn (ROADMAP F-83c). The prompt caps each part again (`prompt.lib.ts`). */
export const EDITOR_AGENT_MAX_MESSAGE = 1500;
export const EDITOR_AGENT_MAX_SECTION_BYTES = 64 * 1024;
export const EDITOR_AGENT_MAX_HISTORY = 6;
const MAX_HISTORY_TEXT = 2000;

const encoder = new TextEncoder();

/** UTF-8 size of a value as JSON; Infinity when it can't be written as JSON (cycles, BigInt). */
function jsonBytes(value: unknown): number {
  try {
    return encoder.encode(JSON.stringify(value ?? null)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

const idSchema = z.string().regex(/^[A-Za-z0-9_:-]{1,64}$/);
const locale = z.enum(["ar", "en"]);

/**
 * The input of the editor agent action. `section` stays `unknown`: it is the
 * seller's unsaved draft, validated with `validatePageContent` (server checks)
 * before use. The outline is only ids and labels for the prompt.
 */
export const editorAgentInputSchema = z.object({
  message: z.string().trim().min(1).max(EDITOR_AGENT_MAX_MESSAGE),
  uiLocale: locale,
  contentLocale: locale,
  pageId: z.string().uuid().optional(),
  target: z.object({ kind: z.enum(["page", "header", "footer"]), sectionId: idSchema.optional() }),
  section: z.unknown().optional().refine((section) => section === undefined || jsonBytes(section) <= EDITOR_AGENT_MAX_SECTION_BYTES, "section_too_large"),
  outline: z.array(z.object({ id: idSchema, name: z.string().max(120), kind: z.string().max(20) })).max(MAX_SECTIONS_PER_PAGE),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(MAX_HISTORY_TEXT) })).max(EDITOR_AGENT_MAX_HISTORY),
});

export type EditorAgentActionInput = z.infer<typeof editorAgentInputSchema>;
