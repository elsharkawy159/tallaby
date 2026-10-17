"use client"

import { useEffect } from "react"

/**
 * Fires a one-shot page-view beacon for a published user website. Mounted on
 * public site pages (which are ISR-cached, so server-side counting is
 * unreliable). Uses `navigator.sendBeacon` when available so the request
 * survives navigation. `visitors` is approximated per browser session via
 * sessionStorage — the first view in a session is flagged `newVisitor`.
 */
export function PageViewBeacon({
  websiteId,
  slug,
}: {
  websiteId: string
  slug: string
}) {
  useEffect(() => {
    if (!websiteId) return

    let newVisitor = false
    try {
      const key = `vc_seen_${websiteId}`
      newVisitor = sessionStorage.getItem(key) === null
      if (newVisitor) sessionStorage.setItem(key, "1")
    } catch {
      // Private mode / storage disabled — treat as a returning visitor.
    }

    const payload = JSON.stringify({ websiteId, slug, newVisitor })
    const url = "/api/track-view"

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }))
        return
      }
    } catch {
      // fall through to fetch
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  }, [websiteId, slug])

  return null
}
