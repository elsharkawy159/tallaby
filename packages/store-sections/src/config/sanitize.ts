/**
 * Server-side sanitizing of a parsed SiteConfig before it is saved or published
 * (PLAN.md §12 step 4–5). Strings that contain HTML go through an allow-list,
 * dangerous URL schemes are blanked, and style values that could run script or
 * load arbitrary resources are dropped. Never mutates its input.
 */
import sanitizeHtml from "sanitize-html";
import type { ComponentNode, SectionInstance, SiteConfig } from "./schema";
import { hasDangerousScheme } from "./url";

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "mark",
    "small", "span", "code", "pre", "blockquote", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "h5", "h6", "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    "*": ["dir"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
};

// Only treat a string as HTML when it contains something tag-like, so plain
// text such as "a < b" or "Tom & Jerry" is stored exactly as typed.
const LOOKS_LIKE_HTML = /<[a-z!/?]/i;

export function sanitizeRichText(value: string): string {
  return LOOKS_LIKE_HTML.test(value) ? sanitizeHtml(value, RICH_TEXT_OPTIONS) : value;
}

const UNSAFE_STYLE_VALUE = /expression\s*\(|javascript:|vbscript:|[<>]|@import|behavior\s*:|-moz-binding/i;
const CSS_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

function isSafeStyleString(value: string): boolean {
  if (UNSAFE_STYLE_VALUE.test(value)) return false;
  for (const match of value.matchAll(CSS_URL)) {
    const target = (match[2] ?? "").trim();
    if (!/^https?:\/\//i.test(target) && !/^\/(?!\/)/.test(target)) return false;
  }
  return true;
}

export function sanitizeStyle(style: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    if (typeof value === "string") {
      if (isSafeStyleString(value)) out[key] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeStyle(value as Record<string, unknown>);
    }
  }
  return out;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return hasDangerousScheme(value) ? "" : sanitizeRichText(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]));
  }
  return value;
}

const sanitizeProps = (props: Record<string, unknown>) => sanitizeValue(props) as Record<string, unknown>;

function sanitizeBreakpoints(styles: Record<string, Record<string, unknown>>) {
  return Object.fromEntries(Object.entries(styles).map(([bp, s]) => [bp, sanitizeStyle(s)]));
}

function sanitizeNode(node: ComponentNode): ComponentNode {
  return {
    ...node,
    props: sanitizeProps(node.props),
    children: node.children.map(sanitizeNode),
    ...(node.style && { style: sanitizeStyle(node.style) }),
    ...(node.breakpointStyles && { breakpointStyles: sanitizeBreakpoints(node.breakpointStyles) }),
  };
}

function sanitizeSection(section: SectionInstance): SectionInstance {
  return {
    ...section,
    props: sanitizeProps(section.props),
    ...(section.translations && {
      translations: sanitizeValue(section.translations) as SectionInstance["translations"],
    }),
    ...(section.style && { style: sanitizeStyle(section.style) }),
    ...(section.breakpointStyles && { breakpointStyles: sanitizeBreakpoints(section.breakpointStyles) }),
    ...(section.componentTree && { componentTree: section.componentTree.map(sanitizeNode) }),
  };
}

export function sanitizeSiteConfig(input: SiteConfig): SiteConfig {
  const config = structuredClone(input);
  return {
    ...config,
    header: config.header && sanitizeSection(config.header),
    footer: config.footer && sanitizeSection(config.footer),
    pages: config.pages.map((page) => ({
      ...page,
      seo: sanitizeValue(page.seo) as typeof page.seo,
      content: {
        ...page.content,
        sections: page.content.sections.map(sanitizeSection),
        ...(page.content.elementStyles && {
          elementStyles: sanitizeBreakpoints(page.content.elementStyles),
        }),
        ...(page.content.injectedChildren && {
          injectedChildren: Object.fromEntries(
            Object.entries(page.content.injectedChildren).map(([k, nodes]) => [k, nodes.map(sanitizeNode)]),
          ),
        }),
      },
    })),
  };
}
