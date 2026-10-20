"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STORE_DATA_CHANNEL, shouldRefresh } from "@workspace/store-editor/lib/editor-data.lib";
import type { EditorCatalogSnapshot } from "../server/editor.data";
import { refreshEditorData } from "../server/editor.server";

export type EditorDataState = "ready" | "refreshing" | "error";

/**
 * The store data the canvas draws, kept fresh without a page reload
 * (P4B-05): when the seller comes back to the editor tab (focus or the tab
 * becoming visible), and when another dashboard tab says store data changed
 * (BroadcastChannel). One request at a time, at most every few seconds unless
 * forced. A failed request keeps the last data and reports `error`, so
 * sections never mistake a failure for an empty store. Nothing here touches
 * the page drafts, the selection or undo history.
 */
export function useEditorData(storeId: string, initial: EditorCatalogSnapshot) {
  const [data, setData] = useState(initial);
  const [state, setState] = useState<EditorDataState>("ready");
  const inFlight = useRef(false);
  const lastAt = useRef(Date.now());

  const refresh = useCallback(
    async (force = false) => {
      if (!shouldRefresh(lastAt.current, Date.now(), inFlight.current, force)) return;
      inFlight.current = true;
      lastAt.current = Date.now();
      setState("refreshing");
      try {
        const result = await refreshEditorData(storeId);
        if (result.success && result.data) {
          setData(result.data);
          setState("ready");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      } finally {
        inFlight.current = false;
      }
    },
    [storeId],
  );

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onFocus = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(STORE_DATA_CHANNEL);
      channel.onmessage = () => void refresh(true);
    } catch {
      // No BroadcastChannel (old browser): focus refresh still covers coming back.
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      channel?.close();
    };
  }, [refresh]);

  /** The Forms tab edits forms in place; keep them in the same data. */
  const setForms = useCallback((forms: EditorCatalogSnapshot["forms"]) => setData((prev) => ({ ...prev, forms })), []);

  return { data, state, refresh, setForms };
}
