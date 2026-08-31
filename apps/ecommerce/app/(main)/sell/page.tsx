import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/lib/auth/current-user'
import { SellPageContent } from './sell.chunks'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.sell')

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
      url: 'https://www.tallaby.com/sell',
    },
    alternates: {
      canonical: 'https://www.tallaby.com/sell',
    },
  }
}

export default async function SellPage() {
  const user = await getAuthUser()

  return <SellPageContent user={user} />
}
