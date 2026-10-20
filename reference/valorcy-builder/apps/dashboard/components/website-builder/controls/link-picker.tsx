'use client'

import { useMemo } from 'react'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { StyleSelect } from '@/components/website-builder/controls'
import { useBuilderStore } from '@/lib/builder/store'
import {
  isLinkModel,
  normalizeToLinkModel,
  pageHrefFromSlug,
  type LinkModel,
  type LinkType,
  type LinkValue,
} from '@/lib/builder/links'

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'page', label: 'Page' },
  { value: 'section', label: 'Section anchor' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'file', label: 'File download' },
]

type LinkPickerProps = {
  id?: string
  label: string
  value: unknown
  onChange: (value: LinkValue) => void
}

function parseLinkValue (value: unknown): LinkModel {
  if (typeof value === 'string') {
    return normalizeToLinkModel(value)
  }
  if (isLinkModel(value)) {
    return normalizeToLinkModel(value)
  }
  if (value && typeof value === 'object' && 'href' in value) {
    const rec = value as Record<string, unknown>
    const href = String(rec.href ?? '')
    return normalizeToLinkModel(href)
  }
  return { type: 'url', href: '' }
}

function emitLinkValue (model: LinkModel): LinkValue {
  const href = model.href?.trim() ?? ''
  if (!href) return '#'

  if (model.type === 'url' && (href.startsWith('http://') || href.startsWith('https://'))) {
    return href
  }

  if (model.type === 'page' || model.type === 'section' || model.type === 'email' || model.type === 'phone' || model.type === 'file') {
    return {
      type: model.type,
      href,
      slug: model.slug,
      pageId: model.pageId,
      sectionId: model.sectionId,
      target: model.target,
      rel: model.rel,
    }
  }

  return href
}

export function LinkPicker ({ id, label, value, onChange }: LinkPickerProps) {
  const pages = useBuilderStore((s) => s.pages)
  const sections = useBuilderStore((s) => s.sections)
  const sharedHeader = useBuilderStore((s) => s.sharedHeader)
  const sharedFooter = useBuilderStore((s) => s.sharedFooter)
  const builderLocale = useBuilderStore((s) => s.builderLocale)

  const model = useMemo(() => parseLinkValue(value), [value])

  const sectionAnchors = useMemo(() => {
    const all = [
      ...sections,
      ...(sharedHeader ? [sharedHeader] : []),
      ...(sharedFooter ? [sharedFooter] : []),
    ]
    return all.map((s) => ({
      id: s.id,
      label: s.sectionId.replace(/-/g, ' '),
    }))
  }, [sections, sharedHeader, sharedFooter])

  const pageOptions = useMemo(
    () =>
      pages.map((p) => {
        const localized = p.name?.[builderLocale] ?? p.name?.en ?? p.slug
        return {
          value: p.id,
          label: localized,
        }
      }),
    [pages, builderLocale],
  )

  function patch (partial: Partial<LinkModel>) {
    onChange(emitLinkValue({ ...model, ...partial }))
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <StyleSelect
        id={id ? `${id}-type` : undefined}
        label="Link type"
        value={model.type}
        onValueChange={(next) => patch({ type: next as LinkType })}
        options={LINK_TYPES}
        allowEmpty={false}
      />

      {model.type === 'page' && (
        <StyleSelect
          label="Page"
          value={model.pageId ?? ''}
          onValueChange={(pageId) => {
            const page = pages.find((p) => p.id === pageId)
            if (!page) return
            patch({
              type: 'page',
              pageId: page.id,
              slug: page.slug,
              href: pageHrefFromSlug(page.slug, page.isHome),
            })
          }}
          options={pageOptions}
          allowEmpty={false}
          placeholder="Select page"
        />
      )}

      {model.type === 'section' && (
        <StyleSelect
          label="Section"
          value={model.sectionId ?? ''}
          onValueChange={(sectionId) => {
            patch({
              type: 'section',
              sectionId,
              href: sectionId.startsWith('#') ? sectionId : `#${sectionId}`,
            })
          }}
          options={sectionAnchors.map((s) => ({ value: s.id, label: s.label }))}
          allowEmpty={false}
          placeholder="Select section"
        />
      )}

      {model.type === 'url' && (
        <Input
          value={model.href ?? ''}
          placeholder="https://example.com or /path"
          onChange={(e) => patch({ type: 'url', href: e.target.value })}
        />
      )}

      {model.type === 'email' && (
        <Input
          type="email"
          value={model.href?.replace(/^mailto:/i, '') ?? ''}
          placeholder="hello@example.com"
          onChange={(e) => patch({ type: 'email', href: e.target.value })}
        />
      )}

      {model.type === 'phone' && (
        <Input
          type="tel"
          value={model.href?.replace(/^tel:/i, '') ?? ''}
          placeholder="+1 555 000 0000"
          onChange={(e) => patch({ type: 'phone', href: e.target.value })}
        />
      )}

      {model.type === 'file' && (
        <Input
          value={model.href ?? ''}
          placeholder="/files/brochure.pdf"
          onChange={(e) => patch({ type: 'file', href: e.target.value })}
        />
      )}
    </div>
  )
}
