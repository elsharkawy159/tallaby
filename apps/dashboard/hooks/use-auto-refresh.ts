"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the current route's server components every `intervalMs` while
 * the tab is visible, and once on coming back to a tab that was hidden for
 * longer than that. Hidden tabs never poll. The server data stays behind its
 * own cache, so this only re-reads what the cache already allows.
 */
export function useAutoRefresh(intervalMs: number, enabled = true) {
  const router = useRouter();
  const last = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      last.current = Date.now();
      router.refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last.current >= intervalMs) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs, enabled]);
}
