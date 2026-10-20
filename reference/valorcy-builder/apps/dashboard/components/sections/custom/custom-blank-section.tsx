'use client'

import type { CSSProperties } from 'react'
import { useDroppableSectionRoot } from '@/components/website-builder/dnd/use-section-dnd'
import { useDropEdge } from '@/components/dnd/dnd-provider'
import { DndDropIndicator } from '@/components/dnd/dnd-drop-indicator'
import { dragStateAttrs } from '@/components/dnd/dnd-sortable-item'
import { sectionRootId } from '@/lib/builder/dnd/ids'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { useSectionSurface } from '@/components/sections/section-surface'
import { LAYOUT_PRESETS } from '@/lib/builder/layout-presets'
import { useBuilderStore } from '@/lib/builder/store'
import { cn } from '@workspace/ui/lib/utils'

/**
 * Wrapper that applies design-system surface styles (background, foreground, section
 * padding) to a custom componentTree — identical to what pre-built sections get via
 * useSectionSurface. Rendered in the builder canvas and on the published site around
 * the ComponentTreeRenderer / StaticComponentTreeRenderer.
 *
 * `data-component-tree-surface` marks it as the home of a real component tree:
 * the injected-children layer must never treat this wrapper (which the section
 * instrumenter tags as a container) as a host for injected elements. It stays
 * instrumented — saved element styles may be keyed to its id.
 */
export function CustomSectionSurface ({
  instanceId,
  children,
  style: extraStyle,
}: {
  instanceId: string
  children: React.ReactNode
  style?: CSSProperties
}) {
  const { rootStyle } = useSectionSurface({ instanceId })
  return (
    <div data-component-tree-surface="" style={{ ...rootStyle, ...extraStyle }}>
      {children}
    </div>
  )
}

// Quick-start presets shown in the empty section state (subset of full LAYOUT_PRESETS)
const EMPTY_STATE_PRESETS = LAYOUT_PRESETS.slice(0, 4)

/** Empty canvas section — content comes from `componentTree` rendered below this in the builder. */
export function CustomBlankSection ({ instance, isPreview }: SectionComponentProps) {
  const empty = !instance.componentTree || instance.componentTree.length === 0
  const addComponentNode = useBuilderStore((s) => s.addComponentNode)

  const { ref, isDropTarget } = useDroppableSectionRoot({
    sectionId: instance.id,
    disabled: isPreview || !empty,
  })
  const edge = useDropEdge(sectionRootId(instance.id))

  if (!empty) return null

  if (isPreview) {
    return <div className="min-h-0" />
  }

  return (
    <div
      ref={ref}
      // Builder chrome, not section content: keep the instrumenter from tagging
      // the placeholder (and its preset buttons) as selectable elements.
      data-no-instrument=""
      {...dragStateAttrs({ isDropTarget })}
      className={cn(
        'relative flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-muted-foreground/30 bg-muted/10 px-6 py-8 text-center transition-all',
        'data-[drop-target]:border-primary/40',
      )}
    >
      <DndDropIndicator edge={edge} data-no-instrument="" />
      <p className="text-xs text-muted-foreground">
        Drag elements from the Add panel, or start with a layout:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {EMPTY_STATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              const roots = preset.factory()
              for (const node of roots) {
                addComponentNode(instance.id, node)
              }
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
