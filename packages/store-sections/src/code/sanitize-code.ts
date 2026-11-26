/**
 * Output cleaning for code sections (ROADMAP F-101, design note
 * docs/superpowers/specs/2026-11-20-code-sections-design.md §4.2).
 *
 * Every Liquid render result passes through `sanitizeCodeHtml` AFTER Liquid
 * runs, because a template can assemble a tag across conditions
 * (`<scr{% if x %}ipt>`). This is the security boundary: the storefront shares
 * its origin and session cookie with checkout, and the builder canvas has the
 * dashboard's origin, so one gap here is an account takeover.
 *
 * Allowlist only. `sanitize-html` parses and re-serialises the markup (text is
 * always escaped, attributes always double-quoted), and a `transformTags['*']`
 * hook applies the exact per-tag attribute rules below before sanitize-html's
 * own allowlist runs again as a second layer. A final pass re-reads the output
 * and returns '' if anything executable is still there.
 *
 * The caller adds the `<div data-node-id class="code-node">` wrapper.
 */
import sanitizeHtml from "sanitize-html";
import { hasDangerousScheme } from "../config/url";
import { isSafeStyleString } from "../config/sanitize";

const NODE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const HTML_TAGS = [
  "div", "section", "article", "header", "footer", "aside", "nav", "main", "span", "p", "a",
  "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "dl", "dt", "dd",
  "strong", "em", "b", "i", "u", "s", "small", "mark", "br", "hr", "blockquote",
  "figure", "figcaption", "picture", "source", "img",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "details", "summary", "time", "sup", "sub", "abbr", "cite", "code", "pre", "q",
] as const;

/** SVG subset, in the case a browser uses. The parser may hand us any case. */
const SVG_TAGS = [
  "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon",
  "defs", "linearGradient", "radialGradient", "stop", "title",
] as const;

const SVG_TAG_BY_LOWER = new Map<string, string>(SVG_TAGS.map((t) => [t.toLowerCase(), t]));
const SVG_TAG_SET = new Set<string>(SVG_TAGS);

/** Removed together with everything inside them (sanitize-html `nonTextTags`). */
const REMOVED_WITH_CONTENT = [
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet", "base", "meta",
  "link", "form", "input", "button", "select", "textarea", "option", "noscript", "template",
  "math", "portal",
  // Raw-text or script-capable elements that are not on the list above but
  // must never leak their content as markup.
  "xmp", "noembed", "noframes", "plaintext", "optgroup", "datalist", "dialog", "slot",
  "foreignobject", "use", "image", "animate", "animatemotion", "animatetransform", "set",
  "feimage", "handler", "listener",
];

/** A tag name that is never allowed; renaming a tag to it drops the tag (keeps text). */
const BLOCKED_TAG = "blocked-tag";

const GLOBAL_ATTRS = ["class", "id", "title", "dir", "lang", "role", "style"] as const;

const TAG_ATTRS: Record<string, readonly string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
  source: ["srcset", "sizes", "media", "type"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  time: ["datetime"],
  details: ["open"],
  ol: ["start", "reversed", "type"],
};

const SVG_ATTRS = [
  "viewBox", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d",
  "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "points",
  "transform", "offset", "stop-color", "stop-opacity", "opacity", "gradientUnits",
  "gradientTransform", "fill-rule", "clip-rule", "xmlns",
] as const;

const SVG_ATTR_BY_LOWER = new Map<string, string>(SVG_ATTRS.map((a) => [a.toLowerCase(), a]));

/** ARIA attributes whose value is a list of element ids (prefixed like `id`). */
const ARIA_ID_REFS = new Set([
  "aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant",
  "aria-details", "aria-errormessage", "aria-flowto",
]);

const ARIA_NAME = /^aria-[a-z]+$/;
const DATA_NAME = /^data-[a-z0-9][a-z0-9_.-]*$/;
/**
 * data-* names the builder canvas and storefront runtimes read. Code must not
 * pose as a node, section or editor control (the canvas has the dashboard
 * origin) or drive a runtime hook.
 */
const RESERVED_DATA = /^data-(?:node-|section-|editor-|sf-|part$|slot$|copied-style$|bottom-nav$|hs-)/;

