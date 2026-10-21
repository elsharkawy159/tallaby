"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Which sidebar groups the admin opened or closed, remembered per browser.
 * A group with no saved choice is open only while it holds the current page.
 * Storage can be blocked (private windows), so every access is guarded and
 * the sidebar still works with nothing saved.
 */
const STORAGE_KEY = "tallaby-admin.sidebar-groups";
const listeners = new Set<() => void>();
/** Used when localStorage throws, so toggling still works for this visit. */
let memory: string | null = null;

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memory;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parse(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
    );
  } catch {
    return {};
  }
}

export function useSidebarGroups(activeKey: string | null) {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const saved = useMemo(() => parse(raw), [raw]);

  const isOpen = useCallback((key: string) => saved[key] ?? key === activeKey, [saved, activeKey]);

  const setOpen = useCallback(
    (key: string, open: boolean) => {
      memory = JSON.stringify({ ...saved, [key]: open });
      try {
        window.localStorage.setItem(STORAGE_KEY, memory);
      } catch {
        // Blocked storage: `read` falls back to `memory`.
      }
      listeners.forEach((listener) => listener());
    },
    [saved],
  );

  return { isOpen, setOpen };
}
