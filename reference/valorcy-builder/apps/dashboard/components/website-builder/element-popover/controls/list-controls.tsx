'use client'

import type { ComponentStyle, DeepPartial } from '@/lib/builder/component-style'
import { SPACING_PX, matchToken, type SpacingToken } from '@/lib/builder/style-tokens'
import { Segmented } from '../shared/segmented'
import { Row } from '../shared/row'

const STYLE_OPTS = [
  { value: 'disc', label: '• Disc' },
  { value: 'circle', label: '○ Circle' },
  { value: 'square', label: '▪ Square' },
  { value: 'decimal', label: '1. Num' },
  { value: 'none', label: 'None' },
] as const

const GAP_OPTS = [
  { value: 'none', label: '0' },
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
] as const

type Props = {
  style: Partial<ComponentStyle>
  onStyle: (patch: DeepPartial<ComponentStyle>) => void
}

export function ListControls ({ style, onStyle }: Props) {
  const gapTok = matchToken(SPACING_PX, style.gap) as SpacingToken | undefined
  const styleVal = String((style as Record<string, unknown>).listStyleType ?? 'disc')

  return (
    <div className="flex flex-col gap-1.5">
      <Row label="Marker">
        <Segmented
          ariaLabel="List style"
          value={styleVal as 'disc' | 'circle' | 'square' | 'decimal' | 'none'}
          onChange={(v) =>
            onStyle({ listStyleType: v } as DeepPartial<ComponentStyle>)
          }
          options={STYLE_OPTS as unknown as ReadonlyArray<{
            value: 'disc' | 'circle' | 'square' | 'decimal' | 'none'
            label: string
          }>}
        />
      </Row>
      <Row label="Gap">
        <Segmented
          ariaLabel="Gap"
          value={gapTok}
          onChange={(t) => onStyle({ gap: SPACING_PX[t] })}
          options={GAP_OPTS as unknown as ReadonlyArray<{ value: SpacingToken; label: string }>}
        />
      </Row>
    </div>
  )
}
