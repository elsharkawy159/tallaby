'use client'

import { useEffect, useRef } from 'react'
import { useBuilderStore, type DesignSystem } from '@/lib/builder/store'
import { normalizePageContent } from '@/lib/builder/normalize-page-content'
import { BuilderSectionsPreview } from '@/components/website-builder/builder-sections-preview'
import { MadeInValorcyBadge } from '@/components/system/made-in-valorcy-badge'

type PageRow = {
  id: string
  websiteId: string
  projectId: string
  name: Record<string, string>
  slug: string
  isHome: boolean
  locale: string
  orderIndex: number
  status: string
  version: number
  draftContent: ReturnType<typeof normalizePageContent>
  publishedContent: ReturnType<typeof normalizePageContent> | null
  useSharedHeader: boolean
  useSharedFooter: boolean
}

export function BuilderStandalonePreview ({
  projectId,
  projectName,
  projectSlug,
  websiteId,
  page,
  designSystem,
  dsVersion,
  projectLogoUrl = null,
  ownerPlan = 'free',
}: {
  projectId: string
  projectName: string
  projectSlug: string
  websiteId: string
  page: PageRow
  designSystem: DesignSystem
  dsVersion: number
  projectLogoUrl?: string | null
  ownerPlan?: string
}) {
  const did = useRef(false)

  useEffect(() => {
    if (did.current) return
    did.current = true

    useBuilderStore.getState().initPages([page])
    useBuilderStore.getState().initWebsite(websiteId, null, null, projectLogoUrl)
    useBuilderStore.getState().initBuilder(
      projectId,
      page.id,
      projectName,
      projectSlug,
      page.draftContent,
      page.publishedContent,
      page.version,
      designSystem,
      dsVersion
    )
    useBuilderStore.getState().setCanvasPreview(true)
  }, [projectId, projectName, projectSlug, websiteId, page, designSystem, dsVersion, projectLogoUrl])

  return (
    <>
      <BuilderSectionsPreview />
      <MadeInValorcyBadge
        websiteId={websiteId}
        projectId={projectId}
        plan={ownerPlan}
        context="preview"
        pagePath={`/website-builder/preview/${websiteId}/${page.slug}`}
      />
    </>
  )
}
