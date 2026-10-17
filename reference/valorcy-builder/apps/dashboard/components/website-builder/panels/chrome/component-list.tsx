'use client'

import { memo, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'

import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import { useSortableChromeComponent } from '@/components/website-builder/dnd/use-panel-sortables'
import {
  chromeComponentsForRole,
  createChromeComponent,
  getChromeComponentDescriptor,
} from '@/lib/builder/shared-chrome/component-registry'
import type {
  ChromeComponent,
  ChromeRole,
  SharedChromeModel,
} from '@/lib/builder/shared-chrome/types'
import { ComponentSettings } from './component-settings'
import { VisibilityControls } from './visibility-controls'

/**
 * The enable / reorder / configure list of built-in chrome components.
 *
 * Rows are entirely descriptor-driven (`component-registry.ts`), so a new
 * built-in shows up here — with its settings form and visibility rules — without
 * touching this file.
 */
function ComponentRow ({
  component,
  role,
  index,
  expanded,
  onToggleExpanded,
  onPatch,
  onRemove,
}: {
  component: ChromeComponent
  role: ChromeRole
  index: number
  expanded: boolean
  onToggleExpanded: () => void
  onPatch: (patch: Partial<ChromeComponent>) => void
  onRemove: () => void
}) {
  const { ref, handleRef, isDragging } = useSortableChromeComponent({
    role,
    componentId: component.id,
    index,
  })
  const descriptor = getChromeComponentDescriptor(component.type)
  if (!descriptor) return null

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-md border border-border bg-background',
        !component.enabled && 'opacity-60',
        isDragging && 'opacity-50'
      )}
    >
      <div className="group/comp flex items-center gap-1.5 px-1.5 py-1.5">
        <button
          type="button"
          ref={handleRef}
          aria-label={`Reorder ${descriptor.label}`}
          aria-roledescription="draggable component"
          className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 active:cursor-grabbing group-hover/comp:opacity-100"
        >
          <GripVertical className="size-3.5" />
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-start"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
          )}
          <span className="flex shrink-0 items-center text-muted-foreground">
            <LucideIcon name={descriptor.icon} size={13} />
          </span>
          <span className="truncate text-xs font-medium">{descriptor.label}</span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {!descriptor.singleton ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-6 text-muted-foreground opacity-0 hover:text-destructive group-hover/comp:opacity-100"
              aria-label={`Remove ${descriptor.label}`}
              onClick={onRemove}
            >
              <Trash2 className="size-3" />
            </Button>
          ) : null}
          <Switch
            checked={component.enabled}
            aria-label={`Enable ${descriptor.label}`}
            onCheckedChange={(enabled) => onPatch({ enabled })}
          />
        </div>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-3 border-t border-border px-2.5 py-2.5">
          <p className="text-[10px] text-muted-foreground">{descriptor.description}</p>
          <ComponentSettings component={component} onPatch={onPatch} />
          <VisibilityControls
            visibility={component.visibility}
            onChange={(visibility) => onPatch({ visibility })}
          />
        </div>
      ) : null}
    </div>
  )
}

const MemoComponentRow = memo(ComponentRow)

export function ComponentList ({
  role,
  model,
  update,
}: {
  role: ChromeRole
  model: SharedChromeModel
  update: (recipe: (model: SharedChromeModel) => void) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addable = useMemo(() => {
    const present = new Set(model.components.map((c) => c.type))
    return chromeComponentsForRole(role).filter(
      (d) => !d.singleton || !present.has(d.type)
    )
  }, [model.components, role])

  const patchComponent = (id: string, patch: Partial<ChromeComponent>) =>
    update((draft) => {
      const target = draft.components.find((c) => c.id === id)
      if (target) Object.assign(target, patch)
    })

  return (
    <div className="flex flex-col gap-1.5">
      {model.components.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
          No components yet — add one below.
        </p>
      ) : null}

      {model.components.map((component, index) => (
        <MemoComponentRow
          key={component.id}
          component={component}
          role={role}
          index={index}
          expanded={expandedId === component.id}
          onToggleExpanded={() =>
            setExpandedId((current) => (current === component.id ? null : component.id))
          }
          onPatch={(patch) => patchComponent(component.id, patch)}
          onRemove={() =>
            update((draft) => {
              draft.components = draft.components.filter((c) => c.id !== component.id)
            })
          }
        />
      ))}

      {addable.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Add component
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {addable.map((descriptor) => (
              <DropdownMenuItem
                key={descriptor.type}
                onSelect={() => {
                  const created = createChromeComponent(descriptor.type)
                  update((draft) => {
                    draft.components.push(created)
                  })
                  setExpandedId(created.id)
                }}
              >
                <span className="flex items-center text-muted-foreground">
                  <LucideIcon name={descriptor.icon} size={13} />
                </span>
                <span className="flex-1 text-xs">{descriptor.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
