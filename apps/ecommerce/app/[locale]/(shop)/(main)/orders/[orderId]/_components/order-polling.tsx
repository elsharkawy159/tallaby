"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

const POLL_INTERVAL_MS = 15_000;

interface OrderPollingProps {
  enabled: boolean;
}

/**
 * Limited realtime for guests: polls while the tab is visible because guests
 * have no Supabase JWT to join the private order topic.
 */
export function OrderPolling({ enabled }: OrderPollingProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, router]);

  return null;
}
