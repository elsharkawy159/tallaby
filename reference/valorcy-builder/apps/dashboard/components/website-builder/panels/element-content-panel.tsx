'use client'

import { useMemo, useState } from 'react'
import { ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Switch } from '@workspace/ui/components/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { useBuilderStore } from '@/lib/builder/store'
import { findComponentNodeInTree } from '@/lib/builder/find-tree-node'
import { MediaLibraryDialog } from '@/components/website-builder/media/media-library-dialog'
import { rewriteElementTextAction } from '@/actions/website-ai-section-actions'
import { IconPicker } from '@/components/website-builder/icons/icon-picker'
import { ColorInput, NumberField, LinkPicker } from '@/components/website-builder/controls'

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

const TEXT_NODE_TYPES = ['text', 'label', 'paragraph', 'heading', 'button', 'linkBlock', 'textLink']

/** Copy / media fields for component-tree nodes; stays in sync with canvas via store + updateComponentNodeProps. */
export function ElementContentPanel ({ elementId }: Props) {
  const projectId = useBuilderStore((s) => s.projectId)
  const builderLocale = useBuilderStore((s) => s.builderLocale)
  const sections = useBuilderStore((s) => s.sections)
  const updateComponentNodeProps = useBuilderStore((s) => s.updateComponentNodeProps)

  const [mediaOpen, setMediaOpen] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState(false)

  const { sectionInstId, nodeId } = parseElementId(elementId)
  const node = useMemo(() => {
    const section = sections.find((x) => x.id === sectionInstId)
    if (!section?.componentTree || !nodeId) return undefined
    return findComponentNodeInTree(section.componentTree, nodeId)
  }, [sections, sectionInstId, nodeId])

  const sectionId = useMemo(
    () => sections.find((x) => x.id === sectionInstId)?.sectionId ?? '',
    [sections, sectionInstId]
  )

  const patchProps = (patch: Record<string, unknown>) => {
    if (!sectionInstId || !nodeId) return
    updateComponentNodeProps(sectionInstId, nodeId, patch)
  }

  async function handleRewriteText () {
    if (!node || !projectId) return
    const currentText = String((node.props as Record<string, unknown>).text ?? '')
    if (!currentText.trim()) return
    setRewriteLoading(true)
    try {
      const result = await rewriteElementTextAction({
        projectId,
        sectionId,
        nodeType: node.type,
        currentText,
        locale: builderLocale,
      })
      if ('error' in result) {
        toast.error(result.error)
      } else {
        patchProps({ text: result.text })
        toast.success('Text rewritten.')
      }
    } catch {
      toast.error('Failed to rewrite text.')
    } finally {
      setRewriteLoading(false)
    }
  }

  const p = (node?.props ?? {}) as Record<string, unknown>

  if (!node) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">
        Could not find this element in the component tree.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-1 py-2 text-xs">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {node.type} · content
      </p>

      {projectId && TEXT_NODE_TYPES.includes(node.type) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-2 text-xs"
          disabled={rewriteLoading}
          onClick={handleRewriteText}
        >
          {rewriteLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Rewrite with AI
        </Button>
      )}

      {(node.type === 'text' || node.type === 'label') && (
        <div className="space-y-1">
          <Label htmlFor="ec-text" className="text-[10px]">Text</Label>
          <Textarea
            id="ec-text"
            className="min-h-[72px] text-xs"
            value={String(p.text ?? '')}
            onChange={(e) => patchProps({ text: e.target.value })}
          />
        </div>
      )}

      {node.type === 'paragraph' && (
        <div className="space-y-1">
          <Label htmlFor="ec-paragraph" className="text-[10px]">Paragraph</Label>
          <Textarea
            id="ec-paragraph"
            className="min-h-[96px] text-xs"
            value={String(p.text ?? '')}
            onChange={(e) => patchProps({ text: e.target.value })}
            placeholder="Text when the paragraph has no inner elements"
          />
        </div>
      )}

      {node.type === 'heading' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Level</Label>
            <Select
              value={String(p.level ?? 2)}
              onValueChange={(v) => patchProps({ level: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>H{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-hd-text" className="text-[10px]">Text</Label>
            <Textarea
              id="ec-hd-text"
              className="min-h-[72px] text-xs"
              value={String(p.text ?? '')}
              onChange={(e) => patchProps({ text: e.target.value })}
            />
          </div>
        </div>
      )}

      {node.type === 'button' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="ec-btn-text" className="text-[10px]">Button text</Label>
            <Input
              id="ec-btn-text"
              className="h-8 text-xs"
              value={String(p.text ?? '')}
              onChange={(e) => patchProps({ text: e.target.value })}
            />
          </div>
          <LinkPicker
            id="ec-btn-href"
            label="Link"
            value={p.href ?? p.link ?? ''}
            onChange={(next) => {
              if (typeof next === 'string') {
                patchProps({ href: next || undefined, link: undefined })
                return
              }
              patchProps({ href: next.href, link: next })
            }}
          />
          <div className="space-y-1">
            <Label className="text-[10px]">Open in</Label>
            <Select
              value={String(p.target ?? '_self')}
              onValueChange={(v) => patchProps({ target: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same tab</SelectItem>
                <SelectItem value="_blank">New tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(node.type === 'linkBlock' || node.type === 'textLink') && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="ec-a-text" className="text-[10px]">Link text</Label>
            <Textarea
              id="ec-a-text"
              className="min-h-[56px] text-xs"
              value={String(p.text ?? '')}
              onChange={(e) => patchProps({ text: e.target.value })}
            />
          </div>
          <LinkPicker
            id="ec-a-href"
            label="URL"
            value={p.href ?? p.link ?? ''}
            onChange={(next) => {
              if (typeof next === 'string') {
                patchProps({ href: next, link: undefined })
                return
              }
              patchProps({ href: next.href, link: next })
            }}
          />
          <div className="space-y-1">
            <Label className="text-[10px]">Target</Label>
            <Select
              value={String(p.target ?? '_self')}
              onValueChange={(v) => patchProps({ target: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same tab</SelectItem>
                <SelectItem value="_blank">New tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {node.type === 'image' && projectId && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Image</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-2 text-xs"
              onClick={() => setMediaOpen(true)}
            >
              <ImageIcon className="size-3.5" />
              Choose from library
            </Button>
            <MediaLibraryDialog
              open={mediaOpen}
              onOpenChange={setMediaOpen}
              projectId={projectId}
              previousUrl={String(p.src ?? '')}
              onCommit={(url) => patchProps({ src: url })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-img-src" className="text-[10px]">Image URL</Label>
            <Input
              id="ec-img-src"
              className="h-8 font-mono text-[10px]"
              value={String(p.src ?? '')}
              onChange={(e) => patchProps({ src: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-img-alt" className="text-[10px]">Alt text</Label>
            <Input
              id="ec-img-alt"
              className="h-8 text-xs"
              value={String(p.alt ?? '')}
              onChange={(e) => patchProps({ alt: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="ec-img-w" className="text-[10px]">Width</Label>
              <Input
                id="ec-img-w"
                className="h-8 text-xs"
                value={p.width != null ? String(p.width) : ''}
                onChange={(e) => patchProps({ width: e.target.value.trim() || undefined })}
                placeholder="e.g. 320"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ec-img-h" className="text-[10px]">Height</Label>
              <Input
                id="ec-img-h"
                className="h-8 text-xs"
                value={p.height != null ? String(p.height) : ''}
                onChange={(e) => patchProps({ height: e.target.value.trim() || undefined })}
                placeholder="e.g. 240"
              />
            </div>
          </div>
        </div>
      )}

      {node.type === 'image' && !projectId && (
        <p className="text-[10px] text-muted-foreground">Save the project to use the media library.</p>
      )}

      {node.type === 'icon' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Icon</Label>
            <IconPicker
              value={String(p.iconName ?? 'star')}
              onChange={(name) => patchProps({ iconName: name })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Size (px)"
              value={p.size != null ? String(p.size) : '24'}
              onValueChange={(v) => patchProps({ size: v.trim() === '' ? undefined : Number(v) })}
              min={8}
              max={512}
              step={1}
            />
            <NumberField
              label="Stroke width"
              value={p.strokeWidth != null ? String(p.strokeWidth) : '2'}
              onValueChange={(v) => patchProps({ strokeWidth: v.trim() === '' ? undefined : Number(v) })}
              min={0.5}
              max={4}
              step={0.25}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Rotation (°)"
              value={p.rotation != null ? String(p.rotation) : '0'}
              onValueChange={(v) => patchProps({ rotation: v.trim() === '' ? undefined : Number(v) })}
              min={-180}
              max={180}
              step={1}
            />
            <ColorInput
              label="Color"
              value={p.color != null ? String(p.color) : ''}
              onValueChange={(v) => patchProps({ color: v.trim() === '' ? undefined : v })}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Opacity, alignment, margin &amp; padding are in the Style tab. Leave color empty to inherit text color.
          </p>
        </div>
      )}

      {(node.type === 'input' || node.type === 'search' || node.type === 'radio') && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="ec-inp-type" className="text-[10px]">Input type</Label>
            <Input
              id="ec-inp-type"
              className="h-8 font-mono text-xs"
              value={String(p.type ?? 'text')}
              onChange={(e) => patchProps({ type: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-inp-ph" className="text-[10px]">Placeholder</Label>
            <Input
              id="ec-inp-ph"
              className="h-8 text-xs"
              value={String(p.placeholder ?? '')}
              onChange={(e) => patchProps({ placeholder: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-inp-name" className="text-[10px]">Name</Label>
            <Input
              id="ec-inp-name"
              className="h-8 font-mono text-xs"
              value={String(p.name ?? '')}
              onChange={(e) => patchProps({ name: e.target.value.trim() || undefined })}
            />
          </div>
        </div>
      )}

      {node.type === 'textarea' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="ec-ta-ph" className="text-[10px]">Placeholder</Label>
            <Input
              id="ec-ta-ph"
              className="h-8 text-xs"
              value={String(p.placeholder ?? '')}
              onChange={(e) => patchProps({ placeholder: e.target.value })}
            />
          </div>
        </div>
      )}

      {node.type === 'video' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="ec-vid-src" className="text-[10px]">Video URL</Label>
            <Input
              id="ec-vid-src"
              className="h-8 font-mono text-[10px]"
              value={String(p.src ?? '')}
              onChange={(e) => patchProps({ src: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
            <Label htmlFor="ec-vid-ctrl" className="text-[10px]">Controls</Label>
            <Switch
              id="ec-vid-ctrl"
              checked={Boolean(p.controls !== false)}
              onCheckedChange={(c) => patchProps({ controls: c })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
            <Label htmlFor="ec-vid-autoplay" className="text-[10px]">Autoplay</Label>
            <Switch
              id="ec-vid-autoplay"
              checked={Boolean(p.autoplay)}
              onCheckedChange={(c) => patchProps({ autoplay: c })}
            />
          </div>
        </div>
      )}

      {node.type === 'customCode' && (
        <div className="space-y-1">
          <Label htmlFor="ec-custom-html" className="text-[10px]">HTML</Label>
          <Textarea
            id="ec-custom-html"
            className="min-h-[120px] font-mono text-[10px]"
            value={String(p.html ?? '')}
            onChange={(e) => patchProps({ html: e.target.value })}
            placeholder="<div>…</div>"
          />
        </div>
      )}

      {node.type === 'map' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="ec-map-src" className="text-[10px]">Embed URL</Label>
            <Input
              id="ec-map-src"
              className="h-8 font-mono text-[10px]"
              value={String(p.src ?? '')}
              onChange={(e) => patchProps({ src: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ec-map-title" className="text-[10px]">Title</Label>
            <Input
              id="ec-map-title"
              className="h-8 text-xs"
              value={String(p.title ?? '')}
              onChange={(e) => patchProps({ title: e.target.value })}
            />
          </div>
        </div>
      )}

      {![
        'text',
        'label',
        'paragraph',
        'heading',
        'button',
        'linkBlock',
        'textLink',
        'image',
        'icon',
        'input',
        'search',
        'radio',
        'textarea',
        'video',
        'map',
        'customCode',
      ].includes(node.type) && (
        <p className="text-sm text-muted-foreground">
          This element type has no dedicated content fields here. Use Settings or edit nested elements on the canvas.
        </p>
      )}
    </div>
  )
}
