'use client'

import { Input } from '@workspace/ui/components/input'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  Columns3,
  Rows3,
  AlignCenterVertical,
  AlignStartVertical,
  AlignEndVertical,
  FoldVertical,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import type { ComponentStyle, DeepPartial } from '@/lib/builder/component-style'
import {
  RADIUS_PX,
  SPACING_PX,
  matchToken,
  type RadiusToken,
  type SpacingToken,
} from '@/lib/builder/style-tokens'
import { Segmented } from '../shared/segmented'
import { Row } from '../shared/row'

const PAD_OPTS = [
  { value: 'none', label: '0' },
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
] as const

const RADIUS_OPTS = [
  { value: 'none', label: '0' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
  { value: 'full', label: '●' },
] as const

type Props = {
  style: Partial<ComponentStyle>
  onStyle: (patch: DeepPartial<ComponentStyle>) => void
}

const BTN = 'size-7 shrink-0'

export function ContainerControls ({ style, onStyle }: Props) {
  const padTok = matchToken(SPACING_PX, style.padding) as SpacingToken | undefined
  const radiusTok = matchToken(RADIUS_PX, style.borderRadius) as RadiusToken | undefined
  const bg = String(style.backgroundColor ?? '')
  const bgPicker = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bg.trim()) ? bg.trim() : '#ffffff'
  const textColor = String(style.color ?? '')
  const textPicker = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(textColor.trim()) ? textColor.trim() : '#000000'
  const display = String(style.display ?? 'block')
  const isGrid = display === 'grid' || display === 'inline-grid'
  const isFlex = !isGrid && (display.includes('flex') || display === 'block')
  const dir = String(style.flexDirection ?? 'row')
  const justify = String(style.justifyContent ?? 'flex-start')
  const align = String(style.alignItems ?? 'stretch')
  const gap = String(style.gap ?? '')
  const gridCols = String((style as Record<string,unknown>).gridTemplateColumns ?? '')
  const gridRows = String((style as Record<string,unknown>).gridTemplateRows ?? '')
  const w = String(style.width ?? '')
  const h = String(style.height ?? '')
  const fontSize = String(style.fontSize ?? '')
  const opacity = String(style.opacity ?? '')

  const GRID_COL_PRESETS = [1, 2, 3, 4, 6, 12]
  const GRID_ROW_PRESETS = [1, 2, 3, 4]
  const currentCols = GRID_COL_PRESETS.find(
    (n) => gridCols === `repeat(${n}, 1fr)` || gridCols === `repeat(${n},1fr)`
  )

  const isRow = dir === 'row' || dir === 'row-reverse'

  return (
    <div className="flex flex-col gap-2 text-xs">
      {/* Display mode */}
      <Row label="Display">
        <Button type="button" size="sm" variant={isGrid ? 'ghost' : 'secondary'}
          className="h-7 px-2 text-[10px]"
          onClick={() => onStyle({ display: 'flex', flexDirection: 'row' } as DeepPartial<ComponentStyle>)}>
          Flex
        </Button>
        <Button type="button" size="sm" variant={isGrid ? 'secondary' : 'ghost'}
          className="h-7 px-2 text-[10px]"
          onClick={() => onStyle({ display: 'grid' } as DeepPartial<ComponentStyle>)}>
          Grid
        </Button>
      </Row>

      {isGrid ? (
        <>
          {/* Grid columns */}
          <Row label="Columns">
            {GRID_COL_PRESETS.map((n) => (
              <Button key={n} type="button" size="sm"
                variant={currentCols === n ? 'secondary' : 'ghost'}
                className="h-7 min-w-[28px] px-1.5 text-[10px]"
                onClick={() => onStyle({ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)` } as DeepPartial<ComponentStyle>)}>
                {n}
              </Button>
            ))}
          </Row>
          {/* Custom grid columns */}
          <Row label="Col template">
            <Input className="h-7 flex-1 px-2 font-mono text-[10px]"
              value={gridCols} placeholder="repeat(3, 1fr)"
              onChange={(e) => onStyle({ display: 'grid', gridTemplateColumns: e.target.value || undefined } as DeepPartial<ComponentStyle>)} />
          </Row>
          {/* Grid rows */}
          <Row label="Rows">
            {GRID_ROW_PRESETS.map((n) => (
              <Button key={n} type="button" size="sm"
                variant={gridRows === `repeat(${n}, 1fr)` ? 'secondary' : 'ghost'}
                className="h-7 min-w-[28px] px-1.5 text-[10px]"
                onClick={() => onStyle({ gridTemplateRows: `repeat(${n}, 1fr)` } as DeepPartial<ComponentStyle>)}>
                {n}
              </Button>
            ))}
          </Row>
        </>
      ) : (
        <>
          {/* Flex direction */}
          <Row label="Direction">
            <Button type="button" size="icon" variant={dir === 'row' ? 'secondary' : 'ghost'}
              className={BTN} title="Horizontal (Row)" aria-label="Horizontal (Row)"
              onClick={() => onStyle({ display: 'flex', flexDirection: 'row' })}>
              <Columns3 className="size-3.5" />
            </Button>
            <Button type="button" size="icon" variant={dir === 'column' ? 'secondary' : 'ghost'}
              className={BTN} title="Vertical (Column)" aria-label="Vertical (Column)"
              onClick={() => onStyle({ display: 'flex', flexDirection: 'column' })}>
              <Rows3 className="size-3.5" />
            </Button>
          </Row>
          {/* Main axis */}
          <Row label={isRow ? 'Justify' : 'Align'}>
            {([
              { v: 'flex-start', Icon: AlignLeft, title: 'Start' },
              { v: 'center', Icon: AlignCenter, title: 'Center' },
              { v: 'flex-end', Icon: AlignRight, title: 'End' },
              { v: 'space-between', Icon: AlignJustify, title: 'Between' },
            ] as const).map(({ v, Icon, title }) => (
              <Button key={v} type="button" size="icon"
                variant={justify === v ? 'secondary' : 'ghost'}
                className={BTN} title={title} aria-label={title}
                onClick={() => onStyle({ justifyContent: v as ComponentStyle['justifyContent'] })}>
                <Icon className="size-3.5" />
              </Button>
            ))}
          </Row>
          {/* Cross axis */}
          <Row label={isRow ? 'Align' : 'Justify'}>
            {([
              { v: 'flex-start', Icon: AlignStartVertical, title: 'Start' },
              { v: 'center', Icon: AlignCenterVertical, title: 'Center' },
              { v: 'flex-end', Icon: AlignEndVertical, title: 'End' },
              { v: 'stretch', Icon: FoldVertical, title: 'Stretch' },
            ] as const).map(({ v, Icon, title }) => (
              <Button key={v} type="button" size="icon"
                variant={align === v ? 'secondary' : 'ghost'}
                className={BTN} title={title} aria-label={title}
                onClick={() => onStyle({ alignItems: v as ComponentStyle['alignItems'] })}>
                <Icon className="size-3.5" />
              </Button>
            ))}
          </Row>
        </>
      )}

      {/* Gap */}
      <Row label="Gap">
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={gap}
          placeholder="e.g. 8px or 1rem"
          onChange={(e) => onStyle({ gap: e.target.value || undefined })}
        />
      </Row>

      {/* Width / Height */}
      <Row label="W / H">
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={w}
          placeholder="width"
          onChange={(e) => onStyle({ width: e.target.value || undefined })}
        />
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={h}
          placeholder="height"
          onChange={(e) => onStyle({ height: e.target.value || undefined })}
        />
      </Row>

      {/* Padding */}
      <Row label="Padding">
        <Segmented
          ariaLabel="Padding"
          value={padTok}
          onChange={(t) => onStyle({ padding: SPACING_PX[t] })}
          options={PAD_OPTS as unknown as ReadonlyArray<{ value: SpacingToken; label: string }>}
        />
      </Row>

      {/* Border radius */}
      <Row label="Radius">
        <Segmented
          ariaLabel="Radius"
          value={radiusTok}
          onChange={(t) => onStyle({ borderRadius: RADIUS_PX[t] })}
          options={RADIUS_OPTS as unknown as ReadonlyArray<{ value: RadiusToken; label: string }>}
        />
      </Row>

      {/* Background color */}
      <Row label="BG">
        <input
          type="color"
          className="size-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
          value={bgPicker}
          onChange={(e) => onStyle({ backgroundColor: e.target.value })}
          title="Background color"
        />
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={bg}
          placeholder="#ffffff or transparent"
          onChange={(e) => onStyle({ backgroundColor: e.target.value || undefined })}
        />
      </Row>

      {/* Text color */}
      <Row label="Text">
        <input
          type="color"
          className="size-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
          value={textPicker}
          onChange={(e) => onStyle({ color: e.target.value })}
          title="Text color"
        />
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={textColor}
          placeholder="inherit"
          onChange={(e) => onStyle({ color: e.target.value || undefined })}
        />
      </Row>

      {/* Font size */}
      <Row label="Font">
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={fontSize}
          placeholder="inherit"
          onChange={(e) => onStyle({ fontSize: e.target.value || undefined })}
        />
      </Row>

      {/* Opacity */}
      <Row label="Opacity">
        <Input
          className="h-7 w-20 px-2 font-mono text-[10px]"
          value={opacity}
          placeholder="1"
          onChange={(e) => onStyle({ opacity: e.target.value || undefined })}
          type="number"
          min={0}
          max={1}
          step={0.05}
        />
      </Row>
    </div>
  )
}
