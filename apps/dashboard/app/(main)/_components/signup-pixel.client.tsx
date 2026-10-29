"use client";

import { useEffect } from "react";
import { metaPhoneDigits, signupEventParams, type SignupMethod } from "@workspace/lib/integrations";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TRACKED_KEY = "tallaby:meta-signup";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

/** Meta's base pixel loader (the standard snippet, without its PageView). */
function loadFbq(): Fbq {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return w.fbq;
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as Fbq;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  w.fbq = n;
  if (!w._fbq) w._fbq = n;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  return n;
}

/**
 * Tallaby's own pixel, loaded only here (the dashboard has no other Meta
 * tracking), fires CompleteRegistration once per account and browser, then
 * drops `signup` from the URL so a refresh does not fire again. The event id
 * matches the server CAPI event, so Meta counts one signup.
 */
export function SignupPixel({
  eventId,
  method,
  email,
  phone,
}: {
  eventId: string;
  method: SignupMethod;
  email: string | null;
  phone: string | null;
}) {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("signup");
    window.history.replaceState(window.history.state, "", url);

    try {
      if (window.localStorage.getItem(TRACKED_KEY) === eventId) return;
      window.localStorage.setItem(TRACKED_KEY, eventId);
    } catch {
      // Storage blocked: the shared event id still deduplicates at Meta.
    }
    if (!PIXEL_ID) return;
    try {
      const fbq = loadFbq();
      // Manual advanced matching; the pixel hashes these before sending.
      const userData: Record<string, string> = {};
      const em = email?.trim().toLowerCase();
      const ph = metaPhoneDigits(phone);
      if (em) userData.em = em;
      if (ph) userData.ph = ph;
      fbq("init", PIXEL_ID, userData);
      fbq("track", "CompleteRegistration", signupEventParams(method), { eventID: eventId });
    } catch {
      // Ad blockers must never break the dashboard.
    }
  }, [eventId, method, email, phone]);

  return null;
}
