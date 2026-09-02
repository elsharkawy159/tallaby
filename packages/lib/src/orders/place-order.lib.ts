/** Formats a variant title from option fields stored on cart item JSON. */
export function formatVariantTitleFromCart(
  variant:
    | {
        option1?: string | null
        option2?: string | null
        option3?: string | null
        title?: string | null
      }
    | null
    | undefined,
): string | null {
  if (!variant) return null
  if (variant.title) return variant.title

  const parts = [variant.option1, variant.option2, variant.option3].filter(
    Boolean,
  ) as string[]

  return parts.length > 0 ? parts.join(', ') : null
}

export function pickProductTitle(
  translations: Array<{ locale: string; title: string }> | undefined,
  locale: string,
  fallbackSku?: string | null,
  productId?: string,
): string {
  if (!translations?.length) {
    return fallbackSku ? `Product ${fallbackSku}` : `Product ${productId ?? ''}`
  }

  const match =
    locale === 'ar'
      ? translations.find((t) => t.locale === 'ar') ??
        translations.find((t) => t.locale === 'en')
      : translations.find((t) => t.locale === 'en')

  return match?.title ?? `Product ${fallbackSku ?? productId ?? ''}`
}

export function formatDecimal(value: number): string {
  return value.toFixed(2)
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += chars[bytes[i]! % chars.length]
  }
  return `ORD${suffix}`
}
