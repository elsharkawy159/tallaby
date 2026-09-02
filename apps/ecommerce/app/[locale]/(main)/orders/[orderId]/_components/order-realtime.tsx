"use client";

import { useMemo } from "react";
import { useRealtimeRefresh } from "@workspace/ui/hooks/use-realtime-refresh";

import { createClient } from "@/supabase/client";

/**
 * Memoized at module scope so React Strict Mode's double-mount reuses one
 * WebSocket instead of opening a second.
 */
let browserClient: ReturnType<typeof createClient> | null = null;

function getBrowserClient() {
  browserClient ??= createClient();
  return browserClient;
}

interface OrderRealtimeProps {
  orderId: string;
}

/**
 * Keeps the order tracking page current while the customer watches it — the
 * status tracker advances from Confirmed to Out for delivery to Delivered as
 * the rider works, with no manual reload.
 *
 * `order:<id>` is a private topic: Postgres checks at join time that the
 * signed-in user owns this order (see can_read_order_topic in
 * 0022_shipping_automation.sql), so the id in the URL is not by itself enough
 * to subscribe. The broadcast carries only the order id and a status string —
 * the page still refetches everything it displays through the existing
 * owner-scoped server query.
 *
 * Rendered only for an authenticated owner: a guest checkout has a cookie
 * identity rather than a Supabase session, so there is no JWT to authorize a
 * private channel with. Their page simply does not live-update.
 */
export function OrderRealtime({ orderId }: OrderRealtimeProps) {
  const client = useMemo(() => getBrowserClient(), []);

  useRealtimeRefresh({
    client,
    topic: `order:${orderId}`,
    // A single order sees a handful of events over days, never the bursts a
    // dispatch list does, so this only needs to coalesce a status write and
    // its matching shipment write landing in the same transaction.
    debounceMs: 250,
  });

  return null;
}
