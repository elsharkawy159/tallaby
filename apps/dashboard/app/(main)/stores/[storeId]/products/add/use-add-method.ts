"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { resolveAddView, type AddEntry } from "./add-method.lib";
import { hasStoredDraft } from "./use-product-draft";

const subscribeNever = () => () => {};

/** Where focus lands after each change of view; the page also returns to the top. */
const FOCUS_TARGET = {
  choose: "add-method-title",
  ai: "ai-stage-title",
  manual: "add-product-title",
} as const;

/**
 * The view on /products/add. The URL holds the method, through the History API
 * (next/navigation stays in sync with no server round trip), so the back button and
 * a reload behave. The stored draft is checked once when the page opens: pressing
 * back after typing still reaches the choice.
 */
export function useAddMethod(aiEnabled: boolean) {
  const param = useSearchParams().get("method");
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [entry, setEntry] = useState<AddEntry>("pending");
  if (hydrated && entry === "pending") setEntry(hasStoredDraft() ? "draft" : "fresh");

  const view = resolveAddView(param, entry, aiEnabled);

  // Once open, the form stays mounted (hidden) so its values, a running AI fill
  // and the autosave timer all survive a visit to the choice.
  const [formOpened, setFormOpened] = useState(false);
  if (!formOpened && (view === "ai" || view === "manual")) setFormOpened(true);

  // A draft opened the form on its own: name that in the URL, so a reload stays there.
  const resumedDraft = !param && view === "manual";
  useEffect(() => {
    if (resumedDraft) window.history.replaceState(null, "", "?method=manual");
  }, [resumedDraft]);

  const previous = useRef(view);
  useEffect(() => {
    const from = previous.current;
    previous.current = view;
    if (from === view || from === "pending" || view === "pending") return;
    window.scrollTo(0, 0);
    document.getElementById(FOCUS_TARGET[view])?.focus({ preventScroll: true });
  }, [view]);

  const pick = useCallback((method: "ai" | "manual" | "choose") => {
    window.history.pushState(null, "", `?method=${method}`);
  }, []);

  return {
    view,
    formOpened,
    pick,
    draftStored: view === "choose" && hydrated && hasStoredDraft(),
  };
}
