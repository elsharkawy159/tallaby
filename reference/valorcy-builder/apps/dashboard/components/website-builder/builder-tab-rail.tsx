'use client'

import { ClipboardList, ImageIcon, Layers, Palette, Plus, Compass, FileText, Shapes } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

export type BuilderLeftRailTab =
  | 'add'
  | 'navigator'
  | 'assets'
  | 'explore'
  | 'icons'
  | 'pages'
  | 'forms'
  | 'brand'

type BuilderTabRailProps = {
  activeTab: BuilderLeftRailTab | null
  onSelectTab: (tab: BuilderLeftRailTab) => void
}

export function BuilderTabRail ({ activeTab, onSelectTab }: BuilderTabRailProps) {
  const items: { tab: BuilderLeftRailTab; label: string; title: string; icon: typeof Plus }[] = [
    { tab: 'add', label: 'Add', title: 'Add elements', icon: Plus },
    { tab: 'navigator', label: 'Layers', title: 'Navigator', icon: Layers },
    { tab: 'assets', label: 'Images', title: 'Assets', icon: ImageIcon },
    { tab: 'explore', label: 'Explore', title: 'Explore images', icon: Compass },
    { tab: 'icons', label: 'Icons', title: 'Icons', icon: Shapes },
    { tab: 'pages', label: 'Pages', title: 'Pages', icon: FileText },
    { tab: 'forms', label: 'Forms', title: 'Forms', icon: ClipboardList },
    { tab: 'brand', label: 'Brand', title: 'Brand', icon: Palette },
  ]

  return (
    <aside
      className="flex h-full w-[68px] shrink-0 flex-col items-center gap-1 border-e border-border bg-background py-2"
      aria-label="Builder tools"
    >
      {items.map(({ tab, label, title, icon: Icon }) => {
        const isActive = activeTab === tab
        return (
          <Button
            key={tab}
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              'h-auto w-14 flex-col gap-1 rounded-md px-1 py-1.5 hover:bg-primary/5 has-[>svg]:px-1',
              isActive && 'ring-1 bg-primary/20 hover:bg-primary/20 ring-primary/40',
            )}
            aria-label={title}
            aria-pressed={isActive}
            onClick={() => onSelectTab(tab)}
          >
            <Icon className="size-5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Button>
        )
      })}
    </aside>
  )
}
