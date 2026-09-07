const PINTEREST_DESCRIPTION_MAX = 500
const DESCRIPTION_FALLBACK_MAX = 160
const MAX_BULLETS = 3

interface BuildPinterestAdDescriptionInput {
  /** Localized CTA headline, e.g. "Shop now — {title}". */
  adTitle: string
  bulletPoints?: string[]
  description?: string | null
  productUrl: string
}

/**
 * Builds an ad-style Pinterest pin description: CTA title, bullets (or a short
 * description), then the product URL. Caps at Pinterest's ~500-char limit and
 * prefers keeping the URL intact when truncating.
 */
export function buildPinterestAdDescription ({
  adTitle,
  bulletPoints = [],
  description,
  productUrl,
}: BuildPinterestAdDescriptionInput): string {
  const bodyParts: string[] = [adTitle.trim()]

  const bullets = bulletPoints
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, MAX_BULLETS)

  if (bullets.length > 0) {
    bodyParts.push(bullets.map((point) => `• ${point}`).join('\n'))
  } else {
    const trimmed = description?.trim()
    if (trimmed) {
      const short =
        trimmed.length > DESCRIPTION_FALLBACK_MAX
          ? `${trimmed.slice(0, DESCRIPTION_FALLBACK_MAX - 1).trimEnd()}…`
          : trimmed
      bodyParts.push(short)
    }
  }

  const body = bodyParts.filter(Boolean).join('\n\n')
  const url = productUrl.trim()

  if (!url) return truncate(body, PINTEREST_DESCRIPTION_MAX)

  const withUrl = `${body}\n\n${url}`
  if (withUrl.length <= PINTEREST_DESCRIPTION_MAX) return withUrl

  // Keep the URL whole: shrink the body so body + blank line + url fits.
  const reserved = url.length + 2
  const bodyMax = Math.max(0, PINTEREST_DESCRIPTION_MAX - reserved)
  if (bodyMax < 20) return url.slice(0, PINTEREST_DESCRIPTION_MAX)

  return `${truncate(body, bodyMax)}\n\n${url}`
}

function truncate (value: string, max: number): string {
  if (value.length <= max) return value
  if (max <= 1) return value.slice(0, max)
  return `${value.slice(0, max - 1).trimEnd()}…`
}
