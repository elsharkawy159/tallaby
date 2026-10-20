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
import { useBuilderStore } from '@/lib/builder/store'
import { Segmented } from '../shared/segmented'
import { Row } from '../shared/row'

type Props = {
  href: string
  target: string
  onProps: (patch: Record<string, unknown>) => void
}

function pageSlugToHref (slug: string, isHome: boolean): string {
  if (isHome) return '/'
  return `/${slug.replace(/^\/+/, '')}`
}

function pageNameFor (name: Record<string, string>, locale: string): string {
  return name[locale] ?? name.en ?? Object.values(name)[0] ?? '(untitled)'
}

export function LinkControls ({ href, target, onProps }: Props) {
  const pages = useBuilderStore((s) => s.pages)
  const matched = useMemo(() => {
    const t = href.trim()
    if (!t) return undefined
    return pages.find((p) => pageSlugToHref(p.slug, p.isHome) === t)
  }, [pages, href])
  const [mode, setMode] = useState<'page' | 'url'>(matched ? 'page' : 'url')
  const newTab = target === '_blank'

  return (
    <div className="flex flex-col gap-1.5">
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
            value={matched?.id ?? ''}
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
      <Row label="Target">
        <Segmented
          ariaLabel="Target"
          value={newTab ? 'blank' : 'self'}
          onChange={(v) =>
            onProps({
              target: v === 'blank' ? '_blank' : '',
              rel: v === 'blank' ? 'noopener noreferrer' : '',
            })
          }
          options={[
            { value: 'self', label: 'Same tab' },
            { value: 'blank', label: 'New tab' },
          ] as ReadonlyArray<{ value: 'self' | 'blank'; label: string }>}
        />
      </Row>
    </div>
  )
}