const HREF_SCHEMES = ["http", "https", "mailto", "tel"] as const;
const IMAGE_SCHEMES = ["https"] as const;
const REL_TOKENS = new Set(["nofollow", "noopener", "noreferrer", "sponsored", "ugc", "external"]);

/** Characters a browser drops or ignores around and inside a URL scheme. */
const URL_IGNORED = /[\u0000-\u0020\u007f-\u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u3000\ufeff]/g;

/** Text a value must never contain, after removing what a browser ignores. */
const DANGEROUS_IN_VALUE = /javascript:|vbscript:|livescript:|data:text\/html|data:image\/svg/i;

// ---------------------------------------------------------------------------
// URL checks

function compactUrl(value: string): string {
  return value.replace(URL_IGNORED, "");
}

/**
 * True when `value` is an allowed URL: one of `schemes`, a fragment, a query,
 * or a relative path. Protocol-relative (`//host`, `\\host`, `/\host`) is never
 * allowed, nor any scheme `hasDangerousScheme` knows.
 */
function isAllowedUrl(value: string, schemes: readonly string[]): boolean {
  if (hasDangerousScheme(value)) return false;
  const compact = compactUrl(value);
  if (compact === "") return false;
  if (DANGEROUS_IN_VALUE.test(compact)) return false;
  if (/^[\\/]{2}/.test(compact)) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact);
  if (scheme) return schemes.includes(scheme[1]!.toLowerCase());
  // A colon before any `/`, `?` or `#` that is not a valid scheme is still
  // read as one by some parsers; refuse it rather than guess.
  const colon = compact.indexOf(":");
  if (colon !== -1) {
    const firstSep = compact.search(/[/?#]/);
    if (firstSep === -1 || colon < firstSep) return false;
  }
  return true;
}

/** Every `srcset` candidate must be an https or relative URL, or the attribute is dropped. */
function cleanSrcset(value: string): string | null {
  const candidates = value.split(",").map((c) => c.trim());
  if (candidates.length === 0 || candidates.length > 20) return null;
  const out: string[] = [];
  for (const candidate of candidates) {
    if (candidate === "") return null;
    const [url, ...descriptors] = candidate.split(/\s+/);
    if (!url || !isAllowedUrl(url, IMAGE_SCHEMES)) return null;
    if (descriptors.length > 1) return null;
    if (descriptors.length === 1 && !/^\d+(?:\.\d+)?[wx]$/.test(descriptors[0]!)) return null;
    out.push([url, ...descriptors].join(" "));
  }
  return out.join(", ");
}

// ---------------------------------------------------------------------------
// Style checks

/** Splits CSS declarations at top-level `;`, honouring quotes and parentheses. */
function splitDeclarations(css: string): string[] | null {
  const parts: string[] = [];
  let current = "";
  let quote: string | null = null;
  let depth = 0;
  for (const ch of css) {
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth < 0) return null;
    } else if (ch === ";" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (quote || depth !== 0) return null;
  parts.push(current);
  return parts;
}

const STYLE_FORBIDDEN = /[\\{}@]|\/\*|\*\/|<!--|-->|(?:^|[^a-z-])(?:-webkit-)?(?:image-set|image|cross-fade|element|src)\s*\(/i;
const STYLE_PROPERTY = /^(?:-?[a-z][a-z0-9-]*|--[a-z0-9-]+)$/i;
/** Most `url(` in one inline style. */
const MAX_STYLE_URLS = 8;

/**
 * Cleans an inline `style` value: every declaration must parse and pass the
 * shared safe-value check (`isSafeStyleString`), or the whole attribute is
 * dropped (returns null). The output is rebuilt from what was checked.
 */
function cleanStyle(value: string): string | null {
  if (value.length > 4000) return null;
  // Control characters can hide a keyword from a pattern; refuse them.
  if (/[\u0000-\u0008\u000b\u000e-\u001f\u007f-\u009f]/.test(value)) return null;
  if (STYLE_FORBIDDEN.test(value)) return null;
  // Each `url(` costs a scan to the end of the value in the url() patterns
  // below; a real inline style has a few, so many are refused before they run.
  if ((value.match(/url\s*\(/gi)?.length ?? 0) > MAX_STYLE_URLS) return null;
  if (!isSafeStyleString(value)) return null;
  const parts = splitDeclarations(value);
  if (!parts) return null;
  const out: string[] = [];
  for (const part of parts) {
    const decl = part.trim();
    if (decl === "") continue;
    const colon = decl.indexOf(":");
    if (colon <= 0) return null;
    const prop = decl.slice(0, colon).trim();
    const val = decl.slice(colon + 1).trim();
    if (!STYLE_PROPERTY.test(prop) || val === "") return null;
    if (!isSafeStyleString(val)) return null;
    // isSafeStyleString only checks url(...) it can match; make sure every
    // `url(` it saw is one it checked.
    const urlOpens = (val.match(/url\s*\(/gi) ?? []).length;
    const urlChecked = (val.match(/url\(\s*(['"]?)(.*?)\1\s*\)/gi) ?? []).length;
    if (urlOpens !== urlChecked) return null;
    for (const m of val.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      if (!isAllowedUrl(m[2] ?? "", IMAGE_SCHEMES)) return null;
    }
    out.push(`${prop.toLowerCase()}: ${val}`);
  }
  return out.length ? out.join("; ") : null;
}

// ---------------------------------------------------------------------------
// Attribute values

const DIR_VALUES = new Set(["ltr", "rtl", "auto"]);
const LANG = /^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/i;
const ROLE = /^[a-z]+(?: [a-z]+)*$/;
const INTEGER = /^\d{1,4}$/;
const SIGNED_INTEGER = /^-?\d{1,6}$/;
const DIMENSION = /^\d{1,5}(?:\.\d{1,3})?(?:px|%)?$/;
const MIME = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i;
const OL_TYPES = new Set(["1", "a", "A", "i", "I"]);
/** A paint value may reference an in-section gradient, nothing else external. */
const PAINT_URL = /url\(\s*#([A-Za-z0-9_-]{1,64})\s*\)/g;
const SVG_PAINT_ATTRS = new Set(["fill", "stroke"]);
const XMLNS_SVG = "http://www.w3.org/2000/svg";

function prefixId(nodeId: string, id: string): string {
  return `c-${nodeId}-${id}`;
}

/** Generic value checks applied to every kept attribute. */
function isSafeValue(value: string): boolean {
  if (value.length > 8000) return false;
  // `<` in an attribute is how mutation XSS smuggles markup; nothing we allow needs it.
  if (value.includes("<")) return false;
  if (DANGEROUS_IN_VALUE.test(compactUrl(value))) return false;
  return true;
}

type Attribs = Record<string, string>;

function cleanGlobalAttr(name: string, value: string, nodeId: string): string | null {
  switch (name) {
    case "class":
      return value.trim().replace(/\s+/g, " ") || null;
    case "id": {
      const id = value.trim();
      return id && !/\s/.test(id) ? prefixId(nodeId, id) : null;
    }
    case "title":
      return value;
    case "dir":
      return DIR_VALUES.has(value.trim().toLowerCase()) ? value.trim().toLowerCase() : null;
    case "lang":
      return LANG.test(value.trim()) ? value.trim() : null;
    case "role":
      return ROLE.test(value.trim()) ? value.trim() : null;
    case "style":
      return cleanStyle(value);
    default:
      return null;
  }
}

function cleanTagAttr(tag: string, name: string, value: string): string | null {
  const v = value.trim();
  switch (`${tag}:${name}`) {
    case "a:href":
      return isAllowedUrl(v, HREF_SCHEMES) ? v : null;
    case "a:target":
    case "a:rel":
      // Normalised in cleanAttributes once every attribute is known.
      return v;
    case "img:src":
      return isAllowedUrl(v, IMAGE_SCHEMES) ? v : null;
    case "img:srcset":
    case "source:srcset":
      return cleanSrcset(v);
    case "img:sizes":
    case "source:sizes":
    case "source:media":
    case "img:alt":
      return value;
    case "img:width":
    case "img:height":
      return DIMENSION.test(v) ? v : null;
    case "img:loading":
      return v === "lazy" || v === "eager" ? v : null;
    case "img:decoding":
      return v === "async" || v === "sync" || v === "auto" ? v : null;
    case "source:type":
      return MIME.test(v) ? v : null;
    case "td:colspan":
    case "td:rowspan":
    case "th:colspan":
    case "th:rowspan":
      return INTEGER.test(v) ? v : null;
    case "time:datetime":
      return value;
    case "details:open":
    case "ol:reversed":
      return "";
    case "ol:start":
      return SIGNED_INTEGER.test(v) ? v : null;
    case "ol:type":
      return OL_TYPES.has(v) ? v : null;
    default:
      return null;
  }
}

function cleanSvgAttr(name: string, value: string, nodeId: string): string | null {
  if (name === "xmlns") return value.trim() === XMLNS_SVG ? XMLNS_SVG : null;
  if (/url\s*\(/i.test(value)) {
    if (!SVG_PAINT_ATTRS.has(name)) return null;
    const rewritten = value.replace(PAINT_URL, (_m, id: string) => `url(#${prefixId(nodeId, id)})`);
    // Anything other than url(#id) is an external load: refuse it.
    if (/url\s*\(\s*(?!#c-)/i.test(rewritten)) return null;
    return rewritten;
  }
  return value;
}

/** Applies every attribute rule for one tag. `tag` is already canonical. */
function cleanAttributes(tag: string, attribs: Attribs, nodeId: string): Attribs {
  const out: Attribs = {};
  const isSvg = SVG_TAG_SET.has(tag) && tag !== "title";
  const isSvgTitle = tag === "title";
  for (const [rawName, rawValue] of Object.entries(attribs)) {
    const name = rawName.toLowerCase();
    const value = typeof rawValue === "string" ? rawValue : "";
    // No event handler, ever, in any casing.
    if (name.startsWith("on")) continue;
    if (!isSafeValue(value)) continue;

    let kept: string | null = null;
    let outName = name;
    if ((GLOBAL_ATTRS as readonly string[]).includes(name)) {
      kept = cleanGlobalAttr(name, value, nodeId);
    } else if (ARIA_NAME.test(name)) {
      kept = ARIA_ID_REFS.has(name)
        ? value.trim().split(/\s+/).filter(Boolean).map((id) => prefixId(nodeId, id)).join(" ") || null
        : value;
    } else if (DATA_NAME.test(name) && !RESERVED_DATA.test(name)) {
      kept = hasDangerousScheme(value) ? null : value;
    } else if (isSvg && SVG_ATTR_BY_LOWER.has(name)) {
      outName = SVG_ATTR_BY_LOWER.get(name)!;
      kept = cleanSvgAttr(outName, value, nodeId);
    } else if (!isSvg && !isSvgTitle && TAG_ATTRS[tag]?.includes(name)) {
      kept = cleanTagAttr(tag, name, value);
    }
    if (kept !== null) out[outName] = kept;
  }

  if (tag === "a") {
    const target = out.target?.trim().toLowerCase();
    if (target === "_blank") {
      const extra = (out.rel ?? "").toLowerCase().split(/\s+/).filter((t) => REL_TOKENS.has(t) && t !== "noopener" && t !== "noreferrer");
      out.target = "_blank";
      out.rel = ["noopener", "noreferrer", ...new Set(extra)].join(" ");
    } else {
      delete out.target;
      if (out.rel !== undefined) {
        const rel = [...new Set(out.rel.toLowerCase().split(/\s+/).filter((t) => REL_TOKENS.has(t)))].join(" ");
        if (rel) out.rel = rel;
        else delete out.rel;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Options

const ALLOWED_TAGS: string[] = [...HTML_TAGS, ...SVG_TAGS];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  "*": [...GLOBAL_ATTRS, "aria-*", "data-*"],
  ...Object.fromEntries(Object.entries(TAG_ATTRS).map(([tag, attrs]) => [tag, [...attrs]])),
  ...Object.fromEntries(SVG_TAGS.filter((t) => t !== "title").map((t) => [t, [...SVG_ATTRS]])),
};

function buildOptions(nodeId: string): sanitizeHtml.IOptions {
  // Open-element stack, fed by the parser's own open/close events, and the
  // number of <svg> on it, so a tag knows in O(1) whether it sits inside one.
  // `checkCodeOutput` keeps the stack at most CODE_OUTPUT_MAX_DEPTH deep.
  const stack: string[] = [];
  let svgDepth = 0;
  return {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: [...HREF_SCHEMES],
    allowedSchemesByTag: { img: [...IMAGE_SCHEMES], source: [...IMAGE_SCHEMES] },
    allowedSchemesAppliedToAttributes: ["href", "src", "cite", "action", "formaction", "xlink:href"],
    allowProtocolRelative: false,
    allowVulnerableTags: false,
    disallowedTagsMode: "discard",
    selfClosing: ["img", "br", "hr", "source"],
    nonTextTags: REMOVED_WITH_CONTENT,
    // Our own declaration parser checks and rebuilds `style` (cleanStyle);
    // postcss parsing would only work on the server.
    parseStyleAttributes: false,
    enforceHtmlBoundary: false,
    onOpenTag: (name) => {
      const lower = name.toLowerCase();
      stack.push(lower);
      if (lower === "svg") svgDepth++;
    },
    onCloseTag: (name) => {
      const at = stack.lastIndexOf(name.toLowerCase());
      if (at === -1) return;
      for (let i = stack.length - 1; i >= at; i--) if (stack[i] === "svg") svgDepth--;
      stack.length = at;
    },
    transformTags: {
      "*": (tagName, attribs) => {
        const lower = tagName.toLowerCase();
        // The parser keeps the source case inside <svg>; compare in lower case
        // so `<Script>` or `<foreignObject>` still meet nonTextTags.
        const canonical = SVG_TAG_BY_LOWER.get(lower) ?? lower;
        if (!ALLOWED_TAGS.includes(canonical)) return { tagName: lower, attribs: {} };
        // onOpenTag already pushed this tag: count only the <svg> around it.
        const inSvg = svgDepth - (lower === "svg" ? 1 : 0) > 0;
        // No links inside SVG.
        if (canonical === "a" && inSvg) return { tagName: BLOCKED_TAG, attribs: {} };
        return { tagName: canonical, attribs: cleanAttributes(canonical, attribs as Attribs, nodeId) };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Final assertion

const OUTPUT_TAG = /<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:\s+[^\s"'=<>/]+(?:="[^"<>]*")?)*)\s*(\/?)>/g;
const OUTPUT_ATTR = /\s+([^\s"'=<>/]+)(?:="([^"]*)")?/g;
const NEVER_IN_OUTPUT = /<!--|<script|<\/style|<iframe|<!\[cdata\[/i;
const ALLOWED_TAG_SET = new Set(ALLOWED_TAGS.map((t) => t.toLowerCase()));

function decodeOutputEntities(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Re-reads the cleaned output; false if anything executable got through. */
function isSafeOutput(html: string): boolean {
  if (NEVER_IN_OUTPUT.test(html)) return false;
  let unsafe = false;
  const rest = html.replace(OUTPUT_TAG, (_m, _close: string, name: string, attrs: string) => {
    if (!ALLOWED_TAG_SET.has(name.toLowerCase())) unsafe = true;
    for (const attr of attrs.matchAll(OUTPUT_ATTR)) {
      const attrName = (attr[1] ?? "").toLowerCase();
      const attrValue = decodeOutputEntities(attr[2] ?? "");
      if (attrName.startsWith("on") || attrName === "srcdoc" || attrName.includes(":")) unsafe = true;
      if (NEVER_IN_OUTPUT.test(attrValue) || attrValue.includes("<")) unsafe = true;
      if (DANGEROUS_IN_VALUE.test(compactUrl(attrValue)) || hasDangerousScheme(attrValue)) unsafe = true;
    }
    return "";
  });
  // Text is always escaped, so any `<` or `>` left is a tag we could not read.
  if (rest.includes("<") || rest.includes(">")) return false;
  return !unsafe;
}

// ---------------------------------------------------------------------------
// Input limits
//
// sanitize-html and its parser do work per open element for every tag (the
// parser's element stack is an array it unshifts and searches), so their cost
// grows with tags × depth: 41k unclosed tags took 0.6 s. A template can build
// that much markup in under a millisecond (`append` doubling), so the input is
// bounded before it is parsed. A real section is far below these.

/** Most characters of Liquid output the cleaner accepts. */
export const CODE_OUTPUT_MAX_CHARS = 128 * 1024;
/** Most tags (`<name`) in it. */
export const CODE_OUTPUT_MAX_TAGS = 4000;
/** Deepest element nesting in it. */
export const CODE_OUTPUT_MAX_DEPTH = 128;

export type CodeOutputLimit =
  | { code: "output_too_large"; message: string; params: { kb: number } }
  | { code: "output_too_many_tags"; message: string; params: { tags: number } }
  | { code: "output_too_deep"; message: string; params: { depth: number } };

/** Elements the parser never pushes (htmlparser2's void elements). */
const VOID_ELEMENTS = new Set([
  "area", "base", "basefont", "br", "col", "command", "embed", "frame", "hr", "img", "input",
  "isindex", "keygen", "link", "meta", "param", "source", "track", "wbr",
]);
/** Elements that start foreign content, where `/>` closes a tag. */
const FOREIGN_ELEMENTS = new Set(["svg", "math"]);
/** Elements that go back to HTML inside foreign content. */
const INTEGRATION_ELEMENTS = new Set(["mi", "mo", "mn", "ms", "mtext", "annotation-xml", "foreignobject", "desc", "title"]);
const P_CLOSERS = [
  "address", "article", "aside", "blockquote", "details", "div", "dl", "fieldset", "figcaption", "figure",
  "footer", "form", "header", "hr", "main", "nav", "ol", "pre", "section", "table", "ul",
];
const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
/** The open elements a new tag closes (the common part of htmlparser2's table). */
const OPEN_IMPLIES_CLOSE = new Map<string, ReadonlySet<string>>([
  ...P_CLOSERS.map((tag) => [tag, new Set(["p"])] as const),
  ...HEADINGS.map((h) => [h, new Set([...HEADINGS, "p"])] as const),
  ["tr", new Set(["tr", "th", "td"])],
  ["th", new Set(["th"])],
  ["td", new Set(["thead", "th", "td"])],
  ["li", new Set(["li"])],
  ["p", new Set(["p"])],
  ["dd", new Set(["dd", "dt"])],
  ["dt", new Set(["dd", "dt"])],
  ["option", new Set(["option"])],
  ["tbody", new Set(["thead", "tbody"])],
  ["tfoot", new Set(["thead", "tbody"])],
]);

const isTagStart = (code: number) => (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
const isSpace = (code: number) => code === 32 || code === 9 || code === 10 || code === 12 || code === 13;

const CH_BANG = 33;
const CH_DQUOTE = 34;
const CH_SQUOTE = 39;
const CH_SLASH = 47;
const CH_EQUALS = 61;
const CH_GT = 62;
const CH_QUESTION = 63;

/**
 * One linear pass over `html` that refuses what would make the cleaner slow:
 * more than CODE_OUTPUT_MAX_CHARS characters, more than CODE_OUTPUT_MAX_TAGS
 * tags (every `<` followed by a letter, inside attribute values too, so it
 * never counts fewer than the parser sees), or elements nested deeper than
 * CODE_OUTPUT_MAX_DEPTH (a model of the parser's open-element stack: void
 * elements, `/>` in SVG, a closing tag closing everything above its match,
 * and the usual implied closes). Returns null when the output is within them.
 */
export function checkCodeOutput(html: string): CodeOutputLimit | null {
  if (html.length > CODE_OUTPUT_MAX_CHARS) {
    const kb = CODE_OUTPUT_MAX_CHARS / 1024;
    return { code: "output_too_large", message: `The section's HTML is too long (more than ${kb} KB).`, params: { kb } };
  }
  const n = html.length;
  let tags = 0;
  for (let i = html.indexOf("<"); i !== -1; i = html.indexOf("<", i + 1)) {
    if (i + 1 < n && isTagStart(html.charCodeAt(i + 1))) tags++;
  }
  if (tags > CODE_OUTPUT_MAX_TAGS) {
    return { code: "output_too_many_tags", message: `The section's HTML has more than ${CODE_OUTPUT_MAX_TAGS} tags.`, params: { tags: CODE_OUTPUT_MAX_TAGS } };
  }

  const stack: string[] = [];
  const open = new Map<string, number>();
  // The parser's foreign-content stack: one entry per foreign or integration element open.
  const foreign: boolean[] = [false];
  const pop = () => {
    const name = stack.pop()!;
    open.set(name, open.get(name)! - 1);
    if (FOREIGN_ELEMENTS.has(name) || INTEGRATION_ELEMENTS.has(name)) foreign.pop();
  };

  let i = html.indexOf("<");
  while (i !== -1 && i + 1 < n) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      if (end === -1) break;
      i = html.indexOf("<", end + 3);
      continue;
    }
    const next = html.charCodeAt(i + 1);
    const closing = next === CH_SLASH && i + 2 < n && isTagStart(html.charCodeAt(i + 2));
    if (!closing && !isTagStart(next)) {
      // `<!doctype>`, `<?…>` and `</ …>` run to their `>`; any other `<` is text.
      if (next === CH_BANG || next === CH_QUESTION || next === CH_SLASH) {
        const end = html.indexOf(">", i + 2);
        if (end === -1) break;
        i = html.indexOf("<", end + 1);
      } else {
        i = html.indexOf("<", i + 1);
      }
      continue;
    }
    let j = i + (closing ? 2 : 1);
    const nameStart = j;
    while (j < n) {
      const c = html.charCodeAt(j);
      if (isSpace(c) || c === CH_SLASH || c === CH_GT) break;
      j++;
    }
    const name = html.slice(nameStart, j).toLowerCase();

    if (closing) {
      const end = html.indexOf(">", j);
      if (end === -1) break;
      if (!VOID_ELEMENTS.has(name) && (open.get(name) ?? 0) > 0) {
        while (stack[stack.length - 1] !== name) pop();
        pop();
      }
      i = html.indexOf("<", end + 1);
      continue;
    }

    // Attributes: a quote opens a value only right after `=`; `/>` self-closes
    // unless the `/` ends an unquoted value.
    let selfClosing = false;
    let ended = false;
    while (j < n) {
      const c = html.charCodeAt(j);
      if (c === CH_GT) {
        ended = true;
        break;
      }
      if (c === CH_EQUALS) {
        j++;
        while (j < n && isSpace(html.charCodeAt(j))) j++;
        const q = html.charCodeAt(j);
        if (q === CH_DQUOTE || q === CH_SQUOTE) {
          const close = html.indexOf(q === CH_DQUOTE ? '"' : "'", j + 1);
          if (close === -1) break;
          j = close + 1;
        } else {
          while (j < n && !isSpace(html.charCodeAt(j)) && html.charCodeAt(j) !== CH_GT) j++;
        }
        selfClosing = false;
        continue;
      }
      selfClosing = c === CH_SLASH && html.charCodeAt(j + 1) === CH_GT;
      j++;
    }
    // An unterminated tag: the parser reads the rest as part of it.
    if (!ended) break;

    const implied = OPEN_IMPLIES_CLOSE.get(name);
    if (implied) while (stack.length && implied.has(stack[stack.length - 1]!)) pop();
    if (!VOID_ELEMENTS.has(name)) {
      stack.push(name);
      open.set(name, (open.get(name) ?? 0) + 1);
      if (FOREIGN_ELEMENTS.has(name)) foreign.push(true);
      else if (INTEGRATION_ELEMENTS.has(name)) foreign.push(false);
      if (stack.length > CODE_OUTPUT_MAX_DEPTH) {
        return {
          code: "output_too_deep",
          message: `The section's HTML nests elements more than ${CODE_OUTPUT_MAX_DEPTH} levels deep.`,
          params: { depth: CODE_OUTPUT_MAX_DEPTH },
        };
      }
      if (selfClosing && foreign[foreign.length - 1]) pop();
    }
    i = html.indexOf("<", j + 1);
  }
  return null;
}

// ---------------------------------------------------------------------------

/**
 * Cleans the HTML a code section rendered. `nodeId` (the code node's id) is
 * used to prefix every `id` as `c-<nodeId>-…`. Throws on a malformed nodeId.
 * Returns '' when the final check finds anything executable, and when the
 * input is over the limits of `checkCodeOutput` (the renderer refuses such
 * output first, with a reason; this keeps the cleaner bounded for any caller).
 */
export function sanitizeCodeHtml(html: string, options: { nodeId: string }): string {
  const nodeId = options?.nodeId;
  if (typeof nodeId !== "string" || !NODE_ID.test(nodeId)) {
    throw new Error("sanitizeCodeHtml: invalid nodeId");
  }
  if (typeof html !== "string" || html === "") return "";
  if (checkCodeOutput(html)) return "";
  // Browsers turn NUL into U+FFFD; dropping it can only join a tag name that
  // the allowlist then sees whole.
  const input = html.replace(/\u0000/g, "");
  const out = sanitizeHtml(input, buildOptions(nodeId));
  return isSafeOutput(out) ? out : "";
}
