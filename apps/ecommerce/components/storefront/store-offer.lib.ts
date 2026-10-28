/**
 * Browser-side timing of the store's coupon pop-up (0114). The visitor's
 * pop-up time lives in localStorage on the store host, so the pop-up shows
 * once per visitor and the product page countdown survives reloads.
 */

export const shownAtKey = (couponId: string) => `tallaby:offer:${couponId}`;
/** A random-time pop-up's moment, kept for the browsing session so page changes don't restart it. */
export const randomAtKey = (couponId: string) => `tallaby:offer-at:${couponId}`;

/** "enter": a short pause after arrival, so the page is seen first. */
export const ENTER_DELAY_MS = 2500;
/** "random": somewhere between 10 seconds and a minute and a half into the visit. */
export const RANDOM_MIN_MS = 10_000;
export const RANDOM_MAX_MS = 90_000;
/** "exit": not in the first seconds, when a stray mouse move is not a real exit. */
export const EXIT_ARM_MS = 3000;

export function randomDelay(random: number): number {
  return Math.round(RANDOM_MIN_MS + random * (RANDOM_MAX_MS - RANDOM_MIN_MS));
}

/**
 * Phones have no mouse leaving the window: a fast scroll back up after the
 * visitor went down the page reads as heading for the address bar or back.
 */
export function isPhoneExitScroll(maxY: number, fromY: number, toY: number, ms: number): boolean {
  return maxY > 600 && fromY - toY > 150 && ms < 400;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // Private mode or blocked storage: the pop-up still works for this page.
  }
}
