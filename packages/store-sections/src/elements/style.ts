/**
 * Element and part styles (docs/website-builder.md §4.6, P4B-01). A fixed
 * whitelist of keys whose values are enums, theme token names, validated
 * colors or bounded numbers. Nothing a seller types becomes CSS text: every
 * declaration below is built from a known key and a checked value, and the
 * finished block is escaped like `SiteTheme`.
 *
 * Desktop styles are the base; tablet and mobile are max-width overrides,
 * so a mobile phone also gets the tablet override unless mobile sets its own.
 */
import type { ComponentNode, SectionInstance } from "../config/schema";
import { SITE_ROOT_CLASS } from "../core/theme";
import { normalizeShell, shellAnimationCss, type SectionShellStyle } from "./shell";

export const STYLE_BREAKPOINTS = ["tablet", "mobile"] as const;
export type StyleBreakpoint = (typeof STYLE_BREAKPOINTS)[number];

/** Max widths of the overrides; the editor canvas uses 820px and 390px frames. */
export const BREAKPOINT_MAX_WIDTH: Record<StyleBreakpoint, number> = { tablet: 1023, mobile: 767 };

export const COLOR_TOKEN_VARS = {
  primary: "var(--sf-brand)",
  primaryInk: "var(--sf-brand-ink,#fff)",
  foreground: "var(--sf-ink)",
  muted: "var(--sf-muted)",
  background: "var(--sf-paper)",
  secondary: "var(--sf-shelf)",
  border: "var(--sf-line)",
  accent: "var(--sf-sun)",
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;
export type ColorToken = keyof typeof COLOR_TOKEN_VARS;

export const FONT_SIZES = { xs: 0.75, sm: 0.875, md: 1, lg: 1.125, xl: 1.25, "2xl": 1.5, "3xl": 1.875, "4xl": 2.25, "5xl": 3, "6xl": 3.75 } as const;
export const FONT_WEIGHTS = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 } as const;
const LINE_HEIGHTS = { tight: 1.15, snug: 1.35, normal: 1.5, relaxed: 1.75 } as const;
const SHADOWS = {
  none: "none",
  sm: "0 1px 2px rgb(0 0 0 / 0.06)",
  md: "0 4px 12px rgb(0 0 0 / 0.08)",
  lg: "0 12px 32px rgb(0 0 0 / 0.12)",
} as const;
const ASPECT_RATIOS = { auto: "auto", square: "1 / 1", landscape: "4 / 3", wide: "16 / 9", portrait: "3 / 4" } as const;
const ALIGN = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" } as const;
const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end", between: "space-between", around: "space-around" } as const;

// Same plain color syntax the schema accepts for design-system colors.
const COLOR_RE = /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(?:rgba?|hsla?|oklch|oklab)\([0-9.,%\s/+-]+\))$/i;
// A length: auto, or a bounded number with px / % / rem.
const LENGTH_RE = /^(?:auto|(\d{1,4}(?:\.\d{1,2})?)(px|%|rem))$/;

type Enum<T extends Record<string, unknown>> = keyof T;

export type StyleValues = {
  fontSize?: Enum<typeof FONT_SIZES>;
  fontWeight?: Enum<typeof FONT_WEIGHTS>;
  italic?: boolean;
  underline?: boolean;
  textAlign?: "start" | "center" | "end" | "justify";
  lineHeight?: Enum<typeof LINE_HEIGHTS>;
  color?: string;
  background?: string;
  paddingTop?: number;
  paddingEnd?: number;
  paddingBottom?: number;
  paddingStart?: number;
  marginTop?: number;
  marginEnd?: number;
  marginBottom?: number;
  marginStart?: number;
  gap?: number;
  direction?: "row" | "column";
  alignItems?: Enum<typeof ALIGN>;
  justifyContent?: Enum<typeof JUSTIFY>;
  wrap?: boolean;
  columns?: number;
  width?: string;
  maxWidth?: string;
  minHeight?: number;
  aspectRatio?: Enum<typeof ASPECT_RATIOS>;
  objectFit?: "cover" | "contain";
  borderWidth?: number;
  borderColor?: string;
  radius?: number;
  shadow?: Enum<typeof SHADOWS>;
  opacity?: number;
  hidden?: boolean;
};

export type StyleKey = keyof StyleValues;

type Rule =
  | { kind: "enum"; values: readonly string[] }
  | { kind: "bool" }
  | { kind: "color" }
  | { kind: "length" }
  | { kind: "number"; min: number; max: number };

const num = (min: number, max: number): Rule => ({ kind: "number", min, max });
const oneOf = (values: Record<string, unknown> | readonly string[]): Rule => ({
  kind: "enum",
  values: Array.isArray(values) ? values : Object.keys(values),
});

