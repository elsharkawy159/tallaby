"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { useEditorAdapter } from "../adapter.client";
import { hasPendingChanges, type EditorStore } from "./editor.store";

const DEBOUNCE_MS = 1500;

/**
 * Autosave (reference `use-builder-autosave.ts`): 1.5 s after the last edit,
 * every dirty page, the header/footer and the theme are saved. A version
 * conflict (the store was edited elsewhere) stops saving and asks the seller
 * to reload, so one tab never overwrites the other. `flush()` saves now
 * (before publishing).
 */
export function useEditorAutosave(store: EditorStore) {
  const adapter = useEditorAdapter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef<Promise<boolean> | null>(null);
  const saveStatus = useStore(store, (s) => s.saveStatus);

  const drain = useCallback(async (): Promise<boolean> => {
    const state = store.getState();
    if (state.saveStatus === "conflict") return false;
    if (!hasPendingChanges(state)) return true;
    state.setSaveStatus("saving");

    for (const pageId of Object.keys(state.dirtyPages)) {
      const page = store.getState().pages.find((p) => p.id === pageId);
      if (!page) continue;
      const content = page.content;
      const result = await adapter.saveDraft(pageId, content, page.version);
      if (!result.success) {
        store.getState().setSaveStatus(result.error === "versionConflict" ? "conflict" : "error");
        return false;
      }
      store.getState().markPageSaved(pageId, result.data.draftVersion, content);
    }

    for (const part of ["header", "footer"] as const) {
      if (!store.getState().dirtyChrome[part]) continue;
      const value = store.getState()[part];
      // Header/footer versions are not tracked yet (0 = none); the seller adapter ignores it.
      const result = await adapter.saveChrome(part, value, 0);
      if (!result.success) {
        store.getState().setSaveStatus("error");
        return false;
      }
      store.getState().markChromeSaved(part, value);
    }

    if (store.getState().dirtyDesign) {
      const { designSystem, designVersion } = store.getState();
      const result = await adapter.saveDesignSystem(designSystem, designVersion);
      if (!result.success) {
        store.getState().setSaveStatus(result.error === "versionConflict" ? "conflict" : "error");
        return false;
      }
      store.getState().markDesignSaved(result.data.version, designSystem);
    }

    const done = !hasPendingChanges(store.getState());
    store.getState().setSaveStatus(done ? "saved" : "unsaved");
    return true;
  }, [store, adapter]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    // Wait for a save in flight, then save whatever is left.
    if (running.current) await running.current;
    running.current = drain();
    const ok = await running.current;
    running.current = null;
    return ok && !hasPendingChanges(store.getState());
  }, [drain, store]);

  useEffect(
    () =>
      store.subscribe((state, previous) => {
        const changed =
          state.pages !== previous.pages ||
          state.header !== previous.header ||
          state.footer !== previous.footer ||
          state.designSystem !== previous.designSystem;
        if (!changed || !hasPendingChanges(state) || state.saveStatus === "conflict") return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
      }),
    [store, flush],
  );

  // Unsaved-changes guard on leaving the page.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingChanges(store.getState())) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [store]);

  return { flush, saveStatus };
}
