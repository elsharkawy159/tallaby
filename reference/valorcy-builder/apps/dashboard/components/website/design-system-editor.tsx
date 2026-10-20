'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion'

import { updateDesignSystem } from '@/actions/design-system-actions'
import { useDebouncedAutosave } from '@/hooks/use-debounced-autosave'
import { AutosaveStatusHint } from '@/components/settings/autosave-status-hint'

type DesignSystem = {
  id: string
  projectId: string
  colors: unknown
  typography: unknown
  spacing: unknown
  customCss: string | null
  version: number
  updatedAt: string
} | null

type TokenRow = { key: string; value: string }

function toRows(obj: unknown): TokenRow[] {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
  }))
}

function fromRows(rows: TokenRow[]): Record<string, string> {
  return Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]))
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(value.trim())
}

function ColorRow({ row, onChange, onRemove }: { row: TokenRow; onChange: (r: TokenRow) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-7 shrink-0 rounded-md border overflow-hidden cursor-pointer">
        <input
          type="color"
          value={isHexColor(row.value) ? row.value : '#000000'}
          onChange={(e) => onChange({ ...row, value: e.target.value })}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          title="Pick color"
        />
        <div
          className="size-full rounded-[5px]"
          style={{ background: isHexColor(row.value) ? row.value : '#e5e7eb' }}
        />
      </div>
      <Input
        value={row.key}
        onChange={(e) => onChange({ ...row, key: e.target.value })}
        placeholder="token-name"
        className="flex-1 h-8 text-xs font-mono"
      />
      <Input
        value={row.value}
        onChange={(e) => onChange({ ...row, value: e.target.value })}
        placeholder="#000000"
        className="w-24 h-8 text-xs font-mono"
      />
      <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Remove">
        <Trash2 className="size-3" />
      </Button>
    </div>
  )
}

function TokenRowItem({ row, onChange, onRemove }: { row: TokenRow; onChange: (r: TokenRow) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={row.key}
        onChange={(e) => onChange({ ...row, key: e.target.value })}
        placeholder="property"
        className="flex-1 h-8 text-xs font-mono"
      />
      <Input
        value={row.value}
        onChange={(e) => onChange({ ...row, value: e.target.value })}
        placeholder="value"
        className="flex-1 h-8 text-xs font-mono"
      />
      <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Remove">
        <Trash2 className="size-3" />
      </Button>
    </div>
  )
}

