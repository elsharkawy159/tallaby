/**
 * Seller-written email text (store email campaigns, ROADMAP.md F-16a) →
 * blocks the email renders as React text nodes. Never HTML: the only
 * formatting is a blank line between paragraphs, single line breaks,
 * `**bold**` and lists whose lines start with "- ", "* " or "• ".
 * Everything else is shown exactly as typed (React escapes it).
 */

export type InlinePart = { text: string; bold: boolean };
export type TextBlock =
  | { kind: "paragraph"; lines: InlinePart[][] }
  | { kind: "list"; items: InlinePart[][] };

const LIST_RE = /^\s*(?:[-*•])\s+/;

/** `a **b** c` → [a ][b, bold][ c]. An unmatched `**` stays as typed. */
export function parseInline(line: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /\*\*([^*]+?)\*\*/g;
  let last = 0;
  for (const match of line.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: line.slice(last, index), bold: false });
    parts.push({ text: match[1]!, bold: true });
    last = index + match[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), bold: false });
  return parts.filter((p) => p.text.length > 0);
}

export function parsePlainText(body: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const chunks = body.replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
    if (!lines.length) continue;
    if (lines.every((l) => LIST_RE.test(l))) {
      blocks.push({ kind: "list", items: lines.map((l) => parseInline(l.replace(LIST_RE, "").trim())) });
    } else {
      blocks.push({ kind: "paragraph", lines: lines.map((l) => parseInline(l.trim())) });
    }
  }
  return blocks;
}
