"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useRealtimeRefresh } from "@/components/use-realtime-refresh";
import {
  isNewPendingOrder,
  isNewPendingShipment,
} from "@/lib/pending-notification";
import {
  playPendingNotificationSound,
  unlockNotificationAudio,
} from "@/lib/play-notification-sound";
import { DISPATCH_TOPIC, type ShippingRealtimeEvent } from "@/lib/realtime";

/**
 * Which events are worth re-rendering each admin section for, keyed by the
 * first path segment. An event that isn't listed is dropped without a refresh
 * — a rider going off duty should not re-query the providers table.
 *
 * Sections not listed here (and `/providers`, listed empty on purpose) opt out
 * entirely: providers are edited by the same admins looking at the page, so
 * there is nothing to learn from another client.
 */
const REFRESH_ON: Record<string, ShippingRealtimeEvent[]> = {
  // Dashboard: shipment stats, operational counters, recent shipments.
  "": ["shipment", "order"],
  orders: ["shipment", "order"],
  batches: ["shipment", "batch"],
  riders: ["shipment", "rider"],
  providers: [],
};

/**
 * One subscription for the whole admin session, mounted in the layout so
 * navigating between sections never tears the channel down and rebuilds it.
 * The pathname only decides whether an arriving event matters.
 */
const PENDING_SOUND_DEBOUNCE_MS = 500;

export function DispatchRealtime() {
  const pathname = usePathname();
  const section = pathname.split("/")[1] ?? "";
  const soundDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unlock = () => unlockNotificationAudio();

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      if (soundDebounceRef.current) clearTimeout(soundDebounceRef.current);
    };
  }, []);

  const playPendingSound = useCallback(() => {
    if (soundDebounceRef.current) return;

    playPendingNotificationSound();
    soundDebounceRef.current = setTimeout(() => {
      soundDebounceRef.current = null;
    }, PENDING_SOUND_DEBOUNCE_MS);
  }, []);

  const handleBroadcast = useCallback(
    (event: ShippingRealtimeEvent, payload: Record<string, unknown>) => {
      if (section !== "orders") return;

      const isPending =
        (event === "order" && isNewPendingOrder(payload)) ||
        (event === "shipment" && isNewPendingShipment(payload));

      if (isPending) playPendingSound();
    },
    [section, playPendingSound]
  );

  useRealtimeRefresh({
    topic: DISPATCH_TOPIC,
    shouldRefresh: (event) => (REFRESH_ON[section] ?? []).includes(event),
    onBroadcast: handleBroadcast,
  });

  return null;
}
