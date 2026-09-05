import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { localizedUrl, buildLanguageAlternates, type SeoLocale } from '@/lib/metadata'
import { routing } from '@/i18n/routing'
import { getMyAffiliateAccount } from '@/actions/affiliate'
import { getUser } from '@/actions/auth'
import { AffiliatePageContent } from './affiliate.chunks'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'affiliateLanding.meta' })
  const title = t('title')
  const description = t('description')
  const affiliateUrl = localizedUrl(locale as SeoLocale, '/affiliate')
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, '/affiliate')])
    ) as Partial<Record<SeoLocale, string>>
  )

  return {
    title,
    description,
    keywords: t('keywords').split(',').map((keyword) => keyword.trim()),
    openGraph: { title, description, type: 'website', url: affiliateUrl },
    alternates: { canonical: affiliateUrl, languages },
  }
}

export default async function AffiliatePage() {
  const [account, session] = await Promise.all([
    getMyAffiliateAccount(),
    getUser(),
  ])
  return (
    <AffiliatePageContent account={account} isAuthenticated={Boolean(session)} />
  )
}
