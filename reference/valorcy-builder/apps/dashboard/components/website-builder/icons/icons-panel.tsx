'use client'

import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { useDraggable } from '@dnd-kit/react'
import { DND_TYPE } from '@/lib/builder/dnd/types'
import { Search, X, Shapes } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@workspace/ui/components/input'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@workspace/ui/lib/utils'
import { useBuilderStore } from '@/lib/builder/store'
import {
  createIconNodeFromName,
  searchIconNames,
} from '@/lib/builder/icon-library'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import { findComponentNodeInTree } from '@/lib/builder/find-tree-node'

/** How many icons to reveal per windowing step (keeps 1.8k icons fast). */
const PAGE_SIZE = 80

type IconCardProps = {
  name: string
  onSelect: (name: string) => void
}

/**
 * One draggable icon cell. Memoized so scrolling/searching doesn't re-render the
 * already-mounted cells. Dragging is the primary interaction; clicking inserts
 * into / applies to the current selection.
 */
const IconCard = memo(function IconCard ({ name, onSelect }: IconCardProps) {
  const { ref, isDragging } = useDraggable({
    id: `icon-library:${name}`,
    type: DND_TYPE.element,
    data: useMemo(() => ({ drag: { source: 'icon-library', iconName: name } }), [name]),
  })

  return (
    <button
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      type="button"
      title={name}
      onClick={() => onSelect(name)}
      className={cn(
        'group flex aspect-square cursor-grab items-center justify-center rounded-md border border-border bg-card text-foreground/80 shadow-sm transition-colors active:cursor-grabbing',
        'hover:border-primary/40 hover:bg-muted/40 hover:text-foreground',
        isDragging && 'opacity-50'
      )}
    >
      <LucideIcon name={name} size={20} aria-label={name} />
    </button>
  )
})

export function IconsPanel () {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const sections = useBuilderStore((s) => s.sections)
  const addComponentNode = useBuilderStore((s) => s.addComponentNode)
  const updateComponentNodeProps = useBuilderStore((s) => s.updateComponentNodeProps)

  // Resolve whether the current selection is an icon node — clicking then swaps
  // its glyph instead of inserting a new one (mirrors the Explore-image UX).
  const selectedIconElement = useMemo(() => {
    if (!selectedElementId) return null
    const sep = selectedElementId.indexOf('::')
    if (sep < 0) return null
    const secId = selectedElementId.slice(0, sep)
    const nodeId = selectedElementId.slice(sep + 2)
    const section = sections.find((s) => s.id === secId)
    if (!section?.componentTree) return null
    const node = findComponentNodeInTree(section.componentTree, nodeId)
    return node?.type === 'icon' ? { secId, nodeId } : null
  }, [selectedElementId, sections])

  const results = useMemo(() => searchIconNames(query), [query])

  // Update the query and reset windowing in one go (avoids a reset effect).
  function handleQueryChange (next: string) {
    setQuery(next)
    setVisible(PAGE_SIZE)
  }

  // Incremental reveal on scroll.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, results.length))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [results.length])

  function handleSelect (name: string) {
    if (selectedIconElement) {
      updateComponentNodeProps(selectedIconElement.secId, selectedIconElement.nodeId, {
        iconName: name,
      })
      return
    }
    if (selectedSectionId) {
      addComponentNode(selectedSectionId, createIconNodeFromName(name))
      return
    }
    toast.message('Select a section, then click or drag an icon onto the canvas.')
  }

  const shown = results.slice(0, visible)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border px-3 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Icons</p>
          {selectedIconElement ? (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Icon selected — click to swap
            </span>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search 1,800+ icons…"
            className="h-8 ps-8 pe-8 text-sm"
            aria-label="Search icons"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Drag an icon onto the canvas, or click to add it to the selected section.
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Shapes className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No icons match &ldquo;{query}&rdquo;
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5 p-2">
              {shown.map((name) => (
                <IconCard key={name} name={name} onSelect={handleSelect} />
              ))}
            </div>
            {visible < results.length && <div ref={sentinelRef} className="h-6" />}
          </>
        )}
      </ScrollArea>
    </div>
  )
}
