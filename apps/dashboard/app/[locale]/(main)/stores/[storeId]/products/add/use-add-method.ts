"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { resolveAddView } from "./add-method.lib";
import { clearStoredDraft, hasStoredDraft } from "./use-product-draft";

const subscribeNever = () => () => {};

/** Where focus lands after each change of view; the page also returns to the top. */
const FOCUS_TARGET = {
  choose: "add-method-title",
  ai: "ai-stage-title",
  url: "url-stage-title",
  manual: "add-product-title",
} as const;

/**
 * The view on /products/add. The URL holds the method, through the History API
 * (next/navigation stays in sync with no server round trip), so the back button and
 * a reload behave. Opening the page always lands on the choice (`?method=choose`);
 * a stored draft only shows there, with Continue and Delete (owner, 2026-11-22).
 */
export function useAddMethod(aiEnabled: boolean) {
  const param = useSearchParams().get("method");
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const view = resolveAddView(param, aiEnabled);

  // Once open, the form stays mounted (hidden) so its values, a running AI fill
  // and the autosave timer all survive a visit to the choice.
  const [formOpened, setFormOpened] = useState(false);
  if (!formOpened && (view === "ai" || view === "url" || view === "manual")) setFormOpened(true);

  // No (or an unknown) method: name the choice in the URL, keeping the other params.
  const nameChoice = view === "choose" && param !== "choose";
  useEffect(() => {
    if (!nameChoice) return;
    const url = new URL(window.location.href);
    url.searchParams.set("method", "choose");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [nameChoice]);

  const previous = useRef(view);
  useEffect(() => {
    const from = previous.current;
    previous.current = view;
    if (from === view) return;
    window.scrollTo(0, 0);
    document.getElementById(FOCUS_TARGET[view])?.focus({ preventScroll: true });
  }, [view]);

  const pick = useCallback((method: "ai" | "url" | "manual" | "choose") => {
    window.history.pushState(null, "", `?method=${method}`);
  }, []);

  // Bumped after "Delete draft", so `draftStored` reads the storage again.
  const [, setDraftReads] = useState(0);
  /** Forget the stored draft. A hidden form still holding it is closed too, so it can't save it back. */
  const deleteDraft = useCallback(() => {
    clearStoredDraft();
    setFormOpened(false);
    setDraftReads((n) => n + 1);
  }, []);

  return {
    view,
    formOpened,
    pick,
    deleteDraft,
    draftStored: view === "choose" && hydrated && hasStoredDraft(),
  };
}
