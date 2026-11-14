"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { clarityTagSrc, identifySeller, isClarityAllowedHere } from "@/lib/analytics/clarity.lib";

const noopSubscribe = () => () => {};

/** False on the server and in the first client render, then the real host/frame check. */
function useClarityAllowedHere(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => isClarityAllowedHere(window),
    () => false,
  );
}

/**
 * Microsoft Clarity's tag (root layout). The root layout renders it only when
 * `shouldLoadClarity` passed; here it loads only on dashboard.tallaby.com in
 * the top window. next/script loads it once across client navigations.
 */
export function ClarityScript({ projectId }: { projectId: string }) {
  const allowed = useClarityAllowedHere();
  if (!allowed) return null;
  return <Script id="ms-clarity" src={clarityTagSrc(projectId)} strategy="afterInteractive" />;
}

/**
 * Tags the session with the seller's internal id and plan only (no name,
 * email or phone). Mounted by the (main) and (builder) layouts; a no-op where
 * Clarity does not run, and queued until the tag loads.
 */
export function ClarityIdentify({ sellerId, plan }: { sellerId: string; plan: string | null }) {
  useEffect(() => {
    identifySeller(window, sellerId, plan);
  }, [sellerId, plan]);
  return null;
}
