/* Constants shared by the home page server and client code (no server imports here). */

/** Periods the home page can report on. */
export const HOME_RANGES = [7, 30, 90] as const;
export type HomeRange = (typeof HOME_RANGES)[number];

export function parseHomeRange(value: string | string[] | undefined): HomeRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (HOME_RANGES as readonly number[]).includes(n) ? (n as HomeRange) : 7;
}

/** Set when the seller hides the setup checklist. */
export const SETUP_DISMISS_COOKIE = "tl-home-setup-dismissed";
