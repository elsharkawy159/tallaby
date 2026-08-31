'use client'

import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { useTranslations } from 'next-intl'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@/lib/utils'
import {
  getSellerCtaHref,
  getSellerCtaOpensInNewTab,
  isExistingSeller,
} from '@/lib/seller/seller-cta.lib'

import type { SellCtaProps } from './sell.types'

export function SellCta({
  user,
  size = 'lg',
  variant = 'default',
  className,
}: SellCtaProps) {
  const t = useTranslations('onboarding')
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
