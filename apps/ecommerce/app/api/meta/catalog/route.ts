import { NextResponse } from 'next/server'
import { db, products, eq } from '@workspace/db'
import { getPublicUrl } from '@workspace/ui/lib/utils'
import { BASE_URL, DEFAULT_CURRENCY } from '@/lib/constants'
import {
  escapeCsvField,
  formatMetaCatalogPrice,
  mapMetaCondition,
  META_CATALOG_CSV_HEADERS,
  resolvePrimaryImagePath,
} from '@/lib/meta/meta.catalog'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

/**
 * Dynamic Meta Product Catalog feed (CSV).
 * Catalog id = products.id (UUID) — must match Pixel/CAPI content_ids.
 * Links use Arabic (default locale) slugs: /products/{slug}
 */
export async function GET () {
  try {
    if (!BASE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL is not configured' },
        { status: 500 }
      )
    }

    const rows = await db.query.products.findMany({
      where: eq(products.status, 'active'),
      columns: {
        id: true,
        price: true,
        images: true,
        quantity: true,
        condition: true,
      },
      with: {
        brand: {
          columns: { name: true },
        },
        productTranslations: {
          columns: {
            locale: true,
            title: true,
            description: true,
            slug: true,
          },
        },
      },
    })

    const lines: string[] = [META_CATALOG_CSV_HEADERS.join(',')]

    for (const product of rows) {
      const translation =
        product.productTranslations.find((t) => t.locale === 'ar') ||
        product.productTranslations.find((t) => t.locale === 'en') ||
        product.productTranslations[0]

      if (!translation?.slug || !translation.title) continue

      const price = formatMetaCatalogPrice(product.price, DEFAULT_CURRENCY)
      if (!price) continue

      const imagePath = resolvePrimaryImagePath(product.images)
      if (!imagePath) continue

      const imageLink = getPublicUrl(imagePath, 'products')
      if (!imageLink) continue

      const stock = Number(product.quantity ?? 0)
      const availability = stock > 0 ? 'in stock' : 'out of stock'
      const description = (translation.description || translation.title)
        .replace(/\s+/g, ' ')
        .trim()
      const brand = product.brand?.name?.trim() || 'Tallaby'

      const fields = [
        product.id,
        translation.title.trim(),
        description,
        availability,
        mapMetaCondition(product.condition),
        price,
        `${BASE_URL}/products/${translation.slug}`,
        imageLink,
        brand,
      ]

      lines.push(fields.map((field) => escapeCsvField(String(field))).join(','))
    }

    const body = lines.join('\n')

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Meta catalog feed error:', error)
    return NextResponse.json(
      { error: 'Failed to generate catalog feed' },
      { status: 500 }
    )
  }
}
