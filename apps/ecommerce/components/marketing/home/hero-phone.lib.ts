import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { pickHomeTemplates } from "./home-templates.lib";

/** A template's phone screenshot, as the hero phone needs it (nothing else goes to the browser). */
export type HeroPhoneShot = { src: string; width: number; height: number };

/** How many shots the page sends to the hero phone: about one per industry. */
export const HERO_PHONE_SHOT_COUNT = 10;

/** The phone screen's height over its width (9:19). */
export const HERO_PHONE_SCREEN_RATIO = 19 / 9;

/**
 * The shots the hero phone chooses from (owner, 2026-11-17): templates of
 * different industries that have a phone screenshot, one random design each
 * (pickHomeTemplates). The page is rebuilt once a minute, so the browser makes
 * the final pick (pickHeroPhoneShot): a different template on every load.
 */
export function heroPhoneShots(
  entries: readonly GalleryEntry[],
  count: number = HERO_PHONE_SHOT_COUNT,
  random: () => number = Math.random,
): HeroPhoneShot[] {
  const withPhoneShot = entries.filter((entry) => entry.shot?.mobile);
  return pickHomeTemplates(withPhoneShot, count, random).map((entry) => {
    const { src, width, height } = entry.shot!.mobile!;
    return { src, width, height };
  });
}

/** One of the shots from a random number in 0..1 (`Math.random()`); null when there is none. */
export function pickHeroPhoneShot<T>(shots: readonly T[], random: number): T | null {
  if (!shots.length) return null;
  return shots[Math.min(shots.length - 1, Math.max(0, Math.floor(random * shots.length)))]!;
}

/**
 * Seconds the phone takes to scroll its shot one way: about 5 s per screen of
 * page below the first, 12–30 s (owner, 2026-11-17: slow and smooth).
 */
export function heroPhoneTourSeconds(width: number, height: number): number {
  if (!(width > 0) || !(height > 0)) return 12;
  const below = height / width / HERO_PHONE_SCREEN_RATIO - 1;
  return Math.round(Math.min(30, Math.max(12, below * 5)) * 10) / 10;
}
