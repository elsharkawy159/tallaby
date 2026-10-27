/**
 * Motion presets and tokens, shared by the React helpers and the runtime.
 * Pure: no DOM and no GSAP, so they are unit tested and safe on the server.
 *
 * The variant names match the store sites' CSS motion (`data-reveal`,
 * packages/store-sections/src/elements/motion.ts), so a store section that
 * already carries `data-reveal="fade-up"` animates the same way under this
 * runtime. `fade-in` is an alias of `fade`; `scale-in` is new here.
 */

export const REVEAL_VARIANTS = ["fade-up", "fade", "zoom-in", "slide-start", "scale-in"] as const;
export type RevealVariant = (typeof REVEAL_VARIANTS)[number];

/** Names accepted from markup on top of the canonical ones. */
const ALIASES: Record<string, RevealVariant> = { "fade-in": "fade" };

/** Calm, short motion (owner brief, 2026-10-27): small distances, no bounce. */
export const MOTION = {
  /** Travel of a rise or slide, in px. */
  distance: 28,
  duration: 0.9,
  /** Gap between items of a stagger group, in seconds. */
  stagger: 0.08,
  ease: "power3.out",
  /** Long settle for photos and the pinned steps. */
  easeSoft: "expo.out",
  /** How far into the viewport an element must come before it plays. */
  start: "top 88%",
  /** Store `data-reveal-step` delay per step, in seconds (the CSS runtime's 90ms). */
  stepDelay: 0.09,
  /** Parallax travel per unit of `speed`, in px. */
  parallax: 120,
} as const;

export type MotionDirection = "ltr" | "rtl";

/** A `data-reveal` value from markup, or `null` when it names no variant (`none`, typos). */
export function normalizeVariant(raw: string | null | undefined): RevealVariant | null {
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  if (v === "" || v === "auto") return "fade-up";
  if (v in ALIASES) return ALIASES[v]!;
  return (REVEAL_VARIANTS as readonly string[]).includes(v) ? (v as RevealVariant) : null;
}

/** The hidden state a variant starts from. Only opacity and transforms. */
export function revealFrom(variant: RevealVariant, dir: MotionDirection, distance: number = MOTION.distance): Record<string, number> {
  switch (variant) {
    case "fade":
      return { opacity: 0 };
    case "fade-up":
      return { opacity: 0, y: distance };
    case "slide-start":
      // "Start" is the reading side: from the left in LTR, from the right in RTL.
      return { opacity: 0, x: dir === "rtl" ? distance : -distance };
    case "zoom-in":
      return { opacity: 0, scale: 1.06 };
    case "scale-in":
      return { opacity: 0, scale: 0.96, y: Math.round(distance / 2) };
  }
}

/** The transform origin of a bar that fills along the reading direction. */
export function fillOrigin(dir: MotionDirection): string {
  return dir === "rtl" ? "right center" : "left center";
}

/** A finite number from an attribute, else the fallback; clamped when bounds are given. */
export function parseNumber(raw: string | null | undefined, fallback: number, min = -Infinity, max = Infinity): number {
  const n = raw == null || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/**
 * The number a count-up ends on, read from its rendered text ("5", "1,080",
 * "٣٩"), with how to write it back. `null` when the text holds no number.
 */
export function parseCount(text: string): { value: number; arabicDigits: boolean; grouped: boolean } | null {
  const arabicDigits = /[٠-٩]/.test(text);
  const western = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/٬/g, ",");
  const match = western.match(/\d[\d,]*/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(value) ? { value, arabicDigits, grouped: match[0].includes(",") } : null;
}

/** Writes a count back in the digits and grouping it was rendered with. */
export function formatCount(value: number, { arabicDigits, grouped }: { arabicDigits: boolean; grouped: boolean }): string {
  const n = Math.round(value);
  const s = grouped ? n.toLocaleString("en-US") : String(n);
  return arabicDigits ? s.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d))).replace(/,/g, "٬") : s;
}
