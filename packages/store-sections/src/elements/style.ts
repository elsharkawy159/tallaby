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
import { MOTION_EASE } from "./motion";
import { normalizeShell, type SectionShellStyle } from "./shell";

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
  /** Cards, header and footer above the page colour: white, a raised grey in dark mode. */
  surface: "var(--sf-surface,#ffffff)",
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
const ASPECT_RATIOS = { auto: "auto", square: "1 / 1", landscape: "4 / 3", wide: "16 / 9", banner: "21 / 9", portrait: "3 / 4", story: "9 / 16" } as const;
const ALIGN = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" } as const;
const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end", between: "space-between", around: "space-around" } as const;

// Same plain color syntax the schema accepts for design-system colors.
const COLOR_RE = /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(?:rgba?|hsla?|oklch|oklab)\([0-9.,%\s/+-]+\))$/i;
// A length: auto, or a bounded number with px / % / rem / ch.
const LENGTH_RE = /^(?:auto|(\d{1,4}(?:\.\d{1,2})?)(px|%|rem|ch))$/;
// An offset (inset): like a length, and may be negative.
const OFFSET_RE = /^(?:auto|(-?\d{1,4}(?:\.\d{1,2})?)(px|%|rem))$/;

/** Fluid heading sizes for designs (clamp between mobile and desktop). */
export const DISPLAY_SIZES = {
  "display-sm": "clamp(1.75rem,4vw,3.5rem)",
  "display-md": "clamp(2.25rem,5vw,4rem)",
  "display-lg": "clamp(2.5rem,6vw,4.5rem)",
} as const;
/** Design-system fonts by role (core/theme.ts sets the variables). */
const FONT_FAMILIES = {
  heading: "var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif",
  body: "var(--sf-font-body,var(--font-storefront)),system-ui,sans-serif",
} as const;
const LETTER_SPACINGS = { tight: "-0.02em", normal: "0", wide: "0.06em", wider: "0.14em" } as const;
/** Fixed gradients on theme tokens (`background-image`, over the background colour). */
export const GRADIENTS = {
  "brand-soft": "linear-gradient(135deg,color-mix(in srgb,var(--sf-brand) 16%,transparent),color-mix(in srgb,var(--sf-brand) 4%,transparent))",
  // A photo scrim under white text: always dark, also when dark mode turns --sf-ink light (owner, 2026-10-27).
  "ink-fade": "linear-gradient(to top,rgb(0 0 0 / 0.68),rgb(0 0 0 / 0.12) 60%,transparent)",
  shelf: "linear-gradient(180deg,var(--sf-shelf),var(--sf-paper))",
} as const;

type Enum<T extends Record<string, unknown>> = keyof T;

export type StyleValues = {
  fontSize?: Enum<typeof FONT_SIZES> | Enum<typeof DISPLAY_SIZES>;
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
  position?: "relative" | "absolute" | "sticky";
  insetTop?: string;
  insetEnd?: string;
  insetBottom?: string;
  insetStart?: string;
  zIndex?: number;
  overflow?: "visible" | "hidden" | "clip";
  letterSpacing?: Enum<typeof LETTER_SPACINGS>;
  /** The design system heading or body font (theme tokens only). */
  fontFamily?: Enum<typeof FONT_FAMILIES>;
  textTransform?: "none" | "uppercase";
  gradient?: Enum<typeof GRADIENTS>;
  colSpan?: number;
  order?: number;
  /** Styles while hovered (one level; no nested `hover`). */
  hover?: HoverStyle;
};

export type HoverStyle = Pick<StyleValues, "color" | "background" | "borderColor" | "opacity" | "shadow"> & {
  /** Percent, 100–110 (`transform: scale`). */
  scale?: number;
};

export type StyleKey = keyof StyleValues;

type Rule =
  | { kind: "enum"; values: readonly string[] }
  | { kind: "bool" }
  | { kind: "color" }
  | { kind: "length" }
  | { kind: "number"; min: number; max: number }
  | { kind: "offset" }
  | { kind: "hover" };

const num = (min: number, max: number): Rule => ({ kind: "number", min, max });
const oneOf = (values: Record<string, unknown> | readonly string[]): Rule => ({
  kind: "enum",
  values: Array.isArray(values) ? values : Object.keys(values),
});

const RULES: Record<StyleKey, Rule> = {
  fontSize: oneOf([...Object.keys(FONT_SIZES), ...Object.keys(DISPLAY_SIZES)]),
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
  position: oneOf(["relative", "absolute", "sticky"]),
  insetTop: { kind: "offset" },
  insetEnd: { kind: "offset" },
  insetBottom: { kind: "offset" },
  insetStart: { kind: "offset" },
  zIndex: num(0, 10),
  overflow: oneOf(["visible", "hidden", "clip"]),
  letterSpacing: oneOf(LETTER_SPACINGS),
  fontFamily: oneOf(FONT_FAMILIES),
  textTransform: oneOf(["none", "uppercase"]),
  gradient: oneOf(GRADIENTS),
  colSpan: num(1, 12),
  order: num(-10, 10),
  hover: { kind: "hover" },
};

