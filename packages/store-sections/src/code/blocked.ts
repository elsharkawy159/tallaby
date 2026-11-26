/**
 * Save-time check for constructs a code section may not contain (ROADMAP F-101,
 * design note §5.1 and §11.2). It tells the author, with a line and column,
 * that something won't render. It is NOT the security boundary: a template can
 * assemble a tag across conditions, so `sanitizeCodeHtml` cleans every render.
 *
 * The whole source is scanned, including `{% comment %}` and `{% raw %}`
 * blocks, so an author is never told code is fine when it isn't.
 */

/** Every construct `findBlockedConstructs` reports; each is the issue code `blocked_<kind>`. */
export const BLOCKED_KINDS = [
  "script",
  "event_handler",
  "javascript_url",
  "form",
  "iframe",
  "style_tag",
  "javascript_tag",
  "object",
  "meta",
  "base",
  "link",
] as const;

export type BlockedIssue = {
  kind: (typeof BLOCKED_KINDS)[number];
  line: number;
  column: number;
  message: string;
};

type Kind = BlockedIssue["kind"];

/** A tag name ends where a name character can no longer follow. */
const END = "(?![a-z0-9-])";

const PATTERNS: { kind: Kind; re: RegExp; message: string }[] = [
  { kind: "script", re: new RegExp(`<script${END}`, "gi"), message: "Script tags are not allowed. Code sections support HTML, Liquid and CSS only." },
  { kind: "event_handler", re: /(?<=[\s"'/])on[a-z]+\s*=/gi, message: "Event handler attributes (such as onclick) are not allowed. Code sections can't run JavaScript." },
  { kind: "form", re: new RegExp(`<form${END}`, "gi"), message: "Forms are not allowed in code sections. Use the built-in form element instead." },
  { kind: "iframe", re: new RegExp(`<iframe${END}`, "gi"), message: "Iframes are not allowed in code sections." },
  { kind: "style_tag", re: new RegExp(`<style${END}`, "gi"), message: "Style tags are not allowed. Put your CSS in the section's stylesheet instead." },
  { kind: "object", re: new RegExp(`<(?:object|embed)${END}`, "gi"), message: "Object and embed tags are not allowed in code sections." },
  { kind: "meta", re: new RegExp(`<meta${END}`, "gi"), message: "Meta tags are not allowed in code sections." },
  { kind: "base", re: new RegExp(`<base${END}`, "gi"), message: "Base tags are not allowed in code sections." },
  { kind: "link", re: new RegExp(`<link${END}`, "gi"), message: "Link tags are not allowed. Put your CSS in the section's stylesheet instead." },
  { kind: "javascript_tag", re: /\{%-?\s*javascript(?![a-z0-9_])/gi, message: "The javascript tag is not allowed. Code sections can't run JavaScript." },
];

const JAVASCRIPT_URL_MESSAGE = "javascript: links are not allowed. Use an https:, mailto: or tel: link, or a page path.";

const NAMED_ENTITIES: Record<string, string> = {
  colon: ":", tab: String.fromCharCode(9), newline: String.fromCharCode(10), lpar: "(", rpar: ")", sol: "/", period: ".", nbsp: "\u00a0",
};

/**
 * Decodes simple character references (`&#106;`, `&#x6A;`, `&colon;`, `&Tab;`)
 * and drops what a browser ignores inside a URL scheme (tabs, newlines and
 * other control characters), keeping each kept character's source offset.
 */
function decodeForScheme(source: string): { text: string; offsets: number[] } {
  let text = "";
  const offsets: number[] = [];
  const push = (ch: string, at: number) => {
    if (/[\u0000-\u001f\u007f-\u009f]/.test(ch)) return;
    text += ch.toLowerCase();
    offsets.push(at);
  };
  let i = 0;
  while (i < source.length) {
    if (source[i] === "&") {
      const ref = /^&(?:#x([0-9a-f]{1,6})|#(\d{1,7})|([a-z]{2,8}));?/i.exec(source.slice(i, i + 12));
      if (ref) {
        let decoded: string | undefined;
        if (ref[1] !== undefined) decoded = safeFromCodePoint(parseInt(ref[1], 16));
        else if (ref[2] !== undefined) decoded = safeFromCodePoint(parseInt(ref[2], 10));
        else if (ref[3] !== undefined) decoded = NAMED_ENTITIES[ref[3].toLowerCase()];
        if (decoded !== undefined) {
          push(decoded, i);
          i += ref[0].length;
          continue;
        }
      }
    }
    push(source[i]!, i);
    i++;
  }
  return { text, offsets };
}

function safeFromCodePoint(code: number): string | undefined {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return undefined;
  return String.fromCodePoint(code);
}

function position(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (source.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

/** Every blocked construct in `source`, in source order, with 1-based line and column. */
export function findBlockedConstructs(source: string): BlockedIssue[] {
  if (typeof source !== "string" || source === "") return [];
  const found: { kind: Kind; offset: number; message: string }[] = [];

  for (const { kind, re, message } of PATTERNS) {
    for (const match of source.matchAll(re)) {
      found.push({ kind, offset: match.index ?? 0, message });
    }
  }

  const { text, offsets } = decodeForScheme(source);
  for (const match of text.matchAll(/javascript:/g)) {
    found.push({ kind: "javascript_url", offset: offsets[match.index ?? 0] ?? 0, message: JAVASCRIPT_URL_MESSAGE });
  }

  found.sort((a, b) => a.offset - b.offset || a.kind.localeCompare(b.kind));
  return found.map(({ kind, offset, message }) => ({ kind, ...position(source, offset), message }));
}
