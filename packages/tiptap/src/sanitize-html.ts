import sanitizeHtml from "sanitize-html"

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "span",
  "mark",
  "hr",
  "img",
]

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel", "class", "style"],
    img: ["src", "alt", "title", "width", "height", "class", "style"],
    "*": ["class", "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  disallowedTagsMode: "discard",
}

export function sanitizeRichTextHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS)
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html?.trim()) return true
  const stripped = sanitizeRichTextHtml(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()
  return stripped.length === 0
}
