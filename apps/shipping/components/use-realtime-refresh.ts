"use client";

import { useMemo } from "react";
import { useRealtimeRefresh as useSharedRealtimeRefresh } from "@workspace/ui/hooks/use-realtime-refresh";

import { createClient } from "@/supabase/client";
import { isShippingRealtimeEvent, type ShippingRealtimeEvent } from "@/lib/realtime";

/**
 * The browser Supabase client is memoized at module scope so React Strict
 * Mode's double-mount (and any second caller) reuses one WebSocket rather than
 * opening a second.
 */
let browserClient: ReturnType<typeof createClient> | null = null;

function getBrowserClient() {
  browserClient ??= createClient();
  return browserClient;
}

interface UseRealtimeRefreshOptions {
  /** `null` disables the subscription entirely. */
  topic: string | null;
  /** Whether an event warrants re-running the current route's server queries. */
  shouldRefresh: (event: ShippingRealtimeEvent) => boolean;
  /** Optional side-effect on each broadcast (e.g. notification sound). */
  onBroadcast?: (event: ShippingRealtimeEvent, payload: Record<string, unknown>) => void;
}

/**
 * This app's binding for the shared realtime→refresh hook: it supplies the
 * shipping browser client and narrows the event name to the union the
 * dispatch triggers actually publish, so an unrecognised event is dropped
 * rather than triggering a refresh.
 */
export function useRealtimeRefresh({
  topic,
  shouldRefresh,
  onBroadcast,
}: UseRealtimeRefreshOptions) {
  const client = useMemo(() => getBrowserClient(), []);

  useSharedRealtimeRefresh({
    client,
    topic,
    shouldRefresh: (event) => isShippingRealtimeEvent(event) && shouldRefresh(event),
    onBroadcast: onBroadcast
      ? (event, payload) => {
          if (isShippingRealtimeEvent(event)) {
            onBroadcast(event, payload);
          }
        }
      : undefined,
  });
}
