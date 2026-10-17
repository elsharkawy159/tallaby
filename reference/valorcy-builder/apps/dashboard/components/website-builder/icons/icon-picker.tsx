'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { Input } from '@workspace/ui/components/input'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@workspace/ui/lib/utils'
import { searchIconNames, resolveIconName } from '@/lib/builder/icon-library'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'

type IconPickerProps = {
  value: string
  onChange: (name: string) => void
}

/**
 * Compact popover icon picker for the inspector. Reuses the same local search
 * (`searchIconNames`) as the sidebar panel — no external API.
 */
export function IconPicker ({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const resolved = resolveIconName(value)
  const results = useMemo(() => searchIconNames(query, 120), [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-background px-2 text-xs hover:border-primary/40"
        >
          <LucideIcon name={resolved} size={16} aria-label={resolved} />
          <span className="truncate">{resolved}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            className="h-8 ps-8 text-xs"
            aria-label="Search icons"
          />
        </div>
        <ScrollArea className="h-56">
          {results.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No icons found</p>
          ) : (
            <div className="grid grid-cols-5 gap-1 pe-2">
              {results.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md border border-transparent text-foreground/80 hover:border-primary/40 hover:bg-muted/50',
                    name === resolved && 'border-primary/60 bg-primary/10 text-primary'
                  )}
                >
                  <LucideIcon name={name} size={18} aria-label={name} />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
