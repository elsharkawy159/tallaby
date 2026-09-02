'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/lib/auth/use-auth-user'
import {
  getSellerCtaHref,
  getSellerCtaOpensInNewTab,
  isExistingSeller,
} from '@/lib/seller/seller-cta.lib'

import type { SellCtaProps } from './sell.types'

export function SellCta({
  size = 'lg',
  variant = 'default',
  className,
}: SellCtaProps) {
  const t = useTranslations('onboarding')
  // Resolved client-side so /sell stays a fully prerendered marketing page.
  // Until it resolves, the guest CTA renders — the same target an anonymous
  // visitor gets, so there's no misleading intermediate state.
  const { user } = useAuthUser()
  const href = getSellerCtaHref(user, { fromSellPage: true })
  const opensInNewTab = getSellerCtaOpensInNewTab(user)
  const label = isExistingSeller(user) ? t('viewDashboard') : t('startSelling')

  return (
    <Button asChild size={size} variant={variant} className={cn(className)}>
      <Link
        href={href}
        target={opensInNewTab ? '_blank' : undefined}
        rel={opensInNewTab ? 'noopener noreferrer' : undefined}
      >
        {label}
      </Link>
    </Button>
  )
}
