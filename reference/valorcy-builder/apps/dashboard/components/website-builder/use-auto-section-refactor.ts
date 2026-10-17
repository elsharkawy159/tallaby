'use client'

import { useCallback } from 'react'
import { useBuilderStore } from '@/lib/builder/store'

/**
 * Returns an async helper that adds a section then immediately enriches its
 * props via the refactor-section API so content matches the site's context.
 * Falls back gracefully — if the API fails the section is already on canvas
 * with default props.
 */
export function useAutoSectionRefactor() {
  const addSection = useBuilderStore((s) => s.addSection)
  const updateSectionProps = useBuilderStore((s) => s.updateSectionProps)
  const sections = useBuilderStore((s) => s.sections)
  const projectName = useBuilderStore((s) => s.projectName)

  const addWithRefactor = useCallback(
    async (
      sectionId: string,
      defaultProps: Record<string, unknown>,
      opts?: {
        atIndex?: number
        industry?: string
        tone?: string
        pageType?: string
      }
    ) => {
      // 1. Add immediately with defaults (instant feedback)
      addSection(sectionId, defaultProps, opts?.atIndex)

      // 2. Enrich async in background
      if (!opts?.industry) return

      const siteContext = {
        industry: opts.industry,
        tone: opts.tone,
        businessName: projectName || undefined,
        pageType: opts.pageType,
      }

      try {
        const res = await fetch('/api/ai/refactor-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId, siteContext }),
        })
        if (!res.ok) return
        const data = await res.json() as { props?: Record<string, unknown> }
        if (!data.props) return

        // Find the section that was just added (will be last at atIndex or end)
        const allSections = useBuilderStore.getState().sections
        const targetIdx = opts.atIndex !== undefined ? opts.atIndex : allSections.length - 1
        const target = allSections[targetIdx]
        if (target?.sectionId === sectionId) {
          updateSectionProps(target.id, data.props)
        }
      } catch {
        // Silently fail — default props stay
      }
    },
    [addSection, updateSectionProps, projectName]
  )

  return { addWithRefactor }
}
