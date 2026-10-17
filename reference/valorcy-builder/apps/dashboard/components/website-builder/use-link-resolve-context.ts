'use client'

import { useMemo } from 'react'
import { useBuilderStore } from '@/lib/builder/store'
import type { ResolveLinkContext } from '@/lib/builder/links'

/** Pages list from builder store for resolving pageId → href in SmartLink. */
export function useLinkResolveContext (): ResolveLinkContext {
  const pages = useBuilderStore((s) => s.pages)

  return useMemo(
    () => ({
      pages: pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        isHome: p.isHome,
      })),
    }),
    [pages],
  )
}