const RULES: Record<StyleKey, Rule> = {
  fontSize: oneOf(FONT_SIZES),
  fontWeight: oneOf(FONT_WEIGHTS),
  italic: { kind: "bool" },
  underline: { kind: "bool" },
  textAlign: oneOf(["start", "center", "end", "justify"]),
  lineHeight: oneOf(LINE_HEIGHTS),
  color: { kind: "color" },
  background: { kind: "color" },
  paddingTop: num(0, 400),
  paddingEnd: num(0, 400),
  paddingBottom: num(0, 400),
  paddingStart: num(0, 400),
  marginTop: num(-200, 400),
  marginEnd: num(-200, 400),
  marginBottom: num(-200, 400),
  marginStart: num(-200, 400),
  gap: num(0, 200),
  direction: oneOf(["row", "column"]),
  alignItems: oneOf(ALIGN),
  justifyContent: oneOf(JUSTIFY),
  wrap: { kind: "bool" },
  columns: num(1, 12),
  width: { kind: "length" },
  maxWidth: { kind: "length" },
  minHeight: num(0, 2000),
  aspectRatio: oneOf(ASPECT_RATIOS),
  objectFit: oneOf(["cover", "contain"]),
  borderWidth: num(0, 20),
  borderColor: { kind: "color" },
  radius: num(0, 999),
  shadow: oneOf(SHADOWS),
  opacity: num(0, 100),
  hidden: { kind: "bool" },
};

export const STYLE_KEYS = Object.keys(RULES) as StyleKey[];

/** `title`, `subtitle`, or an item field such as `items.2.title`. */
export const PART_KEY_RE = /^[A-Za-z][A-Za-z0-9]{0,39}(?:\.\d{1,3}\.[A-Za-z][A-Za-z0-9]{0,39})?$/;
const ID_RE = /^[A-Za-z0-9_:-]{1,64}$/;

function isLength(value: string): boolean {
  const match = LENGTH_RE.exec(value);
  if (!match) return false;
  if (value === "auto") return true;
  const amount = Number(match[1]);
  return match[2] === "%" ? amount <= 100 : match[2] === "rem" ? amount <= 200 : amount <= 4000;
}

function checkValue(rule: Rule, value: unknown): unknown {
  switch (rule.kind) {
    case "enum":
      return typeof value === "string" && rule.values.includes(value) ? value : undefined;
    case "bool":
      return typeof value === "boolean" ? value : undefined;
    case "color":
      return typeof value === "string" && (value in COLOR_TOKEN_VARS || COLOR_RE.test(value.trim())) ? value.trim() : undefined;
    case "length":
      return typeof value === "string" && isLength(value.trim()) ? value.trim() : undefined;
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? Math.min(rule.max, Math.max(rule.min, Math.round(value)))
        : undefined;
  }
}

/** Keeps only whitelisted keys with valid values. Never throws. */
export function normalizeStyle(input: unknown): StyleValues {
  const out: Record<string, unknown> = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const [key, value] of Object.entries(input)) {
    const rule = RULES[key as StyleKey];
    if (!rule) continue;
    const checked = checkValue(rule, value);
    if (checked !== undefined) out[key] = checked;
  }
  return out as StyleValues;
}

/**
 * A section's own style: whitelisted keys, `parts` (styles of its editable
 * parts) and `shell` (the shared section frame, `./shell.ts`; desktop only).
 */
export type SectionStyle = StyleValues & { parts?: Record<string, StyleValues>; shell?: SectionShellStyle };

export function normalizeSectionStyle(input: unknown): SectionStyle {
  const out: SectionStyle = normalizeStyle(input);
  const shell = normalizeShell(input && typeof input === "object" ? (input as { shell?: unknown }).shell : undefined);
  if (shell) out.shell = shell;
  const parts = input && typeof input === "object" ? (input as { parts?: unknown }).parts : undefined;
  if (parts && typeof parts === "object" && !Array.isArray(parts)) {
    const clean: Record<string, StyleValues> = {};
    for (const [key, value] of Object.entries(parts)) {
      if (!PART_KEY_RE.test(key)) continue;
      const style = normalizeStyle(value);
      if (Object.keys(style).length) clean[key] = style;
    }
    if (Object.keys(clean).length) out.parts = clean;
  }
  return out;
}

/** A section's per-device style: like `normalizeSectionStyle`, without the shell (it has no device overrides). */
export function normalizeSectionBreakpointStyle(input: unknown): SectionStyle {
  const { shell: _shell, ...rest } = normalizeSectionStyle(input);
  return rest;
}

