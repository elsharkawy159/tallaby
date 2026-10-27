/**
 * The section rules (docs/section-rules.md §3–§5, v0.2) applied to the About
 * designs, style only: nodes are never added, removed or moved, so the field
 * names templates store values by (`templates/library-fields.ts`) stay the
 * same.
 *
 * - Root padding 64 / 40 px (desktop / mobile), the library's one rhythm.
 * - Display-size `h2` headings: `display-md`, `3xl` on phones, tight lines.
 * - No letter-spacing anywhere (it breaks joined Arabic letters).
 * - No `lg` shadow.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type Design } from "../builder";

// The library's one section rhythm since 2026-10-27 (owner: too much gap between sections):
// 64 / 40 like every other design; the renderer scales it by the fluid section token.
export const ABOUT_PADDING = {
  style: { paddingTop: 64, paddingBottom: 64 },
  tablet: {},
  mobile: { paddingTop: 40, paddingBottom: 40 },
} as const;

const isDisplay = (size: StyleValues["fontSize"]) => typeof size === "string" && size.startsWith("display-");

function clean(style: StyleValues | undefined): StyleValues | undefined {
  if (!style) return style;
  const { letterSpacing: _spacing, ...rest } = style;
  return rest.shadow === "lg" ? { ...rest, shadow: "md" } : rest;
}

function visit(node: NodeTemplate, root: boolean): NodeTemplate {
  let style = clean(node.style as StyleValues | undefined);
  const bps = node.breakpointStyles as Partial<Record<"tablet" | "mobile", StyleValues>> | undefined;
  let tablet = clean(bps?.tablet);
  let mobile = clean(bps?.mobile);
  if (root) {
    style = { ...style, ...ABOUT_PADDING.style };
    tablet = { ...tablet, ...ABOUT_PADDING.tablet };
    mobile = { ...mobile, ...ABOUT_PADDING.mobile };
  }
  if (node.type === "heading" && (node.props as { level?: string }).level === "h2" && isDisplay(style?.fontSize)) {
    style = { ...style, fontSize: "display-md", lineHeight: "tight" };
    mobile = { ...mobile, fontSize: "3xl" };
  }
  const breakpointStyles = {
    ...(tablet && Object.keys(tablet).length && { tablet }),
    ...(mobile && Object.keys(mobile).length && { mobile }),
  };
  const { style: _style, breakpointStyles: _bps, ...rest } = node;
  return {
    ...rest,
    ...(style && Object.keys(style).length && { style }),
    ...(Object.keys(breakpointStyles).length && { breakpointStyles }),
    children: (node.children ?? []).map((child) => visit(child, false)),
  } as NodeTemplate;
}

/** The design's tree with the rules above applied. */
export function aboutRules(tree: NodeTemplate): NodeTemplate {
  return visit(tree, true);
}

/** `defineDesign` for an About design: its tree goes through `aboutRules`. */
export function aboutDesign(design: Design): Design {
  return defineDesign({ ...design, tree: (t) => aboutRules(design.tree(t)) });
}
