/**
 * Load-time intro for the first screen (hero). Unlike the scroll presets this
 * is plain CSS (`animations.css`, `[data-intro]`): it starts with the first paint,
 * without waiting for JavaScript, so the hero headline (the LCP element) is
 * on screen within a few frames and never flashes visible → hidden → visible
 * at hydration. The animation always ends visible, and reduced motion turns
 * it off. Server-safe.
 */
import * as React from "react";

type IntroVariant = "fade-up" | "fade" | "float";

function delayStyle(delay: number | undefined, style?: React.CSSProperties): React.CSSProperties | undefined {
  if (delay == null) return style;
  return { ...style, ["--intro-delay" as string]: `${delay}s` };
}

/** One element of the intro. `delay` is in seconds after the first paint. */
export function Intro<T extends React.ElementType = "div">({
  as,
  variant = "fade-up",
  delay,
  style,
  ...props
}: { as?: T; variant?: IntroVariant; delay?: number } & Omit<React.ComponentPropsWithoutRef<T>, "as" | "variant" | "delay">) {
  const Comp = (as ?? "div") as React.ElementType;
  return <Comp data-intro={variant} style={delayStyle(delay, style as React.CSSProperties | undefined)} {...props} />;
}

/**
 * Splits text into words that rise in sequence; markup inside (`<em>` from
 * `t.rich`) is kept. Words, never letters: a span per letter would break
 * Arabic letter joining. The spaces stay plain text so lines wrap as before.
 */
export function IntroWords({ children, delay = 0, step = 0.05 }: { children: React.ReactNode; delay?: number; step?: number }) {
  const counter = { i: 0 };
  return <>{splitWords(children, (i) => delay + i * step, counter)}</>;
}

function splitWords(node: React.ReactNode, delayOf: (i: number) => number, counter: { i: number }): React.ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((part, k) => {
      if (part === "" || /^\s+$/.test(part)) return part;
      const i = counter.i++;
      return (
        <span key={k} data-intro="word" style={{ ["--intro-delay" as string]: `${delayOf(i).toFixed(3)}s` }}>
          {part}
        </span>
      );
    });
  }
  if (Array.isArray(node)) {
    return node.map((child, k) => <React.Fragment key={k}>{splitWords(child, delayOf, counter)}</React.Fragment>);
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props.children != null) {
    return React.cloneElement(node, undefined, splitWords(node.props.children, delayOf, counter));
  }
  return node;
}
