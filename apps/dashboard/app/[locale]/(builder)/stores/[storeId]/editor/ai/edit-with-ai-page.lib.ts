import type { TurnContext } from "./edit-with-ai-chat.lib";

/**
 * Pure rules of the "Edit with AI" page (owner request 2026-11-26).
 */

/** What /stores/[storeId]/editor/ai does: 404 without the website builder, the manual editor with AI off, else the AI layout. */
export function editWithAiGate({ builderEnabled, aiEnabled }: { builderEnabled: boolean; aiEnabled: boolean }): "notFound" | "editor" | "show" {
  if (!builderEnabled) return "notFound";
  return aiEnabled ? "show" : "editor";
}

/** At or under this many AI credits the chip warns. */
export const LOW_CREDITS = 3;

/** The credits chip's look: quiet, a warning when few are left, and "get credits" at none. */
export function creditsTone(credits: number): "ok" | "low" | "empty" {
  if (credits <= 0) return "empty";
  return credits <= LOW_CREDITS ? "low" : "ok";
}

/**
 * What a turn sends about the editor: the active page, the canvas language,
 * and the selected section when there is one (ids only; the server checks
 * them against the saved drafts). With nothing selected the server finds the
 * section itself.
 */
export function turnContextOf(editor: {
  pageId: string;
  contentLocale: "ar" | "en";
  mention: object | null;
  target: { kind: "page" | "header" | "footer"; sectionId?: string };
}): TurnContext {
  const context: TurnContext = { contentLocale: editor.contentLocale, ...(editor.pageId && { pageId: editor.pageId }) };
  if (!editor.mention) return context;
  if (editor.target.kind !== "page") return { ...context, target: { kind: editor.target.kind } };
  return editor.target.sectionId ? { ...context, target: { kind: "page", sectionId: editor.target.sectionId } } : context;
}
