'use client'

import type { CSSProperties } from 'react'
import React, { memo, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@workspace/ui/lib/utils'
import { ColumnOverlay } from '@/components/website-builder/canvas/column-overlay'
import {
  useTreeNodeDnd,
  useDroppableEmptySlot,
} from '@/components/website-builder/dnd/use-tree-node-dnd'
import { useFreePositionDrag } from '@/components/website-builder/dnd/use-free-position-drag'
import { useMergedRefs } from '@/components/website-builder/dnd/use-merged-refs'
import { useDropEdge } from '@/components/dnd/dnd-provider'
import { DndDropIndicator } from '@/components/dnd/dnd-drop-indicator'
import { DndHandle, DndHandleProvider } from '@/components/dnd/dnd-handle'
import { dragStateAttrs } from '@/components/dnd/dnd-sortable-item'
import type { SlotRule } from '@/lib/builder/dnd/types'
import { useBuilderStore } from '@/lib/builder/store'
import type { ElementChromeAttributes } from '@/components/sections/registry.types'
import {
  componentStyleToCss,
  getEffectiveComponentStyleForBreakpoint,
} from '@/lib/builder/component-style'
import { collectStateCss } from '@/lib/builder/component-style-states'
import type { ComponentNode, ShadcnComponentType } from '@/lib/builder/component-node'
import { defaultTagForComponentType, isContainerType } from '@/lib/builder/component-node'
import { emptyLabelFor } from '@/lib/builder/dnd/rules'
import {
  DROP_COUNT_ATTR,
  DROP_TARGET_ATTR,
  DROP_TYPE_ATTR,
} from '@/lib/builder/dnd/pointer-target'
import { emptySlotId } from '@/lib/builder/dnd/ids'
import { QuickAddButton } from '@/components/website-builder/insert/quick-add-button'
import { elementVisualDefaults } from '@/lib/builder/node-visual-defaults'
import { usePublicSiteContext } from '@/components/website-builder/public-site-context'
import { PublicContactForm } from '@/components/forms/public-contact-form'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import { SectionLink } from '@/components/website-builder/section-link'
import { linkValueFromProp } from '@/lib/builder/links'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Label } from '@workspace/ui/components/label'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { InlineEditableText } from '@/components/website-builder/inline-editable'
import { resolveSectionMediaUrl } from '@/lib/builder/section-navigation'
import { isOptimizableImageSrc } from '@/components/sections/optimized-image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@workspace/ui/components/carousel'
import { Calendar } from '@workspace/ui/components/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
} from '@workspace/ui/components/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { Progress } from '@workspace/ui/components/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'

import type { VisualDefaultsDesignSystem } from '@/lib/builder/node-visual-defaults'

function mergeVisualStyle (
  node: ComponentNode,
  deviceMode: 'desktop' | 'tablet' | 'mobile',
  ds?: VisualDefaultsDesignSystem
): Record<string, unknown> {
  const defaults = elementVisualDefaults(node.type, deviceMode, ds)
  const effectiveStyle = getEffectiveComponentStyleForBreakpoint(
    node.style,
    {},
    node.breakpointStyles,
    deviceMode
  )
  const base = {
    ...defaults,
    ...componentStyleToCss(effectiveStyle),
  } as Record<string, unknown>

  // Apply layout-mode positioning on top of style
  if (node.layout === 'absolute') {
    base.position = 'absolute'
    if (effectiveStyle.absX != null) base.left = `${effectiveStyle.absX}px`
    if (effectiveStyle.absY != null) base.top = `${effectiveStyle.absY}px`
  }

  return base
}

/** Stable empty map for the builder path, which selects attributes per node. */
const NO_ATTRIBUTES: Record<string, ElementChromeAttributes> = {}

/** Root of every tree path — shared so memoized nodes keep stable props. */
const EMPTY_PATH: readonly string[] = []

/**
 * Nodes whose rendered body is itself an interactive control (or a link, which
 * the browser would drag natively) move by a visible handle instead of their
 * body, so clicking/typing into them keeps working.
 */
const HANDLE_TYPES: ReadonlySet<ShadcnComponentType> = new Set<ShadcnComponentType>([
  'button',
  'input',
  'textarea',
  'colorInput',
  'radio',
  'search',
  'map',
  'link',
  'linkBlock',
  'textLink',
])

