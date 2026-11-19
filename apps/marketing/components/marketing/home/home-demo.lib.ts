/** Pure maths behind the home page's demos and the templates carousel. */

/** The hero dashboard's sample wallet balance in USD cents; the hero server part shows it as "≈ … جنيه" at the live rate. */
export const HERO_DEMO_WALLET_USD_CENTS = 1240;

/** `i` wrapped into 0..n-1. */
export function wrapIndex(i: number, n: number): number {
  return n > 0 ? ((i % n) + n) % n : 0;
}

/** How far card `i` sits from the carousel position, by the short way round. */
export function carouselOffset(i: number, position: number, n: number): number {
  if (n <= 0) return 0;
  const raw = ((i - position) % n + n) % n;
  return raw > n / 2 ? raw - n : raw;
}

/** A card's scale, opacity and stacking for its distance from the centre. */
export function carouselCardStyle(offset: number): { scale: number; opacity: number; zIndex: number } {
  const a = Math.abs(offset);
  const opacity = a > 2.5 ? 0 : a > 2 ? (2.5 - a) * 0.9 : a > 1 ? 0.85 - (a - 1) * 0.4 : 1 - a * 0.15;
  return { scale: 1 - 0.13 * Math.min(a, 3), opacity, zIndex: 10 - Math.round(a) };
}
