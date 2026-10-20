'use client'

import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group'
import type { ComponentStyle, DeepPartial } from '@/lib/builder/component-style'
import {
  FONT_SIZE,
  LINE_HEIGHT,
  WEIGHT,
  matchToken,
  type SizeToken,
  type WeightToken,
} from '@/lib/builder/style-tokens'
import { Segmented } from '../shared/segmented'
import { Row } from '../shared/row'

const SIZE_OPTS = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
  { value: '2xl', label: '2XL' },
] as const

const WEIGHT_OPTS = [
  { value: 'light', label: 'L' },
  { value: 'normal', label: 'N' },
  { value: 'medium', label: 'M' },
  { value: 'bold', label: 'B' },
] as const

type Props = {
  style: Partial<ComponentStyle>
  onPatch: (patch: DeepPartial<ComponentStyle>) => void
}

export function TypographyControls ({ style, onPatch }: Props) {
  const sizeTok = matchToken(FONT_SIZE, style.fontSize) as SizeToken | undefined
  const weightTok = matchToken(WEIGHT, style.fontWeight) as WeightToken | undefined
  const align = String(style.textAlign ?? 'left')
  const isItalic = String(style.fontStyle ?? '') === 'italic'
  const isUnderline = String(style.textDecoration ?? '').includes('underline')
  const color = String(style.color ?? '')
  const colorForPicker = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim()) ? color.trim() : '#000000'

  return (
    <div className="flex flex-col gap-1.5">
      <Row label="Size">
        <Segmented
          ariaLabel="Font size"
          value={sizeTok}
          onChange={(t) => onPatch({ fontSize: FONT_SIZE[t], lineHeight: LINE_HEIGHT[t] })}
          options={SIZE_OPTS as unknown as ReadonlyArray<{ value: SizeToken; label: string }>}
        />
      </Row>
      <Row label="Weight">
        <Segmented
          ariaLabel="Font weight"
          value={weightTok}
          onChange={(t) => onPatch({ fontWeight: WEIGHT[t] })}
          options={WEIGHT_OPTS as unknown as ReadonlyArray<{ value: WeightToken; label: string }>}
        />
        <Button
          type="button"
          size="icon"
          variant={isItalic ? 'secondary' : 'ghost'}
          className="size-7"
          aria-label="Italic"
          onClick={() => onPatch({ fontStyle: isItalic ? 'normal' : 'italic' })}
        >
          <Italic className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={isUnderline ? 'secondary' : 'ghost'}
          className="size-7"
          aria-label="Underline"
          onClick={() => onPatch({ textDecoration: isUnderline ? 'none' : 'underline' })}
        >
          <Underline className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={weightTok === 'bold' ? 'secondary' : 'ghost'}
          className="size-7"
          aria-label="Bold"
          onClick={() => onPatch({ fontWeight: weightTok === 'bold' ? '400' : '700' })}
        >
          <Bold className="size-3.5" />
        </Button>
      </Row>
      <Row label="Align">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={align}
          onValueChange={(v) => { if (v) onPatch({ textAlign: v }) }}
          className="border-0 bg-transparent p-0 shadow-none"
          aria-label="Text alignment"
        >
          <ToggleGroupItem value="left" aria-label="Align left" className="size-7 p-0">
            <AlignLeft className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center" className="size-7 p-0">
            <AlignCenter className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right" className="size-7 p-0">
            <AlignRight className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justify" className="size-7 p-0">
            <AlignJustify className="size-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Row>
      <Row label="Color">
        <input
          type="color"
          className="size-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
          value={colorForPicker}
          onChange={(e) => onPatch({ color: e.target.value })}
          aria-label="Text color"
        />
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={color}
          placeholder="#000000"
          onChange={(e) => onPatch({ color: e.target.value })}
          aria-label="Color hex"
        />
      </Row>
    </div>
  )
}
