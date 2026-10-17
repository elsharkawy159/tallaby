'use client'

import { useMemo } from 'react'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Separator } from '@workspace/ui/components/separator'
import { useBuilderStore } from '@/lib/builder/store'
import { findComponentNodeInTree } from '@/lib/builder/find-tree-node'

const TAG_OPTIONS = [
  { value: 'div', label: 'div' },
  { value: 'section', label: 'section' },
  { value: 'header', label: 'header' },
  { value: 'footer', label: 'footer' },
  { value: 'article', label: 'article' },
  { value: 'main', label: 'main' },
  { value: 'nav', label: 'nav' },
  { value: 'aside', label: 'aside' },
  { value: 'span', label: 'span' },
]

type Props = {
  elementId: string
}

function parseElementId (elementId: string) {
  const sep = elementId.indexOf('::')
  if (sep <= 0) return { sectionInstId: '', nodeId: '' }
  return {
    sectionInstId: elementId.slice(0, sep),
    nodeId: elementId.slice(sep + 2),
  }
}

export function ElementSettingsPanel ({ elementId }: Props) {
  const sections = useBuilderStore((s) => s.sections)
  const elementAttributes = useBuilderStore((s) => s.elementAttributes)
  const updateElementAttributes = useBuilderStore((s) => s.updateElementAttributes)
  const updateComponentNodeProps = useBuilderStore((s) => s.updateComponentNodeProps)

  const { sectionInstId, nodeId } = parseElementId(elementId)
  const node = useMemo(() => {
    const section = sections.find((x) => x.id === sectionInstId)
    if (!section?.componentTree || !nodeId) return undefined
    return findComponentNodeInTree(section.componentTree, nodeId)
  }, [sections, sectionInstId, nodeId])

  const attr = elementAttributes[elementId] ?? {}
  const visible = attr.visibility !== 'hidden'

  const patchProps = (patch: Record<string, unknown>) => {
    if (!sectionInstId || !nodeId) return
    updateComponentNodeProps(sectionInstId, nodeId, patch)
  }

  const p = (node?.props ?? {}) as Record<string, unknown>

  return (
    <div className="flex flex-col gap-3 px-1 py-2 text-xs">
      {node && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {node.type} · settings
        </p>
      )}

      {node?.type === 'button' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Variant</Label>
            <Select
              value={String(p.variant ?? 'default')}
              onValueChange={(v) => patchProps({ variant: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="destructive">Destructive</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(node?.type === 'linkBlock' || node?.type === 'textLink') && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="a-rel" className="text-[10px]">Rel</Label>
            <Input
              id="a-rel"
              className="h-8 text-xs"
              value={String(p.rel ?? '')}
              onChange={(e) => patchProps({ rel: e.target.value.trim() || undefined })}
              placeholder="noopener"
            />
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">HTML</p>
        <div className="space-y-1">
          <Label htmlFor="el-htms-id" className="text-[10px]">ID</Label>
          <Input
            id="el-htms-id"
            value={attr.htmlId ?? ''}
            onChange={(e) =>
              updateElementAttributes(elementId, {
                htmlId: e.target.value.trim() || undefined,
              })
            }
            placeholder="e.g. hero-title"
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Tag</Label>
          <Select
            value={attr.tag && TAG_OPTIONS.some((t) => t.value === attr.tag) ? attr.tag : 'div'}
            onValueChange={(v) => updateElementAttributes(elementId, { tag: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              {TAG_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-2">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="el-vis" className="text-[10px]">Visibility</Label>
          <span className="text-[10px] text-muted-foreground">
            {visible ? 'Visible' : 'Hidden'}
          </span>
        </div>
        <Switch
          id="el-vis"
          checked={visible}
          onCheckedChange={(checked) =>
            updateElementAttributes(elementId, {
              visibility: checked ? 'visible' : 'hidden',
            })
          }
        />
      </div>
    </div>
  )
}
