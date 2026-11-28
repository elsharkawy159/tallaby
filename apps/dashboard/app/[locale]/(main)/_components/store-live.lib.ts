import type { LiveSite } from "./publish-celebration.client";

/**
 * A never-published store that goes live by itself (a template applied, or
 * its first product published; `autoPublishStore`) gets the same "Your store
 * is live!" dialog as the Publish button. The page that caused it hands the
 * server's live site to `announceStoreLive`; the one `StoreLiveCelebration`
 * mounted in the (main) layout shows the dialog, so it survives the page
 * navigating away right after the save.
 */
export const STORE_LIVE_EVENT = "tallaby:store-live";

/** The event's payload, checked: only an http(s) URL and a plain hostname. */
export function parseLiveSite(value: unknown): LiveSite | null {
  if (!value || typeof value !== "object") return null;
  const { url, hostname } = value as Record<string, unknown>;
  if (typeof url !== "string" || typeof hostname !== "string" || !hostname) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }
  return { url, hostname };
}

/** Shows the go-live dialog for the live site an action returned; nothing when it returned none. */
export function announceStoreLive(live: LiveSite | null | undefined): void {
  if (typeof window === "undefined" || !parseLiveSite(live)) return;
  window.dispatchEvent(new CustomEvent<LiveSite>(STORE_LIVE_EVENT, { detail: live! }));
}

const QUEUED_KEY = "tallaby:store-live";

/**
 * For a page that does a full load right after the save (the add-product
 * form): keeps the live site for the next page, where `StoreLiveCelebration`
 * shows it once (`takeQueuedStoreLive`).
 */
export function queueStoreLive(live: LiveSite | null | undefined): void {
  const site = parseLiveSite(live);
  if (!site) return;
  try {
    window.sessionStorage.setItem(QUEUED_KEY, JSON.stringify(site));
  } catch {
    // Storage blocked: the store is live all the same, Website › Overview shows it.
  }
}

/** The live site queued before a full page load, once; null when there is none. */
export function takeQueuedStoreLive(): LiveSite | null {
  try {
    const raw = window.sessionStorage.getItem(QUEUED_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(QUEUED_KEY);
    return parseLiveSite(JSON.parse(raw));
  } catch {
    return null;
  }
}
