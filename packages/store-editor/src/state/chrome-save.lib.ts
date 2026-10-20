import type { EditorAdapter } from "../adapter.types";
import type { EditorStore } from "./editor.store";

/**
 * Saves the dirty header/footer. Both share one server version
 * (`stores.chrome_version`): each save sends the stored value and the store
 * takes the returned one, so the second part uses the first part's result.
 * `conflict` = the drafts changed elsewhere (stop and ask to reload).
 */
export async function saveDirtyChrome(store: EditorStore, adapter: Pick<EditorAdapter, "saveChrome">): Promise<"ok" | "conflict" | "error"> {
  for (const part of ["header", "footer"] as const) {
    if (!store.getState().dirtyChrome[part]) continue;
    const value = store.getState()[part];
    const result = await adapter.saveChrome(part, value, store.getState().chromeVersion);
    if (!result.success) return result.error === "versionConflict" ? "conflict" : "error";
    store.getState().markChromeSaved(part, value, result.data.version);
  }
  return "ok";
}
