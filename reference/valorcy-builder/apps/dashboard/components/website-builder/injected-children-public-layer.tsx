'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ComponentNode } from '@/lib/builder/component-node'
import type { ElementChromeAttributes } from '@/components/sections/registry.types'
import { instrumentedIdToCssSelector } from '@/lib/builder/element-id'
import { isSlotHostKey } from '@/lib/builder/dnd/ids'
import { StaticComponentTreeRenderer } from '@/components/website-builder/component-tree-renderer'

type Props = {
  injectedChildren?: Record<string, ComponentNode[]>
  elementAttributes?: Record<string, ElementChromeAttributes>
}

/**
 * Hydrates user-inserted element subtrees into their host containers on the
 * published site. Hosts are resolved the same way style overrides are: tree-node
 * parents via `[data-element-id]` (present in the DOM for custom-section content),
 * instrumented (`__i:`) parents via the `:nth-of-type` selector derived from the
 * element id, since `data-element-id` is not emitted in published markup.
 *
 * Hydrates client-side after mount — injected nodes are not present in the
 * initial SSR HTML (acceptable v1 tradeoff; see plan).
 */
export function InjectedChildrenPublicLayer({ injectedChildren, elementAttributes }: Props) {
  const [, forceTick] = useState(0)

  // Slot buckets (`<instanceId>::slot:<slotId>`) are rendered inline by
  // `<SectionSlot>`, interleaved with the slot's schema blocks. Portaling them
  // here as well would render every slot element twice.
  const entries = Object.entries(injectedChildren ?? {}).filter(
    ([key, tree]) => tree.length > 0 && !isSlotHostKey(key)
  )

  useEffect(() => {
    if (entries.length === 0) return
    // Re-resolve hosts once after mount in case hardcoded sections render async.
    const t = setTimeout(() => forceTick((n) => n + 1), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length])

  if (entries.length === 0 || typeof document === 'undefined') return null

  return (
    <>
      {entries.map(([parentElementId, tree]) => {
        const sep = parentElementId.indexOf('::')
        if (sep <= 0) return null
        const sectionId = parentElementId.slice(0, sep)
        const nodeKey = parentElementId.slice(sep + 2)

        let host: HTMLElement | null = null
        if (nodeKey.startsWith('__i:')) {
          const selector = instrumentedIdToCssSelector(parentElementId)
          if (selector) host = document.querySelector<HTMLElement>(selector)
        } else {
          host = document.querySelector<HTMLElement>(
            `[data-section-instance-id="${CSS.escape(sectionId)}"] [data-element-id="${CSS.escape(parentElementId)}"]`
          )
        }
        if (!host) return null

        return createPortal(
          <StaticComponentTreeRenderer
            key={parentElementId}
            sectionId={sectionId}
            tree={tree}
            isPreview
            elementAttributes={elementAttributes}
          />,
          host
        )
      })}
    </>
  )
}
