"use client";

import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRealtimeRefresh } from "@/components/use-realtime-refresh";
import {
  playNotificationSound,
  unlockNotificationAudio,
} from "@/lib/play-notification-sound";
import { riderTopic } from "@/lib/realtime";

interface RiderRealtimeProps {
  /**
   * Resolved server-side in the rider layout from the authenticated session —
   * never accepted from the client. Subscribing to another rider's topic would
   * be refused by the RLS policy on `realtime.messages` regardless.
   */
  riderId: string;
}

function isNewAssignment(
  payload: Record<string, unknown>,
  riderId: string
): boolean {
  const op = payload.op;
  const status = payload.status;
  const assignedRiderId = payload.riderId;
  const prevRiderId = payload.prevRiderId;

  if (assignedRiderId !== riderId) return false;

  if (op === "INSERT") return true;

  return (
    op === "UPDATE" &&
    status === "assigned" &&
    prevRiderId !== riderId
  );
}

/**
 * One subscription for the rider surface, covering the deliveries list, a
 * delivery detail page, and the profile page. Every event on a rider's own
 * topic is relevant to them — a new assignment, a delivery reassigned away, a
 * status or COD change, a duty toggle from another device — so there is
 * nothing to filter for refresh. New assignments additionally play a sound
 * and show a toast.
 */
export function RiderRealtime({ riderId }: RiderRealtimeProps) {
  const t = useTranslations("rider");

  useEffect(() => {
    const unlock = () => unlockNotificationAudio();

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  const handleBroadcast = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (event !== "shipment") return;
      if (!isNewAssignment(payload, riderId)) return;

      playNotificationSound();
      toast.info(t("newDeliveryAssigned"));
    },
    [riderId, t]
  );

  useRealtimeRefresh({
    topic: riderTopic(riderId),
    shouldRefresh: () => true,
    onBroadcast: handleBroadcast,
  });

  return null;
}
