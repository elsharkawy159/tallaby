'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { MediaLibraryDialog } from '@/components/website-builder/media/media-library-dialog'
import type { ComponentStyle, DeepPartial } from '@/lib/builder/component-style'
import { RADIUS_PX, matchToken, type RadiusToken } from '@/lib/builder/style-tokens'
import { Segmented } from '../shared/segmented'
import { Row } from '../shared/row'

const RADIUS_OPTS = [
  { value: 'none', label: '0' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
  { value: 'full', label: '●' },
] as const

const FIT_OPTS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
  { value: 'none', label: 'None' },
] as const

const SHADOW_OPTS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
] as const

const SHADOW_CSS: Record<(typeof SHADOW_OPTS)[number]['value'], string | undefined> = {
  none: undefined,
  sm: '0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.15)',
}

function matchShadowToken (value: unknown): (typeof SHADOW_OPTS)[number]['value'] | undefined {
  const v = value === undefined || value === null ? '' : String(value).trim()
  if (!v || v === 'none') return 'none'
  for (const opt of SHADOW_OPTS) {
    if (opt.value !== 'none' && SHADOW_CSS[opt.value] === v) return opt.value
  }
  return undefined
}

type Props = {
  projectId: string | null
  src: string
  alt: string
  style: Partial<ComponentStyle>
  onProps: (patch: Record<string, unknown>) => void
  onStyle: (patch: DeepPartial<ComponentStyle>) => void
}

export function ImageControls ({ projectId, src, alt, style, onProps, onStyle }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false)
  const radiusTok = matchToken(RADIUS_PX, style.borderRadius) as RadiusToken | undefined
  const fit = String(style.objectFit ?? 'cover')
  const borderColor = String(style.borderColor ?? '')
  const borderWidthStr = String(style.borderWidth ?? '').replace('px', '')
  const colorForPicker = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(borderColor.trim())
    ? borderColor.trim()
    : '#000000'
  const shadowTok = matchShadowToken(style.boxShadow)
  const customShadow = shadowTok === undefined && style.boxShadow ? String(style.boxShadow) : ''

  return (
    <div className="flex flex-col gap-1.5">
      {projectId ? (
        <Row label="Source">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 flex-1 gap-1 px-2 text-xs"
            onClick={() => setMediaOpen(true)}
          >
            <ImageIcon className="size-3.5" />
            Replace image
          </Button>
          <MediaLibraryDialog
            open={mediaOpen}
            onOpenChange={setMediaOpen}
            projectId={projectId}
            previousUrl={src}
            onCommit={(url) => onProps({ src: url })}
          />
        </Row>
      ) : null}
      <Row label="Fit">
        <Segmented
          ariaLabel="Object fit"
          value={fit as 'cover' | 'contain' | 'fill' | 'none'}
          onChange={(v) => onStyle({ objectFit: v })}
          options={FIT_OPTS as unknown as ReadonlyArray<{ value: 'cover' | 'contain' | 'fill' | 'none'; label: string }>}
        />
      </Row>
      <Row label="Radius">
        <Segmented
          ariaLabel="Border radius"
          value={radiusTok}
          onChange={(t) => onStyle({ borderRadius: RADIUS_PX[t] })}
          options={RADIUS_OPTS as unknown as ReadonlyArray<{ value: RadiusToken; label: string }>}
        />
      </Row>
      <Row label="Border">
        <Input
          className="h-7 w-14 px-1.5 text-[10px]"
          value={borderWidthStr}
          placeholder="0"
          onChange={(e) => {
            const n = e.target.value.trim()
            onStyle({
              borderWidth: n ? `${n}px` : '0px',
              borderStyle: n && n !== '0' ? 'solid' : undefined,
            })
          }}
          aria-label="Border width (px)"
          title="Border width (px)"
        />
        <input
          type="color"
          className="size-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
          value={colorForPicker}
          onChange={(e) => onStyle({ borderColor: e.target.value })}
          aria-label="Border color"
          title="Border color"
        />
        <span className="text-[10px] text-muted-foreground">px</span>
      </Row>
      <Row label="Shadow">
        <Segmented
          ariaLabel="Box shadow"
          value={shadowTok ?? (customShadow ? undefined : 'none')}
          onChange={(t) => onStyle({ boxShadow: SHADOW_CSS[t] })}
          options={SHADOW_OPTS as unknown as ReadonlyArray<{ value: (typeof SHADOW_OPTS)[number]['value']; label: string }>}
        />
      </Row>
      {shadowTok === undefined && customShadow ? (
        <Row label="Custom">
          <Input
            className="h-7 flex-1 px-2 font-mono text-[10px]"
            value={customShadow}
            onChange={(e) => onStyle({ boxShadow: e.target.value || undefined })}
            aria-label="Custom box shadow"
            placeholder="CSS shadow"
          />
        </Row>
      ) : null}
      <Row label="Alt">
        <Input
          className="h-7 flex-1 px-2 text-[11px]"
          value={alt}
          placeholder="Describe the image"
          onChange={(e) => onProps({ alt: e.target.value })}
          aria-label="Alt text"
        />
      </Row>
    </div>
  )
}