/** Keeps only the known breakpoints, each normalized with `normalize`. */
export function normalizeBreakpointStyles<T>(
  input: unknown,
  normalize: (value: unknown) => T,
): Partial<Record<StyleBreakpoint, T>> {
  const out: Partial<Record<StyleBreakpoint, T>> = {};
  if (!input || typeof input !== "object") return out;
  for (const bp of STYLE_BREAKPOINTS) {
    const value = (input as Record<string, unknown>)[bp];
    if (value && typeof value === "object") out[bp] = normalize(value);
  }
  return out;
}

const colorValue = (value: string) => COLOR_TOKEN_VARS[value as ColorToken] ?? value;
const px = (value: number) => `${value}px`;

/** CSS declarations for a normalized style (`hidden` is handled by the caller). */
export function styleDeclarations(style: StyleValues): string[] {
  const out: string[] = [];
  const add = (prop: string, value: string) => out.push(`${prop}:${value}`);
  if (style.fontSize) add("font-size", `${FONT_SIZES[style.fontSize]}rem`);
  if (style.fontWeight) add("font-weight", String(FONT_WEIGHTS[style.fontWeight]));
  if (style.italic !== undefined) add("font-style", style.italic ? "italic" : "normal");
  if (style.underline !== undefined) add("text-decoration-line", style.underline ? "underline" : "none");
  if (style.textAlign) add("text-align", style.textAlign);
  if (style.lineHeight) add("line-height", String(LINE_HEIGHTS[style.lineHeight]));
  if (style.color) add("color", colorValue(style.color));
  if (style.background) add("background", colorValue(style.background));
  if (style.paddingTop !== undefined) add("padding-block-start", px(style.paddingTop));
  if (style.paddingBottom !== undefined) add("padding-block-end", px(style.paddingBottom));
  if (style.paddingStart !== undefined) add("padding-inline-start", px(style.paddingStart));
  if (style.paddingEnd !== undefined) add("padding-inline-end", px(style.paddingEnd));
  if (style.marginTop !== undefined) add("margin-block-start", px(style.marginTop));
  if (style.marginBottom !== undefined) add("margin-block-end", px(style.marginBottom));
  if (style.marginStart !== undefined) add("margin-inline-start", px(style.marginStart));
  if (style.marginEnd !== undefined) add("margin-inline-end", px(style.marginEnd));
  if (style.gap !== undefined) add("gap", px(style.gap));
  if (style.direction) add("flex-direction", style.direction);
  if (style.alignItems) add("align-items", ALIGN[style.alignItems]);
  if (style.justifyContent) add("justify-content", JUSTIFY[style.justifyContent]);
  if (style.wrap !== undefined) add("flex-wrap", style.wrap ? "wrap" : "nowrap");
  if (style.columns !== undefined) add("grid-template-columns", `repeat(${style.columns},minmax(0,1fr))`);
  if (style.width) add("width", style.width);
  if (style.maxWidth) add("max-width", style.maxWidth);
  if (style.minHeight !== undefined) add("min-height", px(style.minHeight));
  if (style.aspectRatio) add("aspect-ratio", ASPECT_RATIOS[style.aspectRatio]);
  if (style.objectFit) add("object-fit", style.objectFit);
  if (style.borderWidth !== undefined) add("border", `${style.borderWidth}px solid ${colorValue(style.borderColor ?? "border")}`);
  else if (style.borderColor) add("border-color", colorValue(style.borderColor));
  if (style.radius !== undefined) add("border-radius", px(style.radius));
  if (style.shadow) add("box-shadow", SHADOWS[style.shadow]);
  if (style.opacity !== undefined) add("opacity", String(style.opacity / 100));
  return out;
}

export type StyleCssMode = "edit" | "public";

/**
 * `hidden` is per device, not inherited: it hides only on the device whose
 * style sets it, so these ranges do not overlap.
 */
const DEVICE_RANGE: Record<"base" | StyleBreakpoint, string> = {
  base: `(min-width:${BREAKPOINT_MAX_WIDTH.tablet + 1}px)`,
  tablet: `(min-width:${BREAKPOINT_MAX_WIDTH.mobile + 1}px) and (max-width:${BREAKPOINT_MAX_WIDTH.tablet}px)`,
  mobile: `(max-width:${BREAKPOINT_MAX_WIDTH.mobile}px)`,
};

function ruleFor(selector: string, style: StyleValues): string {
  const declarations = styleDeclarations(style);
  return declarations.length ? `${selector}{${declarations.join(";")}}` : "";
}

function hiddenRule(selector: string, mode: StyleCssMode): string {
  // In the editor a hidden element stays visible but faded, so it can still be selected.
  return mode === "edit" ? `${selector}{opacity:0.35;outline:1px dashed currentColor}` : `${selector}{display:none!important}`;
}

type Responsive = { base?: StyleValues; tablet?: StyleValues; mobile?: StyleValues };

