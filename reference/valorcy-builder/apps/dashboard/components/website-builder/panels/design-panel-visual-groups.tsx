'use client'

import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  AlignVerticalSpaceBetween,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Equal,
  FoldHorizontal,
  FoldVertical,
  LayoutGrid,
  LayoutPanelLeft,
  Minus
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group'
import { Label } from '@workspace/ui/components/label'
import { Input } from '@workspace/ui/components/input'
import {
  IconToggleGroupField,
  NumberField,
  SizeInput,
  StyleSelect
} from '@/components/website-builder/controls'
import { cn } from '@workspace/ui/lib/utils'

type PatchFn = (key: string, value: string) => void
type StrFn = (k: string) => string

const ALIGN_AXIS = ['flex-start', 'center', 'flex-end'] as const
const JUSTIFY_AXIS = ['flex-start', 'center', 'flex-end'] as const

/** 3×3 dot grid: row → align-items, column → justify-content (main axis). */
export function FlexAlignmentGrid ({ str, patch }: { str: StrFn; patch: PatchFn }) {
  const alignItems = str('alignItems') || 'stretch'
  const justifyContent = str('justifyContent') || 'flex-start'
  const isSpaceJustify =
    justifyContent === 'space-between' ||
    justifyContent === 'space-around' ||
    justifyContent === 'space-evenly'

  const alignIdx = ALIGN_AXIS.indexOf(alignItems as (typeof ALIGN_AXIS)[number])
  const justifyIdx = JUSTIFY_AXIS.indexOf(justifyContent as (typeof JUSTIFY_AXIS)[number])
  const dotActive =
    !isSpaceJustify && alignIdx >= 0 && justifyIdx >= 0
      ? { r: alignIdx, c: justifyIdx }
      : null

  const setDot = (r: number, c: number) => {
    patch('alignItems', ALIGN_AXIS[r] ?? 'flex-start')
    patch('justifyContent', JUSTIFY_AXIS[c] ?? 'flex-start')
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground">Align in flex</p>
      <div
        className="grid w-fit grid-cols-3 gap-1.5 rounded-md border border-border/70 bg-muted/30 p-2"
        role="group"
        aria-label="Flex alignment"
      >
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const active = dotActive?.r === r && dotActive.c === c
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setDot(r, c)}
                className={cn(
                  'size-3 rounded-full border transition-colors',
                  active
                    ? 'border-primary bg-primary shadow-sm'
                    : 'border-muted-foreground/40 bg-background hover:border-primary/50'
                )}
                aria-label={`Align ${ALIGN_AXIS[r]}, justify ${JUSTIFY_AXIS[c]}`}
              />
            )
          })
        )}
      </div>
      <div className="flex flex-wrap gap-0.5">
        <ToggleGroup
          type="single"
          value={isSpaceJustify ? justifyContent : undefined}
          onValueChange={(v) => {
            if (v) patch('justifyContent', v)
          }}
          variant="outline"
          size="sm"
          className="flex flex-wrap justify-start gap-0.5"
        >
          {(
            [
              { value: 'space-between', label: 'Between', Icon: AlignVerticalSpaceBetween },
              { value: 'space-around', label: 'Around', Icon: AlignVerticalSpaceAround },
              { value: 'space-evenly', label: 'Evenly', Icon: Equal }
            ] as const
          ).map(({ value, label, Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              className="h-6 px-1.5 text-[10px]"
            >
              <Icon className="size-3.5" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">Cross-axis</span>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant={alignItems === 'stretch' ? 'secondary' : 'outline'}
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => patch('alignItems', 'stretch')}
          >
            <FoldVertical className="size-3" />
            Stretch
          </Button>
          <Button
            type="button"
            size="sm"
            variant={alignItems === 'baseline' ? 'secondary' : 'outline'}
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => patch('alignItems', 'baseline')}
          >
            <AlignLeft className="size-3" />
            Baseline
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Flex direction + alignment grid + space-* row (no Cards). */
export function LayoutFlexVisualCards ({ str, patch }: { str: StrFn; patch: PatchFn }) {
  const flexDir = str('flexDirection') || 'row'
  return (
    <div className="flex flex-col gap-2">
      <IconToggleGroupField
        label="Direction"
        value={flexDir}
        onValueChange={(v) => patch('flexDirection', v)}
        options={[
          { value: 'row', label: 'Row', icon: ArrowLeftRight },
          { value: 'column', label: 'Column', icon: ArrowUpDown },
          { value: 'row-reverse', label: 'Row reverse', icon: ArrowRight },
          { value: 'column-reverse', label: 'Column reverse', icon: ArrowDown }
        ]}
      />
      <FlexAlignmentGrid str={str} patch={patch} />
    </div>
  )
}

/** Grid template + gap + item alignment when display is grid. */
export function GridLayoutControls ({ str, patch }: { str: StrFn; patch: PatchFn }) {
  const tplCols = str('gridTemplateColumns')
  const tplRows = str('gridTemplateRows')

  const colRepeatMatch = /^repeat\(\s*(\d+)\s*,\s*minmax\(0\s*,\s*1fr\)\s*\)$/i.exec(
    tplCols.trim()
  )
  const colCount = colRepeatMatch?.[1] ? Number(colRepeatMatch[1]) : ''

  const rowRepeatMatch = /^repeat\(\s*(\d+)\s*,/i.exec(tplRows.trim())
  const rowCount =
    rowRepeatMatch?.[1] && !tplRows.includes('auto')
      ? Number(rowRepeatMatch[1])
      : ''

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/15 p-2">
      <p className="text-[10px] font-medium text-muted-foreground">Grid</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          id="grid-cols-n"
          label="Columns"
          value={colCount === '' || Number.isNaN(colCount) ? '' : String(colCount)}
          onValueChange={(v) => {
            const n = parseInt(v, 10)
            if (!v.trim() || Number.isNaN(n) || n < 1) {
              patch('gridTemplateColumns', '')
              return
            }
            patch('gridTemplateColumns', `repeat(${n}, minmax(0, 1fr))`)
          }}
          min={1}
          max={24}
          step={1}
          placeholder="e.g. 3"
        />
        <NumberField
          id="grid-rows-n"
          label="Rows"
          value={rowCount === '' || Number.isNaN(rowCount) ? '' : String(rowCount)}
          onValueChange={(v) => {
            const n = parseInt(v, 10)
            if (!v.trim() || Number.isNaN(n) || n < 1) {
              patch('gridTemplateRows', '')
              return
            }
            patch('gridTemplateRows', `repeat(${n}, auto)`)
          }}
          min={1}
          max={48}
          step={1}
          placeholder="auto"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="grid-tps-cols" className="text-[10px]">
          Template columns (CSS)
        </Label>
        <Input
          id="grid-tps-cols"
          className="h-6 px-2 font-mono text-[10px] md:text-[10px]"
          value={tplCols}
          onChange={(e) => patch('gridTemplateColumns', e.target.value)}
          placeholder="repeat(3, minmax(0, 1fr))"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="grid-tps-rows" className="text-[10px]">
          Template rows (CSS)
        </Label>
        <Input
          id="grid-tps-rows"
          className="h-6 px-2 font-mono text-[10px] md:text-[10px]"
          value={tplRows}
          onChange={(e) => patch('gridTemplateRows', e.target.value)}
          placeholder="auto or repeat(2, auto)"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SizeInput label="Gap" value={str('gap')} onValueChange={(v) => patch('gap', v)} />
        <SizeInput
          label="Column gap"
          value={str('columnGap')}
          onValueChange={(v) => patch('columnGap', v)}
        />
        <SizeInput
          label="Row gap"
          value={str('rowGap')}
          onValueChange={(v) => patch('rowGap', v)}
        />
      </div>
      <StyleSelect
        label="Justify items"
        value={str('justifyItems')}
        onValueChange={(v) => patch('justifyItems', v)}
        options={[
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
          { value: 'stretch', label: 'Stretch' }
        ]}
      />
      <StyleSelect
        label="Align items"
        value={str('alignItems')}
        onValueChange={(v) => patch('alignItems', v)}
        options={[
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
          { value: 'stretch', label: 'Stretch' }
        ]}
      />
    </div>
  )
}

export function TextAlignVisualRow ({ str, patch }: { str: StrFn; patch: PatchFn }) {
  const textAlign = str('textAlign') || 'left'
  return (
    <div className="rounded-md border border-border/70 bg-muted/10 p-2">
      <IconToggleGroupField
        label="Text align"
        value={textAlign}
        onValueChange={(v) => patch('textAlign', v)}
        options={[
          { value: 'left', label: 'Left', icon: AlignLeft },
          { value: 'center', label: 'Center', icon: AlignCenter },
          { value: 'right', label: 'Right', icon: AlignRight },
          { value: 'justify', label: 'Justify', icon: FoldHorizontal }
        ]}
      />
    </div>
  )
}

export function LayoutDisplayModeCards ({ displayVal, patch }: { displayVal: string; patch: PatchFn }) {
  const isFlexActive = displayVal === 'flex' || displayVal === 'inline-flex'
  const isGridActive = displayVal === 'grid'
  const activeClass = 'border-primary bg-primary/10 text-primary font-semibold'
  const inactiveClass = 'border-border bg-background text-muted-foreground hover:border-primary/50'
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => patch('display', 'flex')}
        className={cn(
          'flex h-10 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] transition-colors',
          isFlexActive ? activeClass : inactiveClass
        )}
      >
        <LayoutPanelLeft className="size-4" />
        Flex
      </button>
      <button
        type="button"
        onClick={() => patch('display', 'grid')}
        className={cn(
          'flex h-10 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] transition-colors',
          isGridActive ? activeClass : inactiveClass
        )}
      >
        <LayoutGrid className="size-4" />
        Grid
      </button>
    </div>
  )
}

