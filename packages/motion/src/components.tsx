/**
 * Markup helpers: each renders a plain element with the `data-*` attributes
 * the runtime reads (README "Data attributes"). They hold no state and no
 * effects, so server components use them directly; what they render is the
 * final, visible layout until the runtime (`MotionScope`) takes over.
 */
import * as React from "react";
import type { RevealVariant } from "./presets";

type PolyProps<T extends React.ElementType, P> = P & { as?: T } & Omit<React.ComponentPropsWithoutRef<T>, keyof P | "as">;

function attr(value: number | undefined): string | undefined {
  return value == null ? undefined : String(value);
}

/** Plays once, the first time it scrolls into view. `delay` is in seconds. */
export function Reveal<T extends React.ElementType = "div">({ as, variant = "fade-up", delay, ...props }: PolyProps<T, { variant?: RevealVariant; delay?: number }>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-reveal={variant} data-reveal-delay={attr(delay)} {...props} />;
}

/**
 * Its children play in sequence as they come into view (cards, badges,
 * steps). Mark items with `data-stagger-item` when they are not the direct
 * children. `stagger` is the gap in seconds.
 */
export function StaggerChildren<T extends React.ElementType = "div">({
  as,
  variant = "fade-up",
  stagger,
  ...props
}: PolyProps<T, { variant?: RevealVariant; stagger?: number }>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-stagger={attr(stagger) ?? ""} data-stagger-variant={variant} {...props} />;
}

/**
 * Drifts up a little slower than the page while it crosses the viewport
 * (tablet and up, never with reduced motion). `speed` 0.1–0.3 reads as subtle.
 * The runtime moves this wrapper, so put it around an element that has its
 * own transforms rather than on it.
 */
export function ParallaxImage<T extends React.ElementType = "div">({ as, speed = 0.15, ...props }: PolyProps<T, { speed?: number }>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-parallax={String(speed)} {...props} />;
}

/**
 * Counts up to the number already rendered inside, once it is visible.
 * Tabular figures keep every digit the same width, so counting never nudges the text around it.
 */
export function CountUp<T extends React.ElementType = "span">({ as, from, style, ...props }: PolyProps<T, { from?: number }>) {
  const Comp = (as ?? "span") as React.ElementType;
  return <Comp data-count-up={attr(from) ?? ""} style={{ fontVariantNumeric: "tabular-nums", ...(style as React.CSSProperties | undefined) }} {...props} />;
}

/**
 * A short sequence pinned while the visitor scrolls through it (desktop with
 * room only): `PinnedStep`s light up one after another and a `PinnedProgress`
 * bar fills along the reading direction. Elsewhere the steps just stagger in.
 */
export function PinnedSteps<T extends React.ElementType = "div">({ as, ...props }: PolyProps<T, object>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-pin="" {...props} />;
}

export function PinnedStep<T extends React.ElementType = "div">({ as, ...props }: PolyProps<T, object>) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-pin-step="" {...props} />;
}

/** Decorative fill bar. Rendered invisible; the runtime shows it only while pinning. */
export function PinnedProgress({ className, style, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return <span aria-hidden data-pin-progress="" className={className} style={{ opacity: 0, ...style }} {...props} />;
}