function collect(target: Map<string, Responsive>, selector: string, slot: keyof Responsive, style: StyleValues | undefined) {
  if (!style || !Object.keys(style).length) return;
  const entry = target.get(selector) ?? {};
  entry[slot] = style;
  target.set(selector, entry);
}

function nodeSelector(sectionId: string, node: ComponentNode) {
  const selector = `.${SITE_ROOT_CLASS} [data-section-id="${sectionId}"] [data-node-id="${node.id}"]`;
  // A button node is a wrapper around the link; its styles belong to the link.
  return node.type === "button" ? `${selector}>*` : selector;
}

function collectNodes(target: Map<string, Responsive>, sectionId: string, nodes: ComponentNode[] | undefined) {
  for (const node of nodes ?? []) {
    if (ID_RE.test(node.id)) {
      const selector = nodeSelector(sectionId, node);
      collect(target, selector, "base", normalizeStyle(node.style));
      const bps = normalizeBreakpointStyles(node.breakpointStyles, normalizeStyle);
      for (const bp of STYLE_BREAKPOINTS) collect(target, selector, bp, bps[bp]);
    }
    collectNodes(target, sectionId, node.children);
  }
}

function collectSection(target: Map<string, Responsive>, instance: SectionInstance) {
  if (!ID_RE.test(instance.id)) return;
  const own = normalizeSectionStyle(instance.style);
  const bps = normalizeBreakpointStyles(instance.breakpointStyles, normalizeSectionBreakpointStyle);
  const { parts, shell: _shell, ...sectionStyle } = own;
  const sectionSelector = `.${SITE_ROOT_CLASS} [data-section-id="${instance.id}"]`;
  collect(target, sectionSelector, "base", sectionStyle);
  for (const [key, style] of Object.entries(parts ?? {})) {
    collect(target, `.${SITE_ROOT_CLASS} [data-part="${instance.id}::${key}"]`, "base", style);
  }
  for (const bp of STYLE_BREAKPOINTS) {
    const value = bps[bp];
    if (!value) continue;
    const { parts: bpParts, ...bpSection } = value;
    collect(target, sectionSelector, bp, bpSection);
    for (const [key, style] of Object.entries(bpParts ?? {})) {
      collect(target, `.${SITE_ROOT_CLASS} [data-part="${instance.id}::${key}"]`, bp, style);
    }
  }
  collectNodes(target, instance.id, instance.componentTree);
}

/**
 * One CSS block for every section, part and element style on a page
 * (header and footer included). Empty when nothing is styled.
 */
export function collectPageCss(sections: readonly (SectionInstance | null | undefined)[], mode: StyleCssMode = "public"): string {
  const target = new Map<string, Responsive>();
  for (const instance of sections) if (instance) collectSection(target, instance);
  const animated = mode === "public" ? collectAnimations(sections) : [];
  if (!target.size) return shellAnimationCss(animated);
  const base: string[] = [];
  const media: Record<StyleBreakpoint, string[]> = { tablet: [], mobile: [] };
  const hidden: Record<"base" | StyleBreakpoint, string[]> = { base: [], tablet: [], mobile: [] };
  for (const [selector, entry] of target) {
    if (entry.base) base.push(ruleFor(selector, entry.base));
    if (entry.base?.hidden) hidden.base.push(hiddenRule(selector, mode));
    for (const bp of STYLE_BREAKPOINTS) {
      const style = entry[bp];
      if (!style) continue;
      media[bp].push(ruleFor(selector, style));
      if (style.hidden) hidden[bp].push(hiddenRule(selector, mode));
    }
  }
  let css = base.join("");
  for (const bp of STYLE_BREAKPOINTS) {
    const rules = media[bp].join("");
    if (rules) css += `@media (max-width:${BREAKPOINT_MAX_WIDTH[bp]}px){${rules}}`;
  }
  for (const device of ["base", ...STYLE_BREAKPOINTS] as const) {
    const rules = hidden[device].join("");
    if (rules) css += `@media ${DEVICE_RANGE[device]}{${rules}}`;
  }
  return css + shellAnimationCss(animated);
}

function collectAnimations(sections: readonly (SectionInstance | null | undefined)[]) {
  const out: { selector: string; animation: "fade" | "rise" }[] = [];
  for (const instance of sections) {
    if (!instance || !ID_RE.test(instance.id)) continue;
    const animation = normalizeSectionStyle(instance.style).shell?.animation;
    if (animation && animation !== "none") out.push({ selector: `.${SITE_ROOT_CLASS} [data-section-id="${instance.id}"]`, animation });
  }
  return out;
}

/** Escapes a CSS block for a `<style>` element (same rule as `SiteTheme`). */
export function escapeStyleBlock(css: string): string {
  return css.replace(/</g, "\\3c ");
}
