/**
 * Section shell (P4B-05, docs/website-builder.md §4.3): the style every
 * pre-built section shares, stored as `instance.style.shell`. Values are enums
 * or bounded numbers mapped to theme tokens, never raw CSS. The renderer
 * applies them on the section wrapper, so no section reads them itself; with
 * no shell the wrapper renders exactly as before.
 *
 * Schemes re-map the `--sf-*` tokens for the section. A custom property that
 * names itself is invalid, so the outer wrapper first captures the root
 * colours as `--sf-shell-bg/fg`, and an inner element re-maps the tokens.
 */
import type { CSSProperties } from "react";
import { hasDangerousScheme } from "../config/url";

export const SHELL_SCHEMES = ["default", "muted", "primary", "dark"] as const;
export const SHELL_PADDINGS = ["none", "sm", "md", "lg", "xl"] as const;
export const SHELL_WIDTHS = ["contained", "wide", "full"] as const;
export const SHELL_ANIMATIONS = ["none", "fade", "rise"] as const;

export type SectionShellStyle = {
  scheme?: (typeof SHELL_SCHEMES)[number];
  paddingY?: (typeof SHELL_PADDINGS)[number];
  width?: (typeof SHELL_WIDTHS)[number];
  /** Store media path or http(s) URL, drawn as an image layer behind the section. */
  bgImage?: string;
  /** Dark overlay over the background image, 0–80 (%). */
  overlay?: number;
  /** `id` of the section, for in-page links (`/#about`). */
  anchor?: string;
  animation?: (typeof SHELL_ANIMATIONS)[number];
};

export const ANCHOR_RE = /^[a-z][a-z0-9-]{0,39}$/;

const PADDING_PX: Record<(typeof SHELL_PADDINGS)[number], number> = { none: 0, sm: 24, md: 48, lg: 80, xl: 112 };
const WIDTH: Record<(typeof SHELL_WIDTHS)[number], string | null> = { contained: null, wide: "1440px", full: "100%" };

const oneOf = <T extends readonly string[]>(values: T, value: unknown): T[number] | undefined =>
  typeof value === "string" && (values as readonly string[]).includes(value) ? (value as T[number]) : undefined;

function safeImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!v || v.length > 2048 || hasDangerousScheme(v) || /\s/.test(v)) return undefined;
  // http(s) URLs, same-origin paths and store-media paths (no other scheme, no `//host`).
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(v)) return undefined;
  return v;
}

/** Keeps only known shell keys with valid values; `undefined` when nothing is left. Never throws. */
export function normalizeShell(input: unknown): SectionShellStyle | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const raw = input as Record<string, unknown>;
  const out: SectionShellStyle = {};
  const scheme = oneOf(SHELL_SCHEMES, raw.scheme);
  if (scheme && scheme !== "default") out.scheme = scheme;
  const paddingY = oneOf(SHELL_PADDINGS, raw.paddingY);
  if (paddingY) out.paddingY = paddingY;
  const width = oneOf(SHELL_WIDTHS, raw.width);
  if (width && width !== "contained") out.width = width;
  const bgImage = safeImage(raw.bgImage);
  if (bgImage) out.bgImage = bgImage;
  if (bgImage && typeof raw.overlay === "number" && Number.isFinite(raw.overlay)) {
    out.overlay = Math.min(80, Math.max(0, Math.round(raw.overlay)));
  }
  if (typeof raw.anchor === "string" && ANCHOR_RE.test(raw.anchor)) out.anchor = raw.anchor;
  const animation = oneOf(SHELL_ANIMATIONS, raw.animation);
  if (animation && animation !== "none") out.animation = animation;
  return Object.keys(out).length ? out : undefined;
}

type CssVars = CSSProperties & Record<`--${string}`, string>;

export type ShellLayout = {
  outer: { className?: string; style?: CssVars; id?: string };
  /** Token re-map for primary/dark schemes; `null` when no inner wrapper is needed. */
  inner: CssVars | null;
  bgImage: string | null;
  overlay: number;
};

/** How the renderer draws a shell. All values come from the enums above. */
export function shellLayout(shell: SectionShellStyle | undefined, imageUrl: (src: string) => string | null): ShellLayout | null {
  if (!shell) return null;
  const style: CssVars = {};
  let inner: CssVars | null = null;
  if (shell.paddingY) style["--sf-section-y"] = `${PADDING_PX[shell.paddingY]}px`;
  if (shell.width && WIDTH[shell.width]) style["--sf-max-width"] = WIDTH[shell.width]!;
  if (shell.scheme === "muted") style.background = "var(--sf-shelf)";
  if (shell.scheme === "primary" || shell.scheme === "dark") {
    const primary = shell.scheme === "primary";
    style["--sf-shell-bg"] = primary ? "var(--sf-brand)" : "var(--sf-ink)";
    style["--sf-shell-fg"] = primary ? "var(--sf-brand-ink,#fff)" : "var(--sf-paper)";
    style.background = "var(--sf-shell-bg)";
    style.color = "var(--sf-shell-fg)";
    inner = {
      "--sf-ink": "var(--sf-shell-fg)",
      "--sf-muted": "color-mix(in srgb, var(--sf-shell-fg) 75%, transparent)",
      "--sf-paper": "color-mix(in srgb, var(--sf-shell-fg) 8%, var(--sf-shell-bg))",
      "--sf-shelf": "color-mix(in srgb, var(--sf-shell-fg) 5%, var(--sf-shell-bg))",
      "--sf-line": "color-mix(in srgb, var(--sf-shell-fg) 20%, transparent)",
      ...(primary && { "--sf-brand": "var(--sf-shell-fg)", "--sf-brand-ink": "var(--sf-shell-bg)" }),
    };
  }
  const bgImage = shell.bgImage ? imageUrl(shell.bgImage) : null;
  if (bgImage && !style.color) style.color = "#fff";
  return {
    outer: {
      className: bgImage ? "relative isolate overflow-hidden" : undefined,
      style: Object.keys(style).length ? style : undefined,
      id: shell.anchor,
    },
    inner,
    bgImage,
    overlay: shell.overlay ?? (bgImage ? 40 : 0),
  };
}

const KEYFRAMES = {
  fade: "@keyframes sf-shell-fade{from{opacity:0}to{opacity:1}}",
  rise: "@keyframes sf-shell-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}",
} as const;

/**
 * Scroll-driven entrance for sections with `animation`, CSS only and only
 * where the browser supports view timelines and the visitor allows motion.
 * Off in the editor so selection outlines never move.
 */
export function shellAnimationCss(entries: { selector: string; animation: "fade" | "rise" }[]): string {
  if (!entries.length) return "";
  const used = new Set(entries.map((e) => e.animation));
  const frames = [...used].map((a) => KEYFRAMES[a]).join("");
  const rules = entries
    .map((e) => `${e.selector}{animation:sf-shell-${e.animation} linear both;animation-timeline:view();animation-range:entry 0% cover 25%}`)
    .join("");
  return `@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){${frames}${rules}}}`;
}
