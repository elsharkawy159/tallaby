'use client'

import { useSyncExternalStore } from 'react'
import {
  getPalettePrefs,
  getServerPalettePrefs,
  subscribeToPalettePrefs,
  type PalettePrefs,
} from '@/lib/builder/palette-prefs'

/**
 * Subscribe to palette preferences.
 *
 * `getPalettePrefs` returns the same frozen object until something actually
 * changes, which is what keeps `useSyncExternalStore` from looping.
 */
export function usePalettePrefs (): PalettePrefs {
  return useSyncExternalStore(
    subscribeToPalettePrefs,
    getPalettePrefs,
    getServerPalettePrefs
  )
}
