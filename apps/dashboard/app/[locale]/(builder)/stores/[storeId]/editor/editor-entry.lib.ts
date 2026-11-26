/** What /stores/[storeId]/editor shows: the editor, a redirect to the AI editor, or the choice between them. */
export type EditorEntry = "editor" | "ai" | "choose";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/**
 * Which entry `?mode=` asks for (owner, 2026-11-26). With AI off (the
 * `editor_agent` switch, or no AI provider) there is no choice: the editor
 * opens as before. `?mode=manual` opens the editor and `?mode=ai` the AI
 * editor. Any other param is a deep link into the editor (none exists today,
 * but a page, section or part link must never stop at the choice), so it opens
 * the editor too. No param, or only an unknown `mode`, is the choice. Pure.
 */
export function resolveEditorEntry(searchParams: SearchParams, { aiEnabled }: { aiEnabled: boolean }): EditorEntry {
  if (!aiEnabled) return "editor";
  const mode = first(searchParams.mode);
  if (mode === "manual") return "editor";
  if (mode === "ai") return "ai";
  const deepLink = Object.entries(searchParams).some(([key, value]) => key !== "mode" && value !== undefined);
  return deepLink ? "editor" : "choose";
}

/** The manual editor, past the choice. */
export const manualEditorHref = (storeId: string) => `/stores/${encodeURIComponent(storeId)}/editor?mode=manual`;

/** The AI editor. */
export const aiEditorHref = (storeId: string) => `/stores/${encodeURIComponent(storeId)}/editor/ai`;