export function FlexSubControls ({ str, patch }: { str: StrFn; patch: PatchFn }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Direction</span>
        <ToggleGroup type="single" value={str('flexDirection') || 'row'} onValueChange={(v) => { if (v) patch('flexDirection', v) }} variant="outline" size="sm" className="flex gap-0.5">
          {([{ value: 'row', icon: ArrowRight }, { value: 'column', icon: ArrowDown }, { value: 'row-reverse', icon: ArrowLeft }, { value: 'column-reverse', icon: ArrowUp }] as const).map(({ value, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="h-6 w-6 p-0"><Icon className="size-3.5" /></ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Wrap</span>
        <ToggleGroup type="single" value={str('flexWrap') || 'nowrap'} onValueChange={(v) => { if (v) patch('flexWrap', v) }} variant="outline" size="sm" className="flex gap-0.5">
          {([{ value: 'nowrap', label: 'No Wrap' }, { value: 'wrap', label: 'Wrap' }, { value: 'wrap-reverse', label: 'Wrap Rev' }] as const).map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} className="h-6 px-1.5 text-[10px]">{label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Justify</span>
        <ToggleGroup type="single" value={str('justifyContent') || 'flex-start'} onValueChange={(v) => { if (v) patch('justifyContent', v) }} variant="outline" size="sm" className="flex gap-0.5">
          {([{ value: 'flex-start', icon: AlignStartVertical }, { value: 'center', icon: AlignCenterVertical }, { value: 'flex-end', icon: AlignEndVertical }, { value: 'space-between', icon: AlignVerticalSpaceBetween }, { value: 'space-around', icon: AlignVerticalSpaceAround }, { value: 'space-evenly', icon: Equal }] as const).map(({ value, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="h-6 w-6 p-0"><Icon className="size-3.5" /></ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Align</span>
        <ToggleGroup type="single" value={str('alignItems') || 'stretch'} onValueChange={(v) => { if (v) patch('alignItems', v) }} variant="outline" size="sm" className="flex gap-0.5">
          {([{ value: 'flex-start', icon: AlignStartVertical }, { value: 'center', icon: AlignCenterVertical }, { value: 'flex-end', icon: AlignEndVertical }, { value: 'stretch', icon: FoldVertical }, { value: 'baseline', icon: Minus }] as const).map(({ value, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="h-6 w-6 p-0"><Icon className="size-3.5" /></ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Gap</span>
        <SizeInput id="flex-gap" label="Gap" value={str('gap')} onValueChange={(v) => patch('gap', v)} className="flex-1" />
      </div>
    </div>
  )
}

export function GridSubControls ({ str, patch }: { str: StrFn; patch: PatchFn }) {
  const colMatch = /^repeat\((\d+),/.exec(str('gridTemplateColumns'))
  const rowMatch = /^repeat\((\d+),/.exec(str('gridTemplateRows'))
  const colCount = colMatch?.[1] ?? ''
  const rowCount = rowMatch?.[1] ?? ''
  return (
    <div className="flex flex-col gap-2">
      <NumberField id="grid-sub-cols" label="Columns" value={colCount} onValueChange={(v) => { const n = parseInt(v, 10); patch('gridTemplateColumns', Number.isNaN(n) ? '' : `repeat(${n}, minmax(0, 1fr))`) }} min={1} max={12} step={1} placeholder="e.g. 3" />
      <NumberField id="grid-sub-rows" label="Rows" value={rowCount} onValueChange={(v) => { const n = parseInt(v, 10); patch('gridTemplateRows', Number.isNaN(n) ? '' : `repeat(${n}, auto)`) }} min={1} max={12} step={1} placeholder="auto" />
      <SizeInput id="grid-sub-cgap" label="Col Gap" value={str('columnGap')} onValueChange={(v) => patch('columnGap', v)} />
      <SizeInput id="grid-sub-rgap" label="Row Gap" value={str('rowGap')} onValueChange={(v) => patch('rowGap', v)} />
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Align Items</span>
        <ToggleGroup type="single" value={str('alignItems') || 'stretch'} onValueChange={(v) => { if (v) patch('alignItems', v) }} variant="outline" size="sm" className="flex gap-0.5">
          {([{ value: 'flex-start', icon: AlignStartVertical }, { value: 'center', icon: AlignCenterVertical }, { value: 'flex-end', icon: AlignEndVertical }, { value: 'stretch', icon: FoldVertical }, { value: 'baseline', icon: Minus }] as const).map(({ value, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="h-6 w-6 p-0"><Icon className="size-3.5" /></ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Justify Items</span>
        <ToggleGroup type="single" value={str('justifyItems') || 'stretch'} onValueChange={(v) => { if (v) patch('justifyItems', v) }} variant="outline" size="sm" className="flex gap-0.5">
          {([{ value: 'start', icon: AlignStartVertical }, { value: 'center', icon: AlignCenterVertical }, { value: 'end', icon: AlignEndVertical }, { value: 'stretch', icon: FoldVertical }] as const).map(({ value, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="h-6 w-6 p-0"><Icon className="size-3.5" /></ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}