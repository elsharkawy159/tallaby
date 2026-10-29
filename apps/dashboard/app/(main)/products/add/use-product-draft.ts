"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { AddProductFormData } from "./add-product.schema";

const STORAGE_KEY = "tallaby:add-product-draft:v1";
const SAVE_DELAY_MS = 800;

export type DraftStatus = "idle" | "pending" | "saved";

interface StoredDraft {
  savedAt: number;
  values: AddProductFormData;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** JSON turns Dates into strings; turn the discount end dates back. */
function reviveDates(_key: string, value: unknown) {
  return typeof value === "string" && ISO_DATE.test(value) ? new Date(value) : value;
}

function readDraft(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw, reviveDates) as StoredDraft;
    return parsed?.values ? parsed : null;
  } catch {
    return null;
  }
}

/** A draft worth restoring has at least a name, an image or a price. */
function hasContent(values: Partial<AddProductFormData> | undefined) {
  if (!values) return false;
  return Boolean(
    values.localized?.en?.title?.trim() ||
      values.localized?.ar?.title?.trim() ||
      (values.images?.length ?? 0) > 0 ||
      (typeof values.price?.list === "number" && values.price.list > 0)
  );
}

/**
 * Keeps the unpublished product in localStorage so a refresh, a crash or a
 * closed tab doesn't lose the seller's work. Restores once on mount.
 */
export function useProductDraft(
  form: UseFormReturn<AddProductFormData>,
  { enabled = true, onRestore }: { enabled?: boolean; onRestore?: () => void } = {}
) {
  const [status, setStatus] = useState<DraftStatus>("idle");
  /** A draft with content is stored (shows the "Clear" button). */
  const [hasDraft, setHasDraft] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);
  const paused = useRef(false);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const write = useCallback(() => {
    if (paused.current) return;
    const values = form.getValues();
    try {
      if (hasContent(values)) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ savedAt: Date.now(), values } satisfies StoredDraft)
        );
        setHasDraft(true);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        setHasDraft(false);
      }
      setStatus("saved");
    } catch {
      // Storage full or blocked (private mode) — autosave is best effort.
      setStatus("idle");
    }
  }, [form]);

  useEffect(() => {
    if (!enabled || restored.current) return;
    restored.current = true;
    const draft = readDraft();
    if (draft && hasContent(draft.values)) {
      form.reset({ ...form.getValues(), ...draft.values });
      setStatus("saved");
      setHasDraft(true);
      onRestoreRef.current?.();
    }
  }, [enabled, form]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = form.watch(() => {
      if (paused.current) return;
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(write, SAVE_DELAY_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, form, write]);

  /** Save right now (the "Save draft" button). */
  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    write();
  }, [write]);

  /** Forget the stored draft, e.g. after publishing or "Start over". */
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setStatus("idle");
    setHasDraft(false);
  }, []);

  /** Stop autosaving (while the page reloads after publishing). */
  const pause = useCallback(() => {
    paused.current = true;
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { status, hasDraft, saveNow, clear, pause };
}