/**
 * The drop indicator of one target, in its own component: an edge change
 * re-renders this span alone, never the node or its subtree.
 */
function TargetDropIndicator ({ id }: { id: string }) {
  // Editor chrome inside a section: opted out of the DOM instrumentation pass.
  return <DndDropIndicator edge={useDropEdge(id)} data-no-instrument="" />
}

/**
 * The "Drop elements here" surface inside an empty container.
 *
 * A real droppable, and the smallest target under the pointer, so it beats
 * the container it sits in: when a user aims at a visible empty slot there is
 * no ambiguity about intent.
 */
function EmptyDropSlot ({
  sectionId,
  nodeId,
  nodeType,
  path,
}: {
  sectionId: string
  nodeId: string
  nodeType: ShadcnComponentType
  path: readonly string[]
}) {
  const id = emptySlotId(sectionId, nodeId)
  const { ref, isDropTarget } = useDroppableEmptySlot({ sectionId, nodeId, nodeType, path })
  return (
    <span
      ref={ref}
      {...dragStateAttrs({ isDropTarget })}
      // The pointer hit-test reads these to decide whether to draw the rejection
      // state; see `lib/builder/dnd/pointer-target.ts`.
      {...{
        [DROP_TARGET_ATTR]: id,
        [DROP_TYPE_ATTR]: nodeType,
        [DROP_COUNT_ATTR]: '0',
      }}
      // `relative` anchors the Quick Add button and the indicator.
      className={cn(
        'group/slot relative flex min-h-[52px] w-full select-none items-center justify-center gap-1.5 rounded border border-dashed px-2 py-3 text-center text-[10px] font-medium transition-colors',
        'border-muted-foreground/35 bg-muted/15 text-muted-foreground',
        'data-[drop-target]:border-primary/60 data-[drop-target]:bg-primary/10 data-[drop-target]:text-primary'
      )}
    >
      {/* Policy-derived copy: "Drop list items here", "Drop form fields here"… */}
      {emptyLabelFor(nodeType)}
      {/* Hidden mid-drag: a button under the cursor would fight the drop target. */}
      {!isDropTarget && (
        <span className="opacity-0 transition-opacity group-hover/slot:opacity-100">
          <QuickAddButton target={{ sectionId, parentId: nodeId }} />
        </span>
      )}
      <TargetDropIndicator id={id} />
    </span>
  )
}

type TreeNodeElementProps = {
  sectionId: string
  node: ComponentNode
  /** Parent component node id, or null for roots (used by sortable / drag metadata). */
  parentId?: string | null
  /** Nesting level. */
  depth: number
  /** Ids from the tree root down to (and including) this node. */
  path: readonly string[]
  isPreview: boolean
  elementAttributes: Record<string, ElementChromeAttributes>
  deviceMode: 'desktop' | 'tablet' | 'mobile'
  /** Public/preview render: no DnD hooks in subtree. */
  staticTree: boolean
  /**
   * This node's chrome attributes, selected individually in the builder path.
   * Falls back to `elementAttributes` for static/public rendering, which has no
   * store to select from.
   */
  attr?: ElementChromeAttributes
}

function buttonVariantFromProps (v: unknown): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' {
  const s = typeof v === 'string' ? v : 'default'
  if (s === 'destructive' || s === 'outline' || s === 'secondary' || s === 'ghost' || s === 'link') return s
  return 'default'
}

