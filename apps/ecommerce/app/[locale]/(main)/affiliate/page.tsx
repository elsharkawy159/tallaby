import type { Metadata } from 'next'

import { localizedUrl, buildLanguageAlternates, type SeoLocale } from '@/lib/metadata'
import { routing } from '@/i18n/routing'
import { AffiliatePageContent } from './affiliate.chunks'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const title = 'Tallaby Affiliate Program | Share, Save, Earn'
  const description = 'Share Tallaby with your community. Give customers 10% off and earn 10% when their order is delivered.'
  const affiliateUrl = localizedUrl(locale as SeoLocale, '/affiliate')
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, '/affiliate')])
    ) as Partial<Record<SeoLocale, string>>
  )

  return {
    title,
    description,
    keywords: ['Tallaby affiliate program', 'affiliate marketing Egypt', '10% discount', 'earn online Egypt'],
    openGraph: { title, description, type: 'website', url: affiliateUrl },
    alternates: { canonical: affiliateUrl, languages },
  }
}

export default function AffiliatePage() {
  return <AffiliatePageContent />
}
