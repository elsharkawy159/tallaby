"use client";

import { useEffect } from "react";
import {
  CAMPAIGN_COOKIE,
  CAMPAIGN_COOKIE_MAX_AGE_SECONDS,
  encodeCampaignCookie,
  parseCampaignTouch,
} from "@workspace/lib/campaigns/utm";

/**
 * Campaign tracking (ROADMAP.md F-26a): keeps the first touch (utm_*, ad
 * click ids, outside referrer, landing path) in a host-only first-party
 * cookie for 30 days. Runs in the browser after load, so storefront pages
 * stay cached; checkout copies the cookie onto the order (reporting only).
 * A later visit never overwrites it; a direct visit sets nothing.
 */
export function CampaignCapture() {
  useEffect(() => {
    try {
      if (document.cookie.split("; ").some((c) => c.startsWith(`${CAMPAIGN_COOKIE}=`))) return;
      const touch = parseCampaignTouch({
        search: window.location.search,
        pathname: window.location.pathname,
        referrer: document.referrer,
        ownHost: window.location.hostname,
      });
      if (!touch) return;
      const value = encodeCampaignCookie(touch);
      if (!value) return;
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${CAMPAIGN_COOKIE}=${value}; Max-Age=${CAMPAIGN_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    } catch {
      // Cookies blocked: no attribution, nothing else changes.
    }
  }, []);
  return null;
}
