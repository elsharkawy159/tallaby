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

const MEDIA_TAG_DETECT_RE = /<(img|hr)\b/i
const MEDIA_TAG_EXTRACT_RE = /<(img|hr)\b[^>]*\/?>/gi

export function hasRichTextMedia(html: string | null | undefined): boolean {
  if (!html?.trim()) return false
  return MEDIA_TAG_DETECT_RE.test(sanitizeRichTextHtml(html))
}

export function mergeRichTextMediaFallback(
  primaryHtml: string | null | undefined,
  fallbackHtml: string | null | undefined
): string | null {
  const primary = primaryHtml?.trim() ? sanitizeRichTextHtml(primaryHtml) : ""
  const fallback = fallbackHtml?.trim() ? sanitizeRichTextHtml(fallbackHtml) : ""

  if (!primary && !fallback) return null
  if (!primary) return fallback || null
  if (hasRichTextMedia(primary)) return primary
  if (!hasRichTextMedia(fallback)) return primary

  const mediaNodes = fallback.match(MEDIA_TAG_EXTRACT_RE) ?? []
  if (mediaNodes.length === 0) return primary

  return `${primary}${mediaNodes.join("")}`
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html?.trim()) return true
  const sanitized = sanitizeRichTextHtml(html)
  if (MEDIA_TAG_DETECT_RE.test(sanitized)) return false
  const stripped = sanitized
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()
  return stripped.length === 0
}
