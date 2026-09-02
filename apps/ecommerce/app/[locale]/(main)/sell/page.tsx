import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { localizedUrl, buildLanguageAlternates, type SeoLocale } from '@/lib/metadata'
import { routing } from '@/i18n/routing'
import { SellPageContent } from './sell.chunks'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('pages.sell')
  const sellUrl = localizedUrl(locale as SeoLocale, '/sell')
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, '/sell')])
    ) as Partial<Record<SeoLocale, string>>
  )

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      'sell online Egypt',
      'marketplace seller',
      'Tallaby vendor',
      'start online store',
      'ecommerce seller',
    ],
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      url: sellUrl,
    },
    alternates: {
      canonical: sellUrl,
      languages,
    },
  }
}

export default function SellPage() {
  return <SellPageContent />
}
