"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Turns a private Supabase broadcast topic into a debounced `router.refresh()`.
 *
 * The apps here render their lists as Server Components and mutate through
 * Server Actions; there is no client-side cache to patch. `router.refresh()`
 * re-runs only the current route's server work and merges the result without
 * discarding client state — selections, open dialogs, scroll position and
 * (because they live in the URL) filters and pagination all survive. That is
 * what lets realtime be additive instead of forcing a rewrite into client-side
 * data fetching.
 *
 * The client is passed in rather than constructed here so this package stays
 * free of Supabase configuration; each app supplies its own browser client.
 *
 * Authorization is never done here. Topics are private, so Postgres evaluates
 * the RLS policies on `realtime.messages` at join time and refuses a topic the
 * viewer may not read — nothing is filtered in React.
 */

export interface UseRealtimeRefreshOptions {
  /** The app's browser Supabase client. Memoize it; a new client each render would reopen the socket. */
  client: SupabaseClient;
  /** `null` disables the subscription entirely (e.g. a signed-out viewer). */
  topic: string | null;
  /**
   * Whether an event warrants re-running the route's server work. Read through
   * a ref, so a caller may close over changing values (a pathname, a filter)
   * without tearing the channel down and rebuilding it.
   */
  shouldRefresh?: (event: string) => boolean;
  /**
   * Coalescing window. A burst — one message per row of a bulk write — must
   * produce a single refresh, not one per message.
   */
  debounceMs?: number;
  /**
   * Optional side-effect invoked on every broadcast before a refresh is
   * scheduled — e.g. play a notification sound when a new assignment arrives.
   * Read through a ref so the channel is not torn down when the callback
   * identity changes.
   */
  onBroadcast?: (event: string, payload: Record<string, unknown>) => void;
}

export function useRealtimeRefresh({
  client,
  topic,
  shouldRefresh,
  debounceMs = 400,
  onBroadcast,
}: UseRealtimeRefreshOptions) {
  const router = useRouter();

  const shouldRefreshRef = useRef(shouldRefresh);
  shouldRefreshRef.current = shouldRefresh;

  const onBroadcastRef = useRef(onBroadcast);
  onBroadcastRef.current = onBroadcast;

  // `useRouter()` does not return a stable identity across renders, and having
  // it in the effect's dependencies tore the channel down and rebuilt it on an
  // unrelated re-render. Read through a ref so the subscription's lifetime is
  // driven only by the topic.
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!topic) return;

    // Guards the async setup below: an effect cleaned up before `setAuth()`
    // resolves must not leave a subscribed channel behind. React Strict Mode's
    // mount/unmount/mount in development hits this every time.
    let active = true;
    let channel: RealtimeChannel | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let hasSubscribed = false;
    let pendingRefresh = false;

    const flush = () => {
      if (!pendingRefresh) return;
      // A hidden tab refreshing on every event would keep querying for a
      // screen nobody is looking at. Stay pending and settle on the way back.
      if (document.visibilityState === "hidden") return;
      pendingRefresh = false;
      routerRef.current.refresh();
    };

    const scheduleRefresh = () => {
      // Marked here rather than inside the timer, which is the whole point:
      // browsers throttle timers in hidden tabs to about once a minute and may
      // discard them outright when a tab is frozen. With the flag set only in
      // the callback, a background tab could come back to the foreground, find
      // nothing pending, and drop the update permanently.
      pendingRefresh = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, debounceMs);
    };

    const onVisibilityChange = () => {
      // No debounce on the way back: the wait already happened while hidden.
      if (document.visibilityState === "visible") flush();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // The socket authenticates with the viewer's JWT; without this a private
    // channel is refused. Re-applied on auth changes so a long-lived session
    // survives token rotation.
    const { data: authListener } = client.auth.onAuthStateChange(() => {
      void client.realtime.setAuth();
    });

    const subscribe = async () => {
      await client.realtime.setAuth();
      if (!active) return;

      channel = client
        .channel(topic, { config: { private: true } })
        .on("broadcast", { event: "*" }, (message) => {
          const event = typeof message.event === "string" ? message.event : "";
          const payload =
            message.payload && typeof message.payload === "object"
              ? (message.payload as Record<string, unknown>)
              : {};

          onBroadcastRef.current?.(event, payload);

          if (shouldRefreshRef.current && !shouldRefreshRef.current(event)) return;
          scheduleRefresh();
        })
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") return;

          if (hasSubscribed) {
            // A re-subscribe means the socket dropped and came back. Messages
            // sent during the gap are gone, so the only way back to a correct
            // screen is to refetch once.
            scheduleRefresh();
          }
          hasSubscribed = true;
        });

      // Created after the teardown ran; drop it immediately.
      if (!active) {
        void client.removeChannel(channel);
        channel = null;
      }
    };

    void subscribe();

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      authListener.subscription.unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) void client.removeChannel(channel);
    };
    // `shouldRefresh` and `router` are deliberately absent — both are read
    // through refs so a new closure never reopens the channel.
  }, [client, topic, debounceMs]);
}
