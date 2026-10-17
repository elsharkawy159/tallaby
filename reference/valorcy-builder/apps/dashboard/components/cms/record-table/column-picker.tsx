"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Columns3 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { updateCollectionAction } from "@/actions/cms/collection-actions"
import type { CmsCollection } from "@/types/cms/cms.types"

/** field key -> visible in table */
export type ColumnVisibility = Record<string, boolean>

/** Build the initial visibility from saved settings, falling back to each field's showInTable flag. */
export function initialColumnVisibility(collection: CmsCollection): ColumnVisibility {
  const saved = collection.settings?.tableColumns
  const result: ColumnVisibility = {}
  for (const field of collection.fields) {
    result[field.key] = saved ? saved.includes(field.key) : Boolean(field.showInTable)
  }
  return result
}

interface ColumnPickerProps {
  collection: CmsCollection
  value: ColumnVisibility
  onChange: (value: ColumnVisibility) => void
}

export function ColumnPicker({ collection, value, onChange }: ColumnPickerProps) {
  const t = useTranslations('cms.columnPicker')
  const [open, setOpen] = useState(false)

  const toggle = (key: string, checked: boolean) => {
    const next = { ...value, [key]: checked }
    onChange(next)
    // Persist the visible column set so the choice sticks across reloads.
    const tableColumns = collection.fields.filter((f) => next[f.key]).map((f) => f.key)
    void updateCollectionAction({ id: collection.id, projectId: collection.projectId, settings: { ...collection.settings, tableColumns } })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="size-4" /> {t('columns')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('visibleColumns')}</p>
        <div className="max-h-72 space-y-0.5 overflow-y-auto">
          {collection.fields.map((field) => (
            <label
              key={field.key}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
            >
              <Checkbox
                checked={Boolean(value[field.key])}
                onCheckedChange={(v) => toggle(field.key, !!v)}
              />
              <Label className="cursor-pointer text-sm font-normal">{field.label || field.key}</Label>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
