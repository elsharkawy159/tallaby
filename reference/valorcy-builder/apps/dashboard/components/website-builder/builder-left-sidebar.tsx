'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { useBuilderStore } from '@/lib/builder/store'
import type { BuilderLeftRailTab } from '@/components/website-builder/builder-tab-rail'
import { ElementsPalette } from '@/components/website-builder/panels/elements-palette'
import { LayoutsPalette } from '@/components/website-builder/panels/layouts-palette'
import { NavigatorPanel } from '@/components/website-builder/panels/navigator-panel'
import { AssetsPanel } from '@/components/website-builder/panels/assets-panel'
import { PagesPanel } from '@/components/website-builder/panels/pages-panel'
import { FormsPanel } from '@/components/website-builder/panels/forms-panel'
import { BrandPanel } from '@/components/website-builder/design-system/brand-panel'

const ExplorePanel = dynamic(
  () => import('@/components/website-builder/explore/explore-panel').then((m) => m.ExplorePanel),
  { ssr: false }
)

const IconsPanel = dynamic(
  () => import('@/components/website-builder/icons/icons-panel').then((m) => m.IconsPanel),
  { ssr: false }
)

export function BuilderLeftSidebar ({
  railTab,
  projectId,
}: {
  railTab: BuilderLeftRailTab
  projectId: string
}) {
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const [addSubTab, setAddSubTab] = useState<'elements' | 'layouts'>('elements')

  if (canvasPreview) return null

  if (railTab === 'navigator') {
    return <NavigatorPanel />
  }

  if (railTab === 'assets') {
    return <AssetsPanel projectId={projectId} />
  }

  if (railTab === 'explore') {
    return (
      <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col bg-background">
        <ExplorePanel projectId={projectId} />
      </aside>
    )
  }

  if (railTab === 'icons') {
    return (
      <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col bg-background">
        <IconsPanel />
      </aside>
    )
  }

  if (railTab === 'forms') {
    return <FormsPanel projectId={projectId} />
  }

  if (railTab === 'brand') {
    return <BrandPanel projectId={projectId} />
  }

  if (railTab === 'pages') {
    return (
      <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col bg-background">
        <PagesPanel />
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col bg-background">
      <Tabs
        value={addSubTab}
        onValueChange={(v) => setAddSubTab(v as typeof addSubTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <TabsList className="mx-2 mt-2 w-auto shrink-0 self-stretch">
          <TabsTrigger value="elements" className="flex-1">
            Elements
          </TabsTrigger>
          <TabsTrigger value="layouts" className="flex-1">
            Layouts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="elements" className="m-0 min-h-0 flex-1 overflow-hidden">
          <ElementsPalette />
        </TabsContent>
        <TabsContent value="layouts" className="m-0 min-h-0 flex-1 overflow-hidden">
          <LayoutsPalette />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