function TreeNodeElement ({
  sectionId,
  node,
  depth,
  path,
  isPreview,
  elementAttributes,
  deviceMode,
  staticTree,
  attr: attrFromParent,
}: TreeNodeElementProps) {
  const updateComponentNodeProps = useBuilderStore((s) => s.updateComponentNodeProps)
  const canEditText = !isPreview && !staticTree
  const commitText = (next: string) => {
    updateComponentNodeProps(sectionId, node.id, { text: next })
  }

  const elementId = `${sectionId}::${node.id}`
  // Hover-preview: only image nodes subscribe; null for all others (no extra re-renders)
  const imagePreviewUrl = useBuilderStore((s) =>
    !isPreview && !staticTree && node.type === 'image' && s.imagePreviewFor?.elementId === elementId
      ? s.imagePreviewFor.url
      : null
  )
  // Design system: prefer public site context (published), fall back to builder store
  const publicSite = usePublicSiteContext()
  const storeDs = useBuilderStore((s) => s.designSystem)
  const ds = publicSite?.designSystem ?? storeDs

  const attr = attrFromParent ?? elementAttributes[elementId]
  const tag = attr?.tag ?? defaultTagForComponentType(node.type)
  const hidden = attr?.visibility === 'hidden'

  const style = useMemo(
    () => mergeVisualStyle(node, deviceMode, ds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node, deviceMode, ds?.spacing?.containerMaxWidth, ds?.spacing?.sectionPaddingY, ds?.spacing?.borderRadius, ds?.typography?.baseFontSize, ds?.typography?.scaleRatio]
  ) as CSSProperties

  if (hidden) {
    style.display = 'none'
  }

  const common = {
    'data-element-id': elementId,
    'data-builder-tag': tag,
    className: cn(!isPreview && 'outline-offset-1'),
    style,
    ...(attr?.htmlId ? { id: attr.htmlId } : {}),
  }

  const childPropsForKids = {
    sectionId,
    isPreview,
    elementAttributes,
    deviceMode,
    parentId: node.id,
    parentType: node.type,
    parentPath: path,
    depth: depth + 1,
  }

  const Child = staticTree ? StaticTreeNode : BuilderTreeNode
  const kidsInner = node.children.map((c, childIndex) => (
    <Child key={c.id} {...childPropsForKids} node={c} index={childIndex} />
  ))

  const kids = kidsInner

  const emptySlot =
    isContainerType(node.type) && !isPreview && !staticTree && node.children.length === 0 ? (
      <EmptyDropSlot sectionId={sectionId} nodeId={node.id} nodeType={node.type} path={path} />
    ) : null

  switch (node.type) {
    case 'section':
      return (
        <section {...common}>
          {emptySlot}
          {kids}
        </section>
      )
    case 'text':
      return (
        <span {...common}>
          {canEditText ? (
            <InlineEditableText
              as="span"
              value={String(node.props.text ?? '')}
              onChange={commitText}
              onCommit={commitText}
              isPreview={false}
              className="inline-block min-h-[1em] min-w-[1ch]"
            />
          ) : (
            String(node.props.text ?? '')
          )}
        </span>
      )
    case 'heading': {
      const level = Number(node.props.level ?? 2)
      const lv = Math.min(6, Math.max(1, level))
      const H = (`h${lv}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
      return (
        <H {...common}>
          {canEditText ? (
            <InlineEditableText
              as="span"
              value={String(node.props.text ?? '')}
              onChange={commitText}
              onCommit={commitText}
              isPreview={false}
              className="inline-block min-h-[1em] min-w-[1ch]"
            />
          ) : (
            String(node.props.text ?? '')
          )}
        </H>
      )
    }
    case 'button': {
      const linkRaw = node.props.link ?? node.props.href
      const href = linkRaw != null ? String(linkRaw).trim() : ''
      const target = node.props.target != null ? String(node.props.target) : undefined
      const rel = node.props.rel != null ? String(node.props.rel) : undefined
      const btnText = String(node.props.text ?? 'Button')
      if (href || node.props.link) {
        const linkPreview = staticTree || isPreview
        return (
          <Button variant={buttonVariantFromProps(node.props.variant)} asChild>
            <SectionLink
              link={linkValueFromProp(linkRaw, '#')}
              isPreview={linkPreview}
              target={target as '_self' | '_blank' | undefined}
              rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
              data-element-id={elementId}
              data-builder-tag={tag}
              id={attr?.htmlId}
              className={cn(common.className)}
              style={common.style as CSSProperties}
            >
              {canEditText ? (
                <InlineEditableText
                  as="span"
                  value={btnText}
                  onChange={commitText}
                  onCommit={commitText}
                  isPreview={false}
                  className="inline-block min-h-[1em]"
                />
              ) : (
                btnText
              )}
            </SectionLink>
          </Button>
        )
      }
      return (
        <Button
          type="button"
          variant={buttonVariantFromProps(node.props.variant)}
          data-element-id={elementId}
          data-builder-tag={tag}
          id={attr?.htmlId}
          className={cn(common.className)}
          style={common.style as CSSProperties}
        >
          {canEditText ? (
            <InlineEditableText
              as="span"
              value={btnText}
              onChange={commitText}
              onCommit={commitText}
              isPreview={false}
              className="inline-block min-h-[1em]"
            />
          ) : (
            btnText
          )}
        </Button>
      )
    }
    case 'image': {
      const w = node.props.width
      const h = node.props.height
      const widthAttr =
        w != null && String(w).trim() !== ''
          ? (Number.isFinite(Number(w)) ? Number(w) : String(w))
          : undefined
      const heightAttr =
        h != null && String(h).trim() !== ''
          ? (Number.isFinite(Number(h)) ? Number(h) : String(h))
          : undefined
      const resolvedSrc = imagePreviewUrl ?? resolveSectionMediaUrl(String(node.props.src ?? ''))
      const onPublic = publicSite != null || isPreview
      const widthNum = typeof widthAttr === 'number' ? widthAttr : Number(widthAttr)
      const heightNum = typeof heightAttr === 'number' ? heightAttr : Number(heightAttr)
      const hasExplicitDims =
        Number.isFinite(widthNum) && Number.isFinite(heightNum) && widthNum > 0 && heightNum > 0

      if (onPublic && hasExplicitDims && !imagePreviewUrl && isOptimizableImageSrc(resolvedSrc)) {
        return (
          <Image
            src={resolvedSrc}
            alt={String(node.props.alt ?? '')}
            width={widthNum}
            height={heightNum}
            data-element-id={elementId}
            data-builder-tag={tag}
            id={attr?.htmlId}
            className={cn(common.className)}
            style={common.style as CSSProperties}
          />
        )
      }

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...common}
          src={resolvedSrc}
          alt={String(node.props.alt ?? '')}
          width={widthAttr as number | string | undefined}
          height={heightAttr as number | string | undefined}
          className={cn(common.className, imagePreviewUrl && 'ring-2 ring-primary/60')}
        />
      )
    }
    case 'icon': {
      const iconName = String(node.props.iconName ?? 'star')
      const sizeRaw = node.props.size
      const size =
        sizeRaw != null && Number.isFinite(Number(sizeRaw)) ? Number(sizeRaw) : 24
      const color =
        node.props.color != null && String(node.props.color).trim() !== ''
          ? String(node.props.color)
          : undefined
      const strokeRaw = node.props.strokeWidth
      const strokeWidth =
        strokeRaw != null && Number.isFinite(Number(strokeRaw)) ? Number(strokeRaw) : 2
      const rotationRaw = node.props.rotation
      const rotation =
        rotationRaw != null && Number.isFinite(Number(rotationRaw)) ? Number(rotationRaw) : 0
      const iconStyle: CSSProperties = rotation ? { transform: `rotate(${rotation}deg)` } : {}
      return (
        <span {...common} className={cn(common.className, 'inline-flex w-fit')}>
          <LucideIcon
            name={iconName}
            size={size}
            color={color}
            strokeWidth={strokeWidth}
            style={iconStyle}
          />
        </span>
      )
    }
    case 'label':
      return (
        <Label
          data-element-id={elementId}
          data-builder-tag={tag}
          id={attr?.htmlId}
          className={cn(common.className)}
          style={common.style as CSSProperties}
        >
          {canEditText ? (
            <InlineEditableText
              as="span"
              value={String(node.props.text ?? '')}
              onChange={commitText}
              onCommit={commitText}
              isPreview={false}
              className="inline-block min-h-[1em]"
            />
          ) : (
            String(node.props.text ?? '')
          )}
        </Label>
      )
    case 'input':
    case 'radio':
    case 'search': {
      const p = node.props as Record<string, unknown>
      return (
        <Input
          {...common}
          type={String(p.type ?? 'text')}
          name={p.name != null ? String(p.name) : undefined}
          placeholder={p.placeholder != null ? String(p.placeholder) : undefined}
          defaultValue={p.value != null ? String(p.value) : undefined}
          readOnly={!isPreview}
          className={cn(common.className)}
        />
      )
    }
    case 'checkbox': {
      const p = node.props as Record<string, unknown>
      return (
        <div
          data-element-id={elementId}
          data-builder-tag={tag}
          id={attr?.htmlId}
          className={cn('flex items-center gap-2', common.className)}
          style={common.style as CSSProperties}
        >
          <Checkbox
            disabled={!isPreview}
            defaultChecked={Boolean(p.checked)}
          />
        </div>
      )
    }
    case 'colorInput': {
      const p = node.props as Record<string, unknown>
      return (
        <Input
          {...common}
          type="color"
          className={cn('h-9 w-14 cursor-pointer p-1', common.className)}
          defaultValue={p.value != null ? String(p.value) : '#000000'}
          readOnly={!isPreview}
        />
      )
    }
    case 'textarea':
      return (
        <Textarea
          {...common}
          readOnly={!isPreview}
          className={cn(common.className)}
          placeholder={String(node.props.placeholder ?? '')}
        />
      )
    case 'select':
      return (
        <div
          data-element-id={elementId}
          data-builder-tag={tag}
          id={attr?.htmlId}
          className={cn('min-w-[8rem]', common.className)}
          style={common.style as CSSProperties}
        >
          <Select disabled={!isPreview} defaultValue="opt1">
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    case 'video':
      return (
        <video
          {...common}
          controls={Boolean(node.props.controls)}
          autoPlay={Boolean(node.props.autoplay)}
          muted={Boolean(node.props.autoplay)}
          src={String(node.props.src ?? '')}
        />
      )
    case 'map':
      return (
        <iframe
          {...common}
          title={String(node.props.title ?? 'Map')}
          className={cn('min-h-[200px] w-full border-0', common.className)}
          src={String(node.props.src ?? 'about:blank')}
        />
      )
    case 'customCode':
      return (
        <div {...common} className={cn('rounded border border-dashed border-muted-foreground/40 p-2 text-xs text-muted-foreground', common.className)}>
          {isPreview && node.props.html
            ? null
            : 'Custom code (preview on published site)'}
        </div>
      )
    case 'paragraph':
      return (
        <p {...common}>
          {emptySlot}
          {node.children.length > 0
            ? kids
            : canEditText
              ? (
                <InlineEditableText
                  as="span"
                  value={String(node.props.text ?? '')}
                  onChange={commitText}
                  onCommit={commitText}
                  isPreview={false}
                  className="inline-block min-h-[1em] min-w-[1ch]"
                />
                )
              : String(node.props.text ?? '')}
        </p>
      )
    case 'blockQuote':
      return (
        <blockquote {...common}>
          {emptySlot}
          {kids}
        </blockquote>
      )
    case 'linkBlock':
    case 'textLink': {
      const linkPreview = staticTree || isPreview
      return (
        <SectionLink
          {...common}
          link={linkValueFromProp(node.props.link ?? node.props.href ?? '#')}
          isPreview={linkPreview}
        >
          {node.children.length > 0
            ? kids
            : canEditText
              ? (
                <InlineEditableText
                  as="span"
                  value={String(node.props.text ?? '')}
                  onChange={commitText}
                  onCommit={commitText}
                  isPreview={false}
                  className="inline-block min-h-[1em] min-w-[1ch]"
                />
                )
              : String(node.props.text ?? '')}
        </SectionLink>
      )
    }
    case 'list':
      return (
        <ul {...common} className={cn('list-disc ps-5', common.className)}>
          {emptySlot}
          {kids}
        </ul>
      )
    case 'listItem':
      return (
        <li {...common}>
          {emptySlot}
          {kids}
        </li>
      )
    case 'form':
      if (staticTree && isPreview) {
        return (
          <PublicContactForm {...common}>
            {emptySlot}
            {kids}
          </PublicContactForm>
        )
      }
      return (
        <form {...common} onSubmit={(e) => e.preventDefault()}>
          {emptySlot}
          {kids}
        </form>
      )
    case 'shadcn-accordion':
      return (
        <div {...common} data-shadcn-interactive="">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Accordion Item</AccordionTrigger>
              <AccordionContent>
                {emptySlot}
                {kids}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    case 'shadcn-carousel':
      return (
        <div {...common} data-shadcn-interactive="">
          <Carousel className="w-full">
            <CarouselContent>
              {node.children.length > 0 ? (
                // Each direct child renders as one slide (both canvas + public).
                node.children.map((c, childIndex) => (
                  <CarouselItem key={c.id}>
                    <Child {...childPropsForKids} node={c} index={childIndex} />
                  </CarouselItem>
                ))
              ) : (
                <>
                  <CarouselItem>
                    <div className="flex min-h-[80px] items-center justify-center rounded border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
                      Slide 1
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="flex min-h-[80px] items-center justify-center rounded border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
                      Slide 2
                    </div>
                  </CarouselItem>
                </>
              )}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )
    case 'shadcn-calendar':
      return (
        <div {...common} data-shadcn-interactive="">
          <Calendar mode="single" className="rounded-md border" />
        </div>
      )
    case 'shadcn-dialog':
      return (
        <div {...common} data-shadcn-interactive="">
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="rounded-md border border-border bg-card px-4 py-2 text-sm">
                {String(node.props.triggerLabel ?? 'Open Dialog')}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      )
    case 'shadcn-badge':
      return (
        <div {...common} data-shadcn-interactive="">
          <Badge variant={(node.props.variant as 'default' | 'secondary' | 'destructive' | 'outline') ?? 'default'}>
            {String(node.props.text ?? 'Badge')}
          </Badge>
        </div>
      )
    case 'shadcn-card': {
      const hasKids = node.children.length > 0
      // Empty cards are a common AI artifact between heading/body siblings — hide on canvas.
      if (!hasKids) return null
      return (
        <div {...common} data-shadcn-interactive="">
          <Card className="h-full border-border/60 bg-card shadow-sm">
            <CardContent className="flex flex-col gap-3 p-6">{kids}</CardContent>
          </Card>
        </div>
      )
    }
    case 'shadcn-tabs':
      return (
        <div {...common} data-shadcn-interactive="">
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              {emptySlot}
              {kids}
            </TabsContent>
            <TabsContent value="tab2">
              <span className="text-xs text-muted-foreground">Tab 2 content</span>
            </TabsContent>
          </Tabs>
        </div>
      )
    case 'shadcn-alert':
      return (
        <div {...common} data-shadcn-interactive="">
          <Alert>
            <AlertTitle>{String(node.props.title ?? 'Alert')}</AlertTitle>
            {node.props.description ? (
              <AlertDescription>{String(node.props.description)}</AlertDescription>
            ) : null}
          </Alert>
        </div>
      )
    case 'shadcn-avatar':
      return (
        <div {...common} data-shadcn-interactive="">
          <Avatar>
            <AvatarImage src={String(node.props.src ?? '')} alt="" />
            <AvatarFallback>{String(node.props.fallback ?? 'AB')}</AvatarFallback>
          </Avatar>
        </div>
      )
    case 'shadcn-progress':
      return (
        <div {...common} data-shadcn-interactive="">
          <Progress value={Number(node.props.value ?? 50)} className="w-full" />
        </div>
      )
    case 'shadcn-tooltip':
      return (
        <div {...common} data-shadcn-interactive="">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
                  {String(node.props.triggerLabel ?? 'Hover me')}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{String(node.props.content ?? 'Tooltip text')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    default:
      return (
        <div {...common}>
          {emptySlot}
          {kids}
        </div>
      )
  }
}

type BuilderTreeNodeProps = {
  sectionId: string
  node: ComponentNode
  /** Parent list: a node id, `null` for the section root, or a bucket parent (slot/injected host). */
  parentId: string | null
  /** Type of the list this node sits in; `null` at the root and in bucket lists. */
  parentType: ShadcnComponentType | null
  /** The parent slot's acceptance rule, when the parent list is a slot. */
  parentSlot?: SlotRule
  /** Ids from the tree root down to (and including) the parent. Memoized upstream. */
  parentPath: readonly string[]
  index: number
  depth: number
  isPreview: boolean
  elementAttributes: Record<string, ElementChromeAttributes>
  deviceMode: 'desktop' | 'tablet' | 'mobile'
  /** Extra classes for the drag wrapper (slot entries carry their layout class here). */
  wrapperClassName?: string
}

/**
 * A single editable node in a section's component tree.
 *
 * One wrapper element carries:
 * - the node's draggable + edge-aware droppable (`useTreeNodeDnd`)
 * - the free-position draggable, for absolutely positioned nodes
 * - a drag handle, when the node's body is an interactive control
 * - its own drop indicator, subscribed to the provider's edge store
 *
 * Memoized: the store uses Immer, so an untouched node keeps a stable
 * reference, and `parentPath` is memoized per parent — an indicator change or
 * an edit elsewhere never re-renders this subtree.
 */
const BuilderTreeNode = memo(function BuilderTreeNode (props: BuilderTreeNodeProps) {
  const { sectionId, node, isPreview } = props
  const isContainer = isContainerType(node.type)
  const isAbsoluteLayout = node.layout === 'absolute'
  const path = useMemo(() => [...props.parentPath, node.id], [props.parentPath, node.id])

  const dnd = useTreeNodeDnd({
    sectionId,
    nodeId: node.id,
    nodeType: node.type,
    parentId: props.parentId,
    parentType: props.parentType,
    parentSlot: props.parentSlot,
    path,
    childCount: node.children.length,
    // Absolutely positioned nodes are moved freely rather than re-parented;
    // letting both bind the same element is what used to make them fight.
    disabled: isPreview || isAbsoluteLayout,
  })

  const free = useFreePositionDrag({
    sectionId,
    nodeId: node.id,
    nodeType: node.type,
    enabled: !isPreview && isAbsoluteLayout,
  })

  const setRefs = useMergedRefs(dnd.ref, free.ref)
  const withHandle = !isPreview && HANDLE_TYPES.has(node.type)

  // Selected per node rather than threaded down as a map: passing the whole
  // `elementAttributes` object gives every node a new prop whenever any single
  // attribute changes, which would defeat the memo above.
  const attr = useBuilderStore((s) => s.elementAttributes[`${sectionId}::${node.id}`])

  return (
    <div
      ref={setRefs}
      // Only containers advertise themselves to the pointer hit-test — a leaf
      // node never "refuses" anything, it simply isn't a drop destination.
      {...(isContainer && !isPreview
        ? {
            [DROP_TARGET_ATTR]: dnd.id,
            [DROP_TYPE_ATTR]: node.type,
            [DROP_COUNT_ATTR]: String(node.children.length),
          }
        : {})}
      // Only the drag *source* state is read here (it flips twice per drag).
      // Hover state lives in <TargetDropIndicator>, so moving across targets
      // never re-renders a node.
      {...dragStateAttrs({ isDragSource: dnd.isDragSource || free.isDragSource })}
      className={cn(
        'group/node relative min-w-0 overflow-visible data-[drag-source]:opacity-40',
        !isPreview && !withHandle && 'cursor-grab active:cursor-grabbing',
        props.wrapperClassName
      )}
    >
      <TreeNodeElement {...props} path={path} staticTree={false} attr={attr} />
      {withHandle ? (
        <DndHandleProvider handleRef={isAbsoluteLayout ? free.handleRef : dnd.handleRef}>
          <DndHandle
            label={`Drag ${node.type}`}
            data-no-instrument=""
            className="absolute -top-2.5 -start-2.5 z-[61] size-5 border border-border bg-card opacity-0 shadow-sm transition-opacity group-hover/node:opacity-100 focus-visible:opacity-100"
          />
        </DndHandleProvider>
      ) : null}
      {!isPreview ? <TargetDropIndicator id={dnd.id} /> : null}
    </div>
  )
})

function StaticTreeNode (props: Omit<BuilderTreeNodeProps, 'parentPath'>) {
  return <TreeNodeElement {...props} path={EMPTY_PATH} staticTree />
}

export function ComponentTreeRenderer ({
  sectionId,
  tree,
  isPreview,
  rootParentId = null,
}: {
  sectionId: string
  tree: ComponentNode[]
  isPreview: boolean
  /**
   * The parent id of the tree's roots: `null` for a section's own tree, or an
   * injected host's bucket parent (`host:<local>`) when portaled into a JSX section.
   */
  rootParentId?: string | null
}) {
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  const showGridOverlay = useBuilderStore((s) => s.showGridOverlay)
  if (!tree.length) return null
  // Each BuilderTreeNode selects its own attributes from the store, so nothing
  // in the builder path reads this map — only the static renderer needs it.
  const childProps = {
    sectionId,
    isPreview,
    elementAttributes: NO_ATTRIBUTES,
    deviceMode,
    parentId: rootParentId,
    parentType: null as ShadcnComponentType | null,
    parentPath: EMPTY_PATH,
    depth: 0,
  }
  const roots = tree.map((n, index) => (
    <BuilderTreeNode key={n.id} {...childProps} node={n} index={index} />
  ))

  return (
    <div className="relative">
      <StateStyles nodes={tree} sectionId={sectionId} />
      {!isPreview && showGridOverlay && <ColumnOverlay />}
      {roots}
    </div>
  )
}

/**
 * The `:hover` / `::placeholder` / `::after` rules for a subtree.
 *
 * Inline styles cannot express a pseudo-class, so a node's state variants live
 * in its style data under `__states` and compile to rules scoped by element id.
 * Rendering them here — once per tree — is what lets a section keep its hover
 * affordances while still being nothing but data.
 */
function StateStyles ({
  nodes,
  sectionId,
}: {
  nodes: ComponentNode[]
  sectionId: string
}) {
  const css = collectStateCss(nodes, sectionId)
  if (!css) return null
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

export interface SlotNodeProps {
  sectionId: string
  node: ComponentNode
  /** The slot's pseudo-parent id (`slot:<slotId>`). */
  slotParentId: string
  /** The slot's acceptance rule — memoized by the slot (`useSlotRule`). */
  slotRule: SlotRule
  index: number
  isPreview: boolean
  /** The slot's per-entry layout class, applied to the node's drag wrapper. */
  className?: string
}

/**
 * One free element living inside a schema section's slot.
 *
 * Slots interleave schema blocks with user-dropped elements, so each element is
 * rendered on its own rather than as a list — `ComponentTreeRenderer`'s wrapping
 * `<div className="relative">` would otherwise break the slot's flex/grid flow.
 *
 * `parentId` is the slot's pseudo-parent (`slot:<slotId>`); acceptance comes
 * from the slot's rule, since a slot is not a `ComponentNode`.
 */
export function SlotNodeRenderer ({
  sectionId,
  node,
  slotParentId,
  slotRule,
  index,
  isPreview,
  className,
}: SlotNodeProps) {
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  return (
    <BuilderTreeNode
      sectionId={sectionId}
      node={node}
      parentId={slotParentId}
      parentType={null}
      parentSlot={slotRule}
      parentPath={EMPTY_PATH}
      index={index}
      depth={0}
      isPreview={isPreview}
      elementAttributes={NO_ATTRIBUTES}
      deviceMode={deviceMode}
      wrapperClassName={className}
    />
  )
}

/** Public-site counterpart — no store reads, no dnd-kit hooks. */
export function StaticSlotNodeRenderer ({
  sectionId,
  node,
  elementAttributes = NO_ATTRIBUTES,
  deviceMode = 'desktop',
}: {
  sectionId: string
  node: ComponentNode
  elementAttributes?: Record<string, ElementChromeAttributes>
  deviceMode?: 'desktop' | 'tablet' | 'mobile'
}) {
  return (
    <StaticTreeNode
      sectionId={sectionId}
      node={node}
      parentId={null}
      parentType={null}
      index={0}
      depth={0}
      isPreview
      elementAttributes={elementAttributes}
      deviceMode={deviceMode}
    />
  )
}

export function StaticComponentTreeRenderer ({
  sectionId,
  tree,
  isPreview = false,
  elementAttributes = {},
  deviceMode = 'desktop',
}: {
  sectionId: string
  tree: ComponentNode[]
  isPreview?: boolean
  elementAttributes?: Record<string, ElementChromeAttributes>
  deviceMode?: 'desktop' | 'tablet' | 'mobile'
}) {
  if (!tree.length) return null
  const childProps = {
    sectionId,
    isPreview,
    elementAttributes,
    deviceMode,
    parentId: null as string | null,
    parentType: null as ShadcnComponentType | null,
    depth: 0,
  }
  return (
    <div className="contents">
      <StateStyles nodes={tree} sectionId={sectionId} />
      {tree.map((n) => (
        <StaticTreeNode key={n.id} {...childProps} node={n} index={0} />
      ))}
    </div>
  )
}
