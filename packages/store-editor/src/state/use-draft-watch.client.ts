"use client";

import { useEffect, useState } from "react";
import type { DraftVersions, EditorAdapter } from "../adapter.types";
import { detectExternalChange, mergeLocalVersions } from "../lib/draft-watch.lib";
import type { EditorStore } from "./editor.store";

export const DRAFT_WATCH_INTERVAL_MS = 30_000;

/**
 * Notices drafts that changed elsewhere (another tab, or an admin editing at
 * the seller's request). The baseline is the first `draftVersions()` fetch,
 * merged with the versions this editor holds after its own saves. On a change
 * it sets `saveStatus = "conflict"` (autosave stops) and reports whether an
 * admin did it. Does nothing when the adapter has no `draftVersions`.
 */
export function useDraftWatch(store: EditorStore, adapter: Pick<EditorAdapter, "draftVersions">): { byAdmin: boolean } {
  const [byAdmin, setByAdmin] = useState(false);
  const draftVersions = adapter.draftVersions;

  useEffect(() => {
    if (!draftVersions) return;
    let active = true;
    let busy = false;
    let baseline: DraftVersions | null = null;

    const check = async () => {
      if (!active || busy) return;
      const before = store.getState().saveStatus;
      if (before === "conflict" || before === "saving") return;
      busy = true;
      try {
        const result = await draftVersions.call(adapter);
        if (!active || !result.success) return;
        const state = store.getState();
        // A save started while we were fetching may have bumped the remote already.
        if (state.saveStatus === "saving" || state.saveStatus === "conflict") return;
        if (!baseline) {
          baseline = result.data;
          return;
        }
        const local = mergeLocalVersions(baseline, {
          pages: state.pages.map((p) => ({ id: p.id, version: p.version })),
          designVersion: state.designVersion,
          chromeVersion: state.chromeVersion,
        });
        const change = detectExternalChange(local, result.data);
        if (change.changed) {
          setByAdmin(change.byAdmin);
          state.setSaveStatus("conflict");
        }
      } finally {
        busy = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    const onFocus = () => void check();

    void check();
    const timer = setInterval(() => void check(), DRAFT_WATCH_INTERVAL_MS);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store, adapter, draftVersions]);

  return { byAdmin };
}
