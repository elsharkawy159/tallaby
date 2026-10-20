'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { useBuilderStore } from '@/lib/builder/store'
import { createNodeFromPalette } from '@/lib/builder/element-definitions'
import { slotHostElementId } from '@/lib/builder/dnd/ids'
import {
  resolveSlotEntries,
  slotEntryIds,
  type SlotEntry,
} from '@/components/sections/schema/slot-entries'
import type { CompiledSlot } from '@/components/sections/schema/compile-schema'
import type { SectionDefinition, SectionInstance } from '@/components/sections/registry.types'

/**
 * The structural half of the content panel: what a slot-driven section is made
 * of, rather than what its fields say.
 *
 * Canvas drag is the primary way to reorder, but a list is the only way to
 * reach a block the user has hidden — and the only reliable one on a section
 * whose regions overlap (a full-bleed background, a card breaking out of its
 * column). The two surfaces write through the same store actions.
 */

const ELEMENT_CHOICES = [
  { paletteId: 'heading', label: 'Heading' },
  { paletteId: 'paragraph', label: 'Paragraph' },
  { paletteId: 'text', label: 'Text' },
  { paletteId: 'button', label: 'Button' },
  { paletteId: 'image', label: 'Image' },
  { paletteId: 'icon', label: 'Icon' },
  { paletteId: 'divider', label: 'Divider' },
  { paletteId: 'vFlex', label: 'Stack' },
] as const

export function SlotOutline ({
  instance,
  def,
}: {
  instance: SectionInstance
  def: SectionDefinition
}) {
  if (!def.slots?.length) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Structure
      </p>
      {def.slots.map((slot) => (
        <SlotSection key={slot.id} instance={instance} def={def} slot={slot} />
      ))}
    </div>
  )
}

function SlotSection ({
  instance,
  def,
  slot,
}: {
  instance: SectionInstance
  def: SectionDefinition
  slot: CompiledSlot
}) {
  const [open, setOpen] = useState(true)
  const injected = useBuilderStore(
    (s) => s.injectedChildren[slotHostElementId(instance.id, slot.id)]
  )

  const entries = resolveSlotEntries({
    slot,
    blocks: def.blocks ?? [],
    layout: instance.slots?.[slot.id],
    injected: injected ?? [],
  })

  const atCapacity = slot.max != null && entries.length >= slot.max

  return (
    <div className="rounded-md border border-border/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
      >
        <span className="text-[12px] font-medium text-foreground">{slot.label}</span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{entries.length}</span>
          <ChevronDown
            className={cn('size-3.5 text-muted-foreground transition-transform', !open && '-rotate-90')}
          />
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-1 border-t border-border/70 p-1.5">
          {entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              index={index}
              entries={entries}
              instance={instance}
              slot={slot}
            />
          ))}

          {slot.acceptsElements !== false && !atCapacity ? (
            <AddElementMenu instance={instance} slot={slot} entries={entries} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function EntryRow ({
  entry,
  index,
  entries,
  instance,
  slot,
}: {
  entry: SlotEntry
  index: number
  entries: SlotEntry[]
  instance: SectionInstance
  slot: CompiledSlot
}) {
  const setSlotOrder = useBuilderStore((s) => s.setSlotOrder)
  const setBlockHidden = useBuilderStore((s) => s.setBlockHidden)
  const removeComponentNode = useBuilderStore((s) => s.removeComponentNode)
  const setSelectedElement = useBuilderStore((s) => s.setSelectedElement)

  const label =
    entry.kind === 'block'
      ? entry.block.label
      : (typeof entry.node.props.text === 'string' && entry.node.props.text) ||
        entry.node.type

  /** Moves this entry one step, materialising the order in the same action. */
  const move = (delta: number) => {
    const ids = slotEntryIds(entries)
    const to = index + delta
    if (to < 0 || to >= ids.length) return
    const next = [...ids]
    const [moved] = next.splice(index, 1)
    if (moved === undefined) return
    next.splice(to, 0, moved)
    setSlotOrder(instance.id, slot.id, next)
  }

  const hidden = entry.kind === 'block' && entry.hidden

  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded px-1.5 py-1 hover:bg-muted/60',
        hidden && 'opacity-50'
      )}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />

      <button
        type="button"
        className="min-w-0 flex-1 truncate text-start text-[12px] text-foreground"
        onClick={() =>
          entry.kind === 'node'
            ? setSelectedElement(`${instance.id}::${entry.node.id}`)
            : undefined
        }
      >
        {label}
      </button>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label={index === 0 ? 'Already first' : `Move ${label} up`}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ChevronDown className="size-3.5 rotate-180" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label={`Move ${label} down`}
          disabled={index === entries.length - 1}
          onClick={() => move(1)}
        >
          <ChevronDown className="size-3.5" />
        </Button>

        {entry.kind === 'block' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
            onClick={() => setBlockHidden(instance.id, slot.id, entry.block.id, !hidden)}
          >
            {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={`Delete ${label}`}
            onClick={() => removeComponentNode(instance.id, entry.node.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function AddElementMenu ({
  instance,
  slot,
  entries,
}: {
  instance: SectionInstance
  slot: CompiledSlot
  entries: SlotEntry[]
}) {
  const addSlotNode = useBuilderStore((s) => s.addSlotNode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 justify-start gap-1.5 px-1.5 text-[12px] text-muted-foreground"
        >
          <Plus className="size-3.5" />
          Add element
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {ELEMENT_CHOICES.map((choice) => (
          <DropdownMenuItem
            key={choice.paletteId}
            onSelect={() => {
              const node = createNodeFromPalette(choice.paletteId)
              if (node) addSlotNode(instance.id, slot.id, node, entries.length)
            }}
          >
            {choice.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
