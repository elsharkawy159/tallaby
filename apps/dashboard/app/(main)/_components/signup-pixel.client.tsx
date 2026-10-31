"use client";

import { useEffect } from "react";
import { trackTallabySignup, type SignupMethod } from "@workspace/lib/integrations";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Tallaby's CompleteRegistration, once per account and browser, on the same
 * pixel the root layout loads (the shared helper queues it on Meta's stub if
 * fbevents.js has not arrived yet). Only after the event is queued does it
 * drop `signup` from the URL, so a refresh does not fire again. The event id
 * matches the server CAPI event, so Meta counts one signup. No personal data.
 */
export function SignupPixel({ eventId, method }: { eventId: string; method: SignupMethod }) {
  useEffect(() => {
    trackTallabySignup(PIXEL_ID, eventId, method);
    const url = new URL(window.location.href);
    url.searchParams.delete("signup");
    window.history.replaceState(window.history.state, "", url);
  }, [eventId, method]);

  return null;
}
