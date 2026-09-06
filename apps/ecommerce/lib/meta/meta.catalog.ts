import { getPriceFinal } from '@workspace/lib'
import { DEFAULT_CURRENCY } from '@/lib/constants'

type TallabyCondition =
  | 'new'
  | 'renewed'
  | 'refurbished'
  | 'used_like_new'
  | 'used_very_good'
  | 'used_good'
  | 'used_acceptable'
  | string
  | null
  | undefined

export function mapMetaCondition (condition: TallabyCondition): string {
  switch (condition) {
    case 'new':
      return 'new'
    case 'renewed':
    case 'refurbished':
      return 'refurbished'
    case 'used_like_new':
    case 'used_very_good':
    case 'used_good':
    case 'used_acceptable':
      return 'used'
    default:
      return 'new'
  }
}

export function formatMetaCatalogPrice (
  price: unknown,
  currency: string = DEFAULT_CURRENCY
): string | null {
  const final = getPriceFinal(price)
  if (!Number.isFinite(final) || final <= 0) return null
  return `${final.toFixed(2)} ${currency}`
}

export function escapeCsvField (value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function resolvePrimaryImagePath (images: unknown): string | null {
  if (!images) return null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return resolvePrimaryImagePath(parsed)
    } catch {
      return images.trim() || null
    }
  }
  if (Array.isArray(images)) {
    for (const entry of images) {
      if (typeof entry === 'string' && entry.trim()) return entry.trim()
      if (entry && typeof entry === 'object') {
        const url =
          (entry as { url?: string; path?: string; src?: string }).url ||
          (entry as { path?: string }).path ||
          (entry as { src?: string }).src
        if (url?.trim()) return url.trim()
      }
    }
  }
  return null
}

export const META_CATALOG_CSV_HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
] as const