export function DesignSystemEditor({ projectId, designSystem }: { projectId: string; designSystem: DesignSystem }) {
  const initial = useMemo(() => ({
    colors: toRows(designSystem?.colors),
    typography: toRows(designSystem?.typography),
    spacing: toRows(designSystem?.spacing),
    customCss: designSystem?.customCss ?? '',
  }), [designSystem])

  const [colors, setColors] = useState<TokenRow[]>(initial.colors)
  const [typography, setTypography] = useState<TokenRow[]>(initial.typography)
  const [spacing, setSpacing] = useState<TokenRow[]>(initial.spacing)
  const [customCss, setCustomCss] = useState(initial.customCss)
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState(initial)
  const [localVersion, setLocalVersion] = useState(designSystem?.version ?? 0)

  const isDirty =
    JSON.stringify(colors) !== JSON.stringify(saved.colors) ||
    JSON.stringify(typography) !== JSON.stringify(saved.typography) ||
    JSON.stringify(spacing) !== JSON.stringify(saved.spacing) ||
    customCss !== saved.customCss

  function filterRows(rows: TokenRow[]) {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => r.key.toLowerCase().includes(q) || r.value.toLowerCase().includes(q))
  }

  const save = useCallback(async () => {
    try {
      const updated = await updateDesignSystem(projectId, {
        colors: fromRows(colors),
        typography: fromRows(typography),
        spacing: fromRows(spacing),
        customCss: customCss || null,
      })
      setSaved({ colors, typography, spacing, customCss })
      if (updated && typeof updated.version === 'number') {
        setLocalVersion(updated.version)
      } else {
        setLocalVersion((v) => v + 1)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
      throw err
    }
  }, [projectId, colors, typography, spacing, customCss])

  const { status, isSaving } = useDebouncedAutosave({
    enabled: isDirty,
    watch: JSON.stringify({ colors, typography, spacing, customCss }),
    save,
  })

  function handleReset() {
    setColors(saved.colors)
    setTypography(saved.typography)
    setSpacing(saved.spacing)
    setCustomCss(saved.customCss)
  }

  function addRow(setter: React.Dispatch<React.SetStateAction<TokenRow[]>>) {
    setter((prev) => [...prev, { key: '', value: '' }])
  }
  function updateRow(setter: React.Dispatch<React.SetStateAction<TokenRow[]>>, index: number, updated: TokenRow) {
    setter((prev) => prev.map((r, i) => (i === index ? updated : r)))
  }
  function removeRow(setter: React.Dispatch<React.SetStateAction<TokenRow[]>>, index: number) {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  const filteredColors = filterRows(colors)
  const filteredTypography = filterRows(typography)
  const filteredSpacing = filterRows(spacing)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">Design system</CardTitle>
            <CardDescription className="mt-0.5">Color tokens, typography, spacing, and custom CSS.</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <AutosaveStatusHint status={status} isDirty={isDirty} />
            <Badge variant="outline">v{localVersion}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sticky search + actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tokens…"
              className="ps-8 h-8 text-xs"
              disabled={isSaving}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-8 px-2"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="size-3 me-1" />
            Reset
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={['colors', 'typography']} className="space-y-1">
          {/* Colors */}
          <AccordionItem value="colors" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                Colors
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{colors.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              {filteredColors.length === 0 && search ? (
                <p className="text-xs text-muted-foreground py-1">No matches.</p>
              ) : filteredColors.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No color tokens yet.</p>
              ) : (
                filteredColors.map((row, i) => {
                  const realIndex = search ? colors.findIndex((r) => r === filteredColors[i]) : i
                  return (
                    <ColorRow
                      key={realIndex}
                      row={row}
                      onChange={(r) => updateRow(setColors, realIndex, r)}
                      onRemove={() => removeRow(setColors, realIndex)}
                    />
                  )
                })
              )}
              {!search && (
                <Button type="button" variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => addRow(setColors)}>
                  <Plus className="size-3 me-1" /> Add color
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Typography */}
          <AccordionItem value="typography" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                Typography
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{typography.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              {filteredTypography.length === 0 && search ? (
                <p className="text-xs text-muted-foreground py-1">No matches.</p>
              ) : filteredTypography.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No typography tokens yet.</p>
              ) : (
                filteredTypography.map((row, i) => {
                  const realIndex = search ? typography.findIndex((r) => r === filteredTypography[i]) : i
                  return (
                    <TokenRowItem
                      key={realIndex}
                      row={row}
                      onChange={(r) => updateRow(setTypography, realIndex, r)}
                      onRemove={() => removeRow(setTypography, realIndex)}
                    />
                  )
                })
              )}
              {!search && (
                <Button type="button" variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => addRow(setTypography)}>
                  <Plus className="size-3 me-1" /> Add token
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Spacing */}
          <AccordionItem value="spacing" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                Spacing
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{spacing.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              {filteredSpacing.length === 0 && search ? (
                <p className="text-xs text-muted-foreground py-1">No matches.</p>
              ) : filteredSpacing.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No spacing tokens yet.</p>
              ) : (
                filteredSpacing.map((row, i) => {
                  const realIndex = search ? spacing.findIndex((r) => r === filteredSpacing[i]) : i
                  return (
                    <TokenRowItem
                      key={realIndex}
                      row={row}
                      onChange={(r) => updateRow(setSpacing, realIndex, r)}
                      onRemove={() => removeRow(setSpacing, realIndex)}
                    />
                  )
                })
              )}
              {!search && (
                <Button type="button" variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => addRow(setSpacing)}>
                  <Plus className="size-3 me-1" /> Add token
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Custom CSS */}
          <AccordionItem value="css" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
              Custom CSS
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              <Textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder={`:root {\n  --brand: #6366f1;\n}`}
                className="font-mono text-xs min-h-36 resize-y"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
