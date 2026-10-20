'use client'

import { useMemo } from 'react'

import { useBuilderStore } from '@/lib/builder/store'
import { toChromeModel } from '@/lib/builder/shared-chrome/adapters'
import type { ChromeRole, SharedChromeModel } from '@/lib/builder/shared-chrome/types'

/**
 * The chrome model for a shared slot, plus the one write path.
 *
 * Reads are memoised on the instance identity, so the inspector only re-renders
 * when the slot itself changed — not on every unrelated store update. Writes go
 * through `updateChrome`, which is what keeps undo/redo and autosave working
 * without any per-field wiring.
 */
export function useChromeModel (role: ChromeRole): {
  model: SharedChromeModel | null
  update: (recipe: (model: SharedChromeModel) => void) => void
} {
  const instance = useBuilderStore((s) =>
    role === 'header' ? s.sharedHeader : s.sharedFooter
  )
  const updateChrome = useBuilderStore((s) => s.updateChrome)

  const model = useMemo(() => (instance ? toChromeModel(instance) : null), [instance])

  return useMemo(
    () => ({
      model,
      update: (recipe: (model: SharedChromeModel) => void) => updateChrome(role, recipe),
    }),
    [model, role, updateChrome]
  )
}

/** The role of the currently selected shared slot, or `null`. */
export function useSelectedChromeRole (): ChromeRole | null {
  return useBuilderStore((s) => {
    if (!s.selectedSectionId) return null
    if (s.sharedHeader?.id === s.selectedSectionId) return 'header'
    if (s.sharedFooter?.id === s.selectedSectionId) return 'footer'
    return null
  })
}
