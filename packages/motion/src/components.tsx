/**
 * Markup helpers: each renders a plain element with the `data-animate`
 * attributes the runtime reads (README). They hold no state and no effects,
 * so server components use them directly. What they render is the final,
 * visible layout; `AnimationObserver` only hides what is still below the fold.
 */
import * as React from "react";
import { normalizePreset, type AnimationPreset } from "./presets";

type PolyProps<T extends React.ElementType, P> = P & { as?: T } & Omit<React.ComponentPropsWithoutRef<T>, keyof P | "as">;

/** A preset name, or an old one from the first pilot (`scale-in` is now `zoom-in`, `fade-in` is `fade`). */
export type RevealVariant = Exclude<AnimationPreset, "stagger"> | "scale-in" | "fade-in" | "none";

function withVars(style: unknown, vars: Record<string, string | undefined>): React.CSSProperties | undefined {
  const set = Object.entries(vars).filter((entry): entry is [string, string] => entry[1] != null);
  if (set.length === 0) return style as React.CSSProperties | undefined;
  return { ...(style as React.CSSProperties | undefined), ...Object.fromEntries(set) };
}

/** Seconds (the helpers' unit) as a CSS time. */
function ms(seconds: number | undefined): string | undefined {
  return seconds == null ? undefined : `${Math.round(seconds * 1000)}ms`;
}

/** Plays once, the first time it scrolls into view. `delay` is in seconds. */
export function Reveal<T extends React.ElementType = "div">({ as, variant = "fade-up", delay, style, ...props }: PolyProps<T, { variant?: RevealVariant; delay?: number; style?: React.CSSProperties }>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-animate={normalizePreset(variant) ?? "none"} style={withVars(style, { "--anim-delay": ms(delay) })} {...props} />;
}

/**
 * Its items play in turn as they come into view (cards, badges, steps): the
 * children marked `data-animate-item`, else its direct children. `stagger` is
 * the gap in seconds; `variant` is how each item enters.
 */
export function StaggerChildren<T extends React.ElementType = "div">({
  as,
  variant = "fade-up",
  stagger,
  style,
  ...props
}: PolyProps<T, { variant?: RevealVariant; stagger?: number; style?: React.CSSProperties }>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-animate="stagger" data-animate-variant={normalizePreset(variant) ?? "none"} style={withVars(style, { "--anim-stagger": ms(stagger) })} {...props} />;
}

/**
 * Counts up to the number already rendered inside, once it is visible.
 * Tabular figures keep every digit the same width, so counting never nudges the text around it.
 */
export function CountUp<T extends React.ElementType = "span">({ as, from, style, ...props }: PolyProps<T, { from?: number; style?: React.CSSProperties }>) {
  const Comp = (as ?? "span") as React.ElementType;
  return <Comp data-count-up={from == null ? "" : String(from)} style={{ fontVariantNumeric: "tabular-nums", ...style }} {...props} />;
}

/**
 * A plain wrapper, kept so pages written for the first pilot still compile.
 * Animations no longer need a scope: `AnimationObserver` in the marketing
 * layout covers the whole page.
 */
export function MotionScope({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-motion-scope="" className={className}>
      {children}
    </div>
  );
}
