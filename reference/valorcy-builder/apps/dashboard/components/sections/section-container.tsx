'use client'

import type { HTMLAttributes } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { usePublicSiteContext } from '@/components/website-builder/public-site-context'
import { useBuilderStore } from '@/lib/builder/store'

type SectionContainerProps = {
  as?: 'div' | 'section' | 'footer' | 'header' | 'article' | 'main'
  children: React.ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'as' | 'style'> & {
  style?: React.CSSProperties
}

/**
 * Centered page column using design system container max-width and horizontal padding.
 */
export function SectionContainer ({
  as: C = 'div',
  children,
  className,
  style,
  ...rest
}: SectionContainerProps) {
  const publicSite = usePublicSiteContext()
  const storeMax = useBuilderStore((s) => s.designSystem.spacing.containerMaxWidth ?? 1200)
  const max = publicSite?.designSystem.spacing.containerMaxWidth ?? storeMax
  return (
    <C
      {...rest}
      className={cn('mx-auto w-full max-w-full px-6', className)}
      style={{ maxWidth: max, ...style }}
    >
      {children}
    </C>
  )
}
