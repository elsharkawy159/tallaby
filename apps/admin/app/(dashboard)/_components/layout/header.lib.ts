const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CUID_RE = /^c[a-z0-9]{24,}$/i
const NUMERIC_ID_RE = /^\d+$/
const LONG_ALNUM_RE = /^[a-z0-9_-]{20,}$/i

function isDynamicSegment(segment: string): boolean {
  return (
    UUID_RE.test(segment) ||
    CUID_RE.test(segment) ||
    NUMERIC_ID_RE.test(segment) ||
    LONG_ALNUM_RE.test(segment)
  )
}

function capitalizeWords(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/** Derive a navbar page title from the current pathname. */
export function getPageTitleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'Dashboard'

  const titleSegments = segments.filter((segment) => !isDynamicSegment(segment))
  if (titleSegments.length === 0) return 'Dashboard'

  return titleSegments.map(capitalizeWords).join(' ')
}