const HOVER_KEYS = ["color", "background", "borderColor", "opacity", "shadow"] as const;

export const STYLE_KEYS = Object.keys(RULES) as StyleKey[];

/** `title`, `subtitle`, or an item field such as `items.2.title`. */
export const PART_KEY_RE = /^[A-Za-z][A-Za-z0-9]{0,39}(?:\.\d{1,3}\.[A-Za-z][A-Za-z0-9]{0,39})?$/;
const ID_RE = /^[A-Za-z0-9_:-]{1,64}$/;

function isLength(value: string, re: RegExp = LENGTH_RE): boolean {
  const match = re.exec(value);
  if (!match) return false;
  if (value === "auto") return true;
  const amount = Math.abs(Number(match[1]));
  return match[2] === "%" ? amount <= 100 : match[2] === "rem" || match[2] === "ch" ? amount <= 200 : amount <= 4000;
}

function normalizeHover(value: unknown): HoverStyle | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const input = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of HOVER_KEYS) {
    const checked = checkValue(RULES[key], input[key]);
    if (checked !== undefined) out[key] = checked;
  }
  const scale = checkValue(num(100, 110), input.scale);
  if (scale !== undefined) out.scale = scale;
  return Object.keys(out).length ? (out as HoverStyle) : undefined;
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
    case "offset":
      return typeof value === "string" && isLength(value.trim(), OFFSET_RE) ? value.trim() : undefined;
    case "hover":
      return normalizeHover(value);
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

/** The tree section padding that the Brand "section spacing" token (`--sf-section-y`) stands for. */
export const SECTION_BASE_PADDING = 64;

/**
 * What `--sf-section-y` stands for while the Brand section spacing is unset
 * (docs/section-rules.md §5.2, G13): 56px on phones and tablets, growing to
 * 64px on wide screens. Nearly every design pads its root 64 (desktop) and 40
 * (phones), so a section opens about 58px at 1280px, 64px from 1440px and
 * 35px on a phone: two sections sit about 115px / 70px apart. v0.3 grew it to
 * 104px, which left about 200px between two sections on a laptop (owner,
 * 2026-10-27: too much gap between sections).
 */
export const SECTION_FLUID_PADDING = "clamp(56px,4.5vw,64px)";
/**
 * A design's root padding counts at most this much (1.25 × the token), so a
 * roomy section (a hero, the About set) never opens a hole in the rhythm.
 */
export const SECTION_MAX_PADDING = 80;

/**
 * A section root's vertical padding, scaled by the Brand section spacing:
 * `value × token / 64`, the token being the seller's spacing or the fluid
 * default above, so each section keeps its own rhythm (0 stays 0).
 */
const sectionPadding = (value: number) =>
  value === 0 ? "0px" : `calc(var(--sf-section-y,${SECTION_FLUID_PADDING})*${Math.min(value, SECTION_MAX_PADDING) / SECTION_BASE_PADDING})`;

/**
 * CSS declarations for a normalized style (`hidden` is handled by the caller).
 * `sectionRoot` marks a tree section's root node: its vertical padding follows
 * the Brand section spacing.
 */
