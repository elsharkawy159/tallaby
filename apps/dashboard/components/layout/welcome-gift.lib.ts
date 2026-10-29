/**
 * The welcome gift popup (0119) listens for this event, so a page that just
 * published a store can ask it to check right away instead of waiting for the
 * next page change.
 */
export const WELCOME_GIFT_CHECK_EVENT = "tallaby:welcome-gift-check";

export function requestWelcomeGiftCheck(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WELCOME_GIFT_CHECK_EVENT));
}
