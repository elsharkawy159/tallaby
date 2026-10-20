'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { useBuilderStore } from '@/lib/builder/store'
import { sectionRegistry } from '@/components/sections'
import { ContentPanel } from '@/components/website-builder/panels/content-panel'
import { ElementContentPanel } from '@/components/website-builder/panels/element-content-panel'
import { DesignPanel } from '@/components/website-builder/panels/design-panel'
import { ElementStylePanel } from '@/components/website-builder/panels/element-style-panel'
import { findComponentNodeInTree } from '@/lib/builder/find-tree-node'
import { ChromeInspector } from '@/components/website-builder/panels/chrome/chrome-inspector'
import type { ChromeRole } from '@/lib/builder/shared-chrome/types'

export function BuilderRightSidebar () {
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const sections = useBuilderStore((s) => s.sections)
  const sharedHeader = useBuilderStore((s) => s.sharedHeader)
  const sharedFooter = useBuilderStore((s) => s.sharedFooter)
  const chromeRole: ChromeRole | null =
    selectedSectionId && sharedHeader?.id === selectedSectionId
      ? 'header'
      : selectedSectionId && sharedFooter?.id === selectedSectionId
        ? 'footer'
        : null
  if (canvasPreview) return null

  if (selectedElementId) {
    const elementKey = selectedElementId.split('::')[1] ?? selectedElementId
    const sep = selectedElementId.indexOf('::')
    const secId = sep >= 0 ? selectedElementId.slice(0, sep) : ''
    const nodeId = sep >= 0 ? selectedElementId.slice(sep + 2) : ''
    const sec = sections.find((s) => s.id === secId)
    const elNode =
      sec?.componentTree && nodeId ? findComponentNodeInTree(sec.componentTree, nodeId) : undefined
    const domLabel =
      typeof document !== 'undefined'
        ? document
            .querySelector<HTMLElement>(`[data-element-id="${CSS.escape(selectedElementId)}"]`)
            ?.getAttribute('data-element-tag')
        : null
    return (
      <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-s border-border bg-background">
        <div className="flex items-center border-b border-border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{elNode?.type ?? domLabel ?? 'Element'}</p>
            <p className="truncate text-xs text-muted-foreground">{elementKey}</p>
          </div>
        </div>
        <Tabs
          key={selectedElementId}
          defaultValue="content"
          className="flex min-h-0 flex-1 flex-col gap-0 px-2"
        >
          <TabsList className="mt-2 w-full">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="m-0 min-h-0 flex-1 overflow-y-auto pt-2 pb-4">
            {elNode ? (
              <ElementContentPanel elementId={selectedElementId} />
            ) : (
              <ContentPanel elementId={selectedElementId} />
            )}
          </TabsContent>
          <TabsContent value="style" className="m-0 min-h-0 flex-1 overflow-y-auto pt-2 pb-4">
            <ElementStylePanel elementId={selectedElementId} />
          </TabsContent>
        </Tabs>
      </aside>
    )
  }

  // Shared chrome lives in its own store slots, not in `sections`, and gets a
  // dedicated inspector instead of the generic section content panel.
  if (chromeRole) {
    const chromeInstance = chromeRole === 'header' ? sharedHeader : sharedFooter
    const chromeDef = chromeInstance
      ? sectionRegistry.get(chromeInstance.sectionId)
      : undefined
    return (
      <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-s border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              Shared {chromeRole === 'header' ? 'Navbar' : 'Footer'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {chromeDef?.displayName ?? chromeInstance?.sectionId}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            All pages
          </span>
        </div>
        <Tabs
          key={selectedSectionId}
          defaultValue="settings"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="mx-2 mt-2 w-auto shrink-0 self-start">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="m-0 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <ChromeInspector role={chromeRole} />
          </TabsContent>
          <TabsContent value="style" className="m-0 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <DesignPanel />
          </TabsContent>
        </Tabs>
      </aside>
    )
  }

  const instance = sections.find((s) => s.id === selectedSectionId)
  const def = instance ? sectionRegistry.get(instance.sectionId) : undefined

  if (!selectedSectionId || !instance || !def) {
    return (
      <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-s border-border bg-background">
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Nothing selected</p>
          <p className="mt-1 text-sm text-muted-foreground">Select a section or element on the canvas to edit its styles.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-s border-border bg-background">
      <div className="flex items-center border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{def.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{def.id}</p>
        </div>
      </div>
      <Tabs key={selectedSectionId} defaultValue="content" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="mx-2 mt-2 w-auto shrink-0 self-start">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="m-0 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <ContentPanel />
        </TabsContent>
        <TabsContent value="style" className="m-0 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <DesignPanel />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
