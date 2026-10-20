'use client'

import { useMemo, useState } from 'react'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import type { ComponentStyle, DeepPartial } from '@/lib/builder/component-style'
import { useBuilderStore } from '@/lib/builder/store'
import { RADIUS_PX, matchToken, type RadiusToken } from '@/lib/builder/style-tokens'
import { Segmented } from '../shared/segmented'
import { Row } from '../shared/row'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost'

const VARIANT_OPTS = [
  { value: 'default', label: 'Solid' },
  { value: 'secondary', label: 'Soft' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
] as const

const SIZE_OPTS = [
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
] as const

const RADIUS_OPTS = [
  { value: 'none', label: '0' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
  { value: 'full', label: 'Pill' },
] as const

const SIZE_PADDING: Record<'sm' | 'md' | 'lg', {
  paddingTop: string
  paddingBottom: string
  paddingLeft: string
  paddingRight: string
  fontSize: string
}> = {
  sm: { paddingTop: '4px', paddingBottom: '4px', paddingLeft: '8px', paddingRight: '8px', fontSize: '0.75rem' },
  md: { paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', fontSize: '0.875rem' },
  lg: { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px', fontSize: '1rem' },
}

type Props = {
  variant: string
  href: string
  style: Partial<ComponentStyle>
  onProps: (patch: Record<string, unknown>) => void
  onStyle: (patch: DeepPartial<ComponentStyle>) => void
}

function pageSlugToHref (slug: string, isHome: boolean): string {
  if (isHome) return '/'
  const clean = slug.replace(/^\/+/, '')
  return `/${clean}`
}

function pageNameFor (name: Record<string, string>, locale: string): string {
  return name[locale] ?? name.en ?? Object.values(name)[0] ?? '(untitled)'
}

export function ButtonControls ({ variant, href, style, onProps, onStyle }: Props) {
  const pages = useBuilderStore((s) => s.pages)
  const radiusTok = matchToken(RADIUS_PX, style.borderRadius) as RadiusToken | undefined
  const bg = String(style.backgroundColor ?? '')
  const bgPicker = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bg.trim()) ? bg.trim() : '#000000'

  // Legacy section CTAs stored `primary`; treat it as Solid (`default`).
  const normalizedVariant: Variant =
    variant === 'primary' || !VARIANT_OPTS.some((o) => o.value === variant)
      ? 'default'
      : (variant as Variant)

  const matchedPage = useMemo(() => {
    const trimmed = href.trim()
    if (!trimmed) return undefined
    return pages.find((p) => pageSlugToHref(p.slug, p.isHome) === trimmed)
  }, [pages, href])

  const [mode, setMode] = useState<'page' | 'url'>(matchedPage ? 'page' : 'url')

  const guessedSize: 'sm' | 'md' | 'lg' | undefined = (() => {
    const pl = String(style.paddingLeft ?? '')
    if (pl === '8px') return 'sm'
    if (pl === '16px') return 'md'
    if (pl === '24px') return 'lg'
    return undefined
  })()

  return (
    <div className="flex flex-col gap-1.5">
      <Row label="Style">
        <Segmented
          ariaLabel="Variant"
          value={normalizedVariant}
          onChange={(v) => onProps({ variant: v })}
          options={VARIANT_OPTS as unknown as ReadonlyArray<{ value: Variant; label: string }>}
        />
      </Row>
      <Row label="Size">
        <Segmented
          ariaLabel="Size"
          value={guessedSize}
          onChange={(t) => onStyle(SIZE_PADDING[t])}
          options={SIZE_OPTS as unknown as ReadonlyArray<{ value: 'sm' | 'md' | 'lg'; label: string }>}
        />
      </Row>
      <Row label="Radius">
        <Segmented
          ariaLabel="Radius"
          value={radiusTok}
          onChange={(t) => onStyle({ borderRadius: RADIUS_PX[t] })}
          options={RADIUS_OPTS as unknown as ReadonlyArray<{ value: RadiusToken; label: string }>}
        />
      </Row>
      <Row label="Color">
        <input
          type="color"
          className="size-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
          value={bgPicker}
          onChange={(e) => onStyle({ backgroundColor: e.target.value })}
          aria-label="Background color"
          title="Background color"
        />
        <Input
          className="h-7 flex-1 px-2 font-mono text-[10px]"
          value={bg}
          placeholder="#000000"
          onChange={(e) => onStyle({ backgroundColor: e.target.value })}
          aria-label="Background color hex"
        />
      </Row>
      <Row label="Link to">
        <Segmented
          ariaLabel="Link type"
          value={mode}
          onChange={(v) => setMode(v)}
          options={[
            { value: 'page', label: 'Page' },
            { value: 'url', label: 'URL' },
          ] as ReadonlyArray<{ value: 'page' | 'url'; label: string }>}
        />
      </Row>
      <Row label={mode === 'page' ? 'Page' : 'URL'}>
        {mode === 'page' ? (
          <Select
            value={matchedPage?.id ?? ''}
            onValueChange={(pageId) => {
              const p = pages.find((x) => x.id === pageId)
              if (p) onProps({ href: pageSlugToHref(p.slug, p.isHome) })
            }}
          >
            <SelectTrigger className="h-7 flex-1 text-[11px]">
              <SelectValue placeholder={pages.length ? 'Select a page' : 'No pages yet'} />
            </SelectTrigger>
            <SelectContent className="z-999!">
              {pages.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {pageNameFor(p.name, p.locale)}
                  <span className="ms-1 text-[10px] text-muted-foreground">
                    {pageSlugToHref(p.slug, p.isHome)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-7 flex-1 px-2 text-[11px]"
            value={href}
            placeholder="https://…"
            onChange={(e) => onProps({ href: e.target.value })}
            aria-label="Link URL"
          />
        )}
      </Row>
    </div>
  )
}