export function styleDeclarations(style: StyleValues, sectionRoot = false): string[] {
  const out: string[] = [];
  const add = (prop: string, value: string) => out.push(`${prop}:${value}`);
  if (style.fontSize) {
    add("font-size", style.fontSize in DISPLAY_SIZES ? DISPLAY_SIZES[style.fontSize as keyof typeof DISPLAY_SIZES] : `${FONT_SIZES[style.fontSize as keyof typeof FONT_SIZES]}rem`);
  }
  if (style.letterSpacing) add("letter-spacing", LETTER_SPACINGS[style.letterSpacing]);
  if (style.fontFamily) add("font-family", FONT_FAMILIES[style.fontFamily]);
  if (style.textTransform) add("text-transform", style.textTransform);
  if (style.fontWeight) add("font-weight", String(FONT_WEIGHTS[style.fontWeight]));
  if (style.italic !== undefined) add("font-style", style.italic ? "italic" : "normal");
  if (style.underline !== undefined) add("text-decoration-line", style.underline ? "underline" : "none");
  if (style.textAlign) add("text-align", style.textAlign);
  if (style.lineHeight) add("line-height", String(LINE_HEIGHTS[style.lineHeight]));
  if (style.color) add("color", colorValue(style.color));
  if (style.background) add("background", colorValue(style.background));
  const blockPadding = sectionRoot ? sectionPadding : px;
  if (style.paddingTop !== undefined) add("padding-block-start", blockPadding(style.paddingTop));
  if (style.paddingBottom !== undefined) add("padding-block-end", blockPadding(style.paddingBottom));
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
  if (style.gradient) add("background-image", GRADIENTS[style.gradient]);
  if (style.position) add("position", style.position);
  if (style.insetTop) add("inset-block-start", style.insetTop);
  if (style.insetBottom) add("inset-block-end", style.insetBottom);
  if (style.insetStart) add("inset-inline-start", style.insetStart);
  if (style.insetEnd) add("inset-inline-end", style.insetEnd);
  if (style.zIndex !== undefined) add("z-index", String(style.zIndex));
  if (style.overflow) add("overflow", style.overflow);
  if (style.colSpan !== undefined) add("grid-column", `span ${style.colSpan} / span ${style.colSpan}`);
  if (style.order !== undefined) add("order", String(style.order));
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

function hoverDeclarations(hover: HoverStyle): string[] {
  const { scale, ...rest } = hover;
  const out = styleDeclarations(rest);
  if (scale !== undefined && scale !== 100) out.push(`transform:scale(${scale / 100})`);
  return out;
}

/** The element's rule plus its `:hover` rule (the caller wraps both in the device media query). */
function ruleFor(selector: string, style: StyleValues, sectionRoot = false): string {
  const declarations = styleDeclarations(style, sectionRoot);
  let css = declarations.length ? `${selector}{${declarations.join(";")}}` : "";
  const hover = style.hover ? hoverDeclarations(style.hover) : [];
  // Hover changes ease in (docs/section-rules.md §6.5): 200ms for colours, 600ms for zoom.
  if (hover.length) css += `${selector}{transition:${HOVER_TRANSITION}}${selector}:hover{${hover.join(";")}}`;
  return css;
}

const HOVER_TRANSITION = `color .2s,background-color .2s,border-color .2s,box-shadow .2s,opacity .2s,transform .6s ${MOTION_EASE}`;

/** Hover zoom and easing are motion: switched off for visitors who ask for reduced motion. */
function reducedMotionRule(selectors: string[]): string {
  if (!selectors.length) return "";
  return `@media (prefers-reduced-motion:reduce){${selectors.join(",")}{transition:none}${selectors.map((s) => `${s}:hover`).join(",")}{transform:none}}`;
}

function hiddenRule(selector: string, mode: StyleCssMode): string {
  // In the editor a hidden element stays visible but faded, so it can still be selected.
  return mode === "edit" ? `${selector}{opacity:0.35;outline:1px dashed currentColor}` : `${selector}{display:none!important}`;
}

type Responsive = { base?: StyleValues; tablet?: StyleValues; mobile?: StyleValues; sectionRoot?: boolean };

function collect(target: Map<string, Responsive>, selector: string, slot: "base" | StyleBreakpoint, style: StyleValues | undefined) {
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

const LIST_TYPES = new Set(["productList", "categoryList", "postList"]);

/**
 * Tablet columns for a row that sets none (docs/section-rules.md §5.3, G14):
 * a 4-to-6 column row would otherwise keep its desktop columns on an 820px
 * tablet. Product, category and post lists get 3; other grids 2, or 3 from
 * 6 columns (logos).
 */
export function fallbackTabletColumns(type: string, columns: number | undefined): number | undefined {
  if (!columns || columns < 4 || (type !== "grid" && !LIST_TYPES.has(type))) return undefined;
  return LIST_TYPES.has(type) || columns >= 6 ? 3 : 2;
}

function collectNodes(target: Map<string, Responsive>, sectionId: string, nodes: ComponentNode[] | undefined, depth = 0) {
  for (const node of nodes ?? []) {
    if (ID_RE.test(node.id)) {
      const selector = nodeSelector(sectionId, node);
      const base = normalizeStyle(node.style);
      collect(target, selector, "base", base);
      const bps = normalizeBreakpointStyles(node.breakpointStyles, normalizeStyle);
      const tabletColumns = bps.tablet?.columns === undefined ? fallbackTabletColumns(node.type, base.columns) : undefined;
      if (tabletColumns) bps.tablet = { ...bps.tablet, columns: tabletColumns };
      for (const bp of STYLE_BREAKPOINTS) collect(target, selector, bp, bps[bp]);
      const entry = target.get(selector);
      if (entry && depth === 0 && node.type === "section") entry.sectionRoot = true;
    }
    collectNodes(target, sectionId, node.children, depth + 1);
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
  if (!target.size) return "";
  const base: string[] = [];
  const media: Record<StyleBreakpoint, string[]> = { tablet: [], mobile: [] };
  const hidden: Record<"base" | StyleBreakpoint, string[]> = { base: [], tablet: [], mobile: [] };
  const hovered: string[] = [];
  for (const [selector, entry] of target) {
    if ([entry.base, entry.tablet, entry.mobile].some((style) => style?.hover)) hovered.push(selector);
    if (entry.base) base.push(ruleFor(selector, entry.base, entry.sectionRoot));
    if (entry.base?.hidden) hidden.base.push(hiddenRule(selector, mode));
    for (const bp of STYLE_BREAKPOINTS) {
      const style = entry[bp];
      if (!style) continue;
      media[bp].push(ruleFor(selector, style, entry.sectionRoot));
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
  return css + reducedMotionRule(hovered);
}

/** Escapes a CSS block for a `<style>` element (same rule as `SiteTheme`). */
export function escapeStyleBlock(css: string): string {
  return css.replace(/</g, "\\3c ");
}
