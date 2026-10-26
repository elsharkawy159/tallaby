/*
 * Product short descriptions used to be plain text and are now rich text
 * (dashboard product form, 2026-10-26). Both kinds live in the same column,
 * so readers check which one they have. No sanitize-html here: these run in
 * client bundles too.
 */

const TAG_RE = /<\/?[a-z][a-z0-9]*\b[^>]*>/i

/** True when the text holds HTML tags (rich text), not plain text that may contain `<`. */
export function isRichTextHtml(value: string | null | undefined): boolean {
  return !!value && TAG_RE.test(value)
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&#039;": "'",
}

/**
 * Rich text as plain text, one line per paragraph or list item, for meta
 * tags, structured data, feeds and share messages. Plain text comes back
 * unchanged.
 */
export function richTextToPlainText(value: string | null | undefined): string {
  if (!value) return ""
  if (!isRichTextHtml(value)) return value.trim()
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39|#039);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * Plain text as editor HTML: a paragraph per blank-line block, line breaks
 * kept. Rich text comes back unchanged (sanitise it before rendering).
 */
export function plainTextToRichText(value: string | null | undefined): string {
  if (!value?.trim()) return ""
  if (isRichTextHtml(value)) return value
  return value
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\r?\n/g, "<br>")}</p>`)
    .join("")
}
