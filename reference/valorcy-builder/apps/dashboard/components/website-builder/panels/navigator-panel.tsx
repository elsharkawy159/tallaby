'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, Eye, EyeOff, FileJson, GripVertical } from 'lucide-react'
import { useSortableSection } from '@/components/website-builder/dnd/use-section-dnd'
import { useTreeNodeDnd } from '@/components/website-builder/dnd/use-tree-node-dnd'
import { useDropEdge } from '@/components/dnd/dnd-provider'
import { DndDropIndicator } from '@/components/dnd/dnd-drop-indicator'
import { dragStateAttrs } from '@/components/dnd/dnd-sortable-item'
import type { SectionDefinition, SectionInstance } from '@/components/sections/registry.types'
import { resolveSlotEntries } from '@/components/sections/schema/slot-entries'
import { slotHostElementId, slotParentId } from '@/lib/builder/dnd/ids'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@workspace/ui/lib/utils'
import { useBuilderStore } from '@/lib/builder/store'
import { sectionRegistry } from '@/components/sections'
import type { ComponentNode, ShadcnComponentType } from '@/lib/builder/component-node'
import { defaultTagForComponentType } from '@/lib/builder/component-node'

const TEXT_NODE_TYPES = new Set<ShadcnComponentType>([
  'text',
  'heading',
  'paragraph',
  'blockQuote',
  'richText',
  'textLink',
  'label',
  'button',
])

function truncateNavigatorLabel (value: string, max = 40): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(1, max - 1))}…`
}

function textFromComponentNode (node: ComponentNode): string | null {
  const direct = node.props.text
  if (typeof direct === 'string') {
    const truncated = truncateNavigatorLabel(direct)
    if (truncated) return truncated
  }
  for (const child of node.children) {
    if (child.type === 'text' && typeof child.props.text === 'string') {
      const truncated = truncateNavigatorLabel(String(child.props.text))
      if (truncated) return truncated
    }
  }
  return null
}

/** Navigator row label for component-tree nodes. */
function navigatorLabelForNode (node: ComponentNode): string {
  if (node.type === 'image') return 'Image'
  if (TEXT_NODE_TYPES.has(node.type)) {
    const text = textFromComponentNode(node)
    if (text) return text
  }
  const tag = defaultTagForComponentType(node.type)
  return `${tag} · ${node.type}`
}

function navigatorLabelFromDom (
  el: HTMLElement,
  kind: string,
  fallback: string
): string {
  if (kind === 'image' || el.tagName === 'IMG' || el.tagName === 'PICTURE') {
    return 'Image'
  }
  if (kind === 'text' || kind === 'heading') {
    const text = truncateNavigatorLabel(el.textContent ?? '')
    if (text) return text
  }
  return fallback
}

/** Minimal tree node built from DOM instrumentation data. */
interface DomNode {
  id: string // full data-element-id value
  label: string
  kind: string
  children: DomNode[]
  hidden: boolean
}

function buildDomTree(
  sectionInstanceId: string,
  elementAttributes: Record<string, { visibility?: string }>
): DomNode[] {
  const root = document.querySelector<HTMLElement>(
    `[data-section-instance-id="${CSS.escape(sectionInstanceId)}"]`
  )
  if (!root) return []

  const prefix = `${sectionInstanceId}::__i:`

  function walk(el: HTMLElement): DomNode[] {
    const result: DomNode[] = []
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement
      const eid = child.getAttribute('data-element-id')
      if (eid && eid.startsWith(prefix)) {
        const kind = child.getAttribute('data-element-kind') ?? 'container'
        const fallback =
          child.getAttribute('data-builder-tag')
          ?? child.getAttribute('data-element-tag')
          ?? child.tagName.toLowerCase()
        const label = navigatorLabelFromDom(child, kind, fallback)
        const hidden = elementAttributes[eid]?.visibility === 'hidden'
        result.push({
          id: eid,
          label,
          kind,
          hidden,
          children: walk(child),
        })
      } else {
        // Recurse into non-instrumented wrappers (e.g. React component roots)
        result.push(...walk(child))
      }
    }
    return result
  }
  return walk(root)
}

function TreeRow ({
  depth,
  label,
  active,
  expandable,
  expanded,
  onToggle,
  onSelect,
  rowRef,
  handleRef,
  dragLabel,
  isDragSource,
  indicator,
}: {
  depth: number
  label: string
  active: boolean
  expandable: boolean
  expanded: boolean
  onToggle: () => void
  onSelect: () => void
  /** Drag/drop element, when the row itself is the draggable (component-tree rows). */
  rowRef?: (el: HTMLElement | null) => void
  /** Drag handle. Omitted for rows that have no backing store entry. */
  handleRef?: (el: HTMLElement | null) => void
  dragLabel?: string
  isDragSource?: boolean
  /** Drop indicator for the row, when it is a drop target. */
  indicator?: ReactNode
}) {
  return (
    <div
      ref={rowRef}
      {...dragStateAttrs({ isDragSource })}
      className={cn(
        'group/row relative flex items-center gap-0.5 rounded-md text-sm data-[drag-source]:opacity-50',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80'
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      {expandable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          <ChevronRight
            className={cn('size-4 transition-transform', expanded && 'rotate-90')}
          />
        </Button>
      ) : (
        <span className="inline-flex w-7 shrink-0" />
      )}
      <button
        type="button"
        className="min-w-0 flex-1 truncate py-1.5 pe-2 text-start"
        onClick={onSelect}
      >
        {label}
      </button>
      {handleRef ? (
        <button
          type="button"
          ref={handleRef}
          aria-label={`Reorder ${dragLabel ?? label}`}
          aria-roledescription="draggable layer"
          className="me-1 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : null}
      {indicator}
    </div>
  )
}

/** A row's drop indicator, isolated so an edge change re-renders only this span. */
function RowDropIndicator ({ id }: { id: string }) {
  return <DndDropIndicator edge={useDropEdge(id)} />
}

/**
 * A section row in the navigator — reorders the page's section list.
 *
 * The sortable is the row *and* its expanded branch, so section rows stay
 * direct DOM siblings (dnd-kit reflows sortables by moving their DOM nodes)
 * and a section's layers travel with it while dragged.
 */
function NavigatorSectionRow ({
  instance,
  index,
  title,
  children,
  ...rest
}: {
  instance: SectionInstance
  index: number
  title: string
  active: boolean
  expandable: boolean
  expanded: boolean
  onToggle: () => void
  onSelect: () => void
  children?: ReactNode
}) {
  const { ref, handleRef, isDragging } = useSortableSection({
    instanceId: instance.id,
    index,
    surface: 'navigator',
  })
  return (
    <div ref={ref} className={cn(isDragging && 'opacity-50')}>
      <TreeRow
        depth={1}
        label={title}
        dragLabel={title}
        handleRef={handleRef}
        {...rest}
      />
      {children}
    </div>
  )
}

/**
 * A component-tree row in the navigator. Same edge model and drop pipeline as
 * the canvas: the row is a draggable (by its grip) and a drop target whose
 * top/bottom edges insert before/after and whose middle nests into containers.
 */
function NavigatorNodeRow ({
  sectionId,
  node,
  parentId,
  parentType,
  path,
  depth,
  label,
  children,
  ...rest
}: {
  sectionId: string
  node: ComponentNode
  parentId: string | null
  parentType: ShadcnComponentType | null
  /** Ids from the tree root down to (and including) this node. */
  path: readonly string[]
  depth: number
  label: string
  active: boolean
  expandable: boolean
  expanded: boolean
  onToggle: () => void
  onSelect: () => void
  children?: ReactNode
}) {
  const { id, ref, handleRef, isDragSource } = useTreeNodeDnd({
    sectionId,
    nodeId: node.id,
    nodeType: node.type,
    parentId,
    parentType,
    path,
    childCount: node.children.length,
    surface: 'navigator',
  })
  return (
    <div>
      <TreeRow
        depth={depth}
        label={label}
        dragLabel={label}
        rowRef={ref}
        handleRef={handleRef}
        isDragSource={isDragSource}
        indicator={<RowDropIndicator id={id} />}
        {...rest}
      />
      {children}
    </div>
  )
}

const ROOT_PATH: readonly string[] = []

function ComponentBranch ({
  sectionId,
  nodes,
  parentId,
  parentType,
  parentPath = ROOT_PATH,
  depth,
  expanded,
  toggle,
  selectNode,
  selectedElementId,
}: {
  sectionId: string
  nodes: ComponentNode[]
  parentId: string | null
  parentType: ShadcnComponentType | null
  parentPath?: readonly string[]
  depth: number
  expanded: Record<string, boolean>
  toggle: (key: string) => void
  selectNode: (sectionId: string, nodeId: string) => void
  selectedElementId: string | null
}) {
  return (
    <>
      {nodes.map((node) => {
        const key = `${sectionId}:${node.id}`
        const hasKids = node.children.length > 0
        const isOpen = expanded[key] !== false
        const elementId = `${sectionId}::${node.id}`
        const label = navigatorLabelForNode(node)
        const path = [...parentPath, node.id]
        return (
          <NavigatorNodeRow
            key={node.id}
            sectionId={sectionId}
            node={node}
            parentId={parentId}
            parentType={parentType}
            path={path}
            depth={depth}
            label={label}
            active={selectedElementId === elementId}
            expandable={hasKids}
            expanded={isOpen}
            onToggle={() => toggle(key)}
            onSelect={() => selectNode(sectionId, node.id)}
          >
            {hasKids && isOpen ? (
              <ComponentBranch
                sectionId={sectionId}
                nodes={node.children}
                parentId={node.id}
                parentType={node.type}
                parentPath={path}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                selectNode={selectNode}
                selectedElementId={selectedElementId}
              />
            ) : null}
          </NavigatorNodeRow>
        )
      })}
    </>
  )
}

/**
 * Layers for a slot-driven section: one row per layout region, then the ordered
 * entries inside it.
 *
 * Replaces `DomBranch` for these sections. The DOM branch lists whatever the JSX
 * happened to render, which for a hero is a pile of anonymous wrappers; slots
 * are the structure the user actually edits, and they carry stable ids so the
 * rows survive a re-render.
 */
function SlotBranch ({
  instance,
  def,
  depth,
  expanded,
  toggle,
  selectNode,
  selectedElementId,
}: {
  instance: SectionInstance
  def: SectionDefinition
  depth: number
  expanded: Record<string, boolean>
  toggle: (key: string) => void
  selectNode: (sectionId: string, nodeId: string) => void
  selectedElementId: string | null
}) {
  const injectedChildren = useBuilderStore((s) => s.injectedChildren)
  const setBlockHidden = useBuilderStore((s) => s.setBlockHidden)

  return (
    <>
      {(def.slots ?? []).map((slot) => {
        const key = `slot:${instance.id}:${slot.id}`
        const open = expanded[key] !== false
        const entries = resolveSlotEntries({
          slot,
          blocks: def.blocks ?? [],
          layout: instance.slots?.[slot.id],
          injected: injectedChildren[slotHostElementId(instance.id, slot.id)] ?? [],
        })
        return (
          <div key={key}>
            <TreeRow
              depth={depth}
              label={slot.label}
              active={false}
              expandable={entries.length > 0}
              expanded={open}
              onToggle={() => toggle(key)}
              onSelect={() => toggle(key)}
            />
            {open
              ? entries.map((entry) =>
                  entry.kind === 'node' ? (
                    <ComponentBranch
                      key={entry.id}
                      sectionId={instance.id}
                      nodes={[entry.node]}
                      parentId={slotParentId(slot.id)}
                      parentType={null}
                      depth={depth + 1}
                      expanded={expanded}
                      toggle={toggle}
                      selectNode={selectNode}
                      selectedElementId={selectedElementId}
                    />
                  ) : (
                    <div
                      key={entry.id}
                      className={cn('group flex items-center', entry.hidden && 'opacity-50')}
                    >
                      <div className="min-w-0 flex-1">
                        <TreeRow
                          depth={depth + 1}
                          label={entry.block.label}
                          active={false}
                          expandable={false}
                          expanded={false}
                          onToggle={() => {}}
                          onSelect={() =>
                            selectNode(instance.id, entry.block.propKeys[0] ?? entry.block.id)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="me-1 size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`${entry.hidden ? 'Show' : 'Hide'} ${entry.block.label}`}
                        onClick={() =>
                          setBlockHidden(instance.id, slot.id, entry.block.id, !entry.hidden)
                        }
                      >
                        {entry.hidden ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  )
                )
              : null}
          </div>
        )
      })}
    </>
  )
}

function DomBranch({
  nodes,
  depth,
  expanded,
  toggle,
  selectedElementId,
  onSelect,
  onToggleHidden,
}: {
  nodes: DomNode[]
  depth: number
  expanded: Record<string, boolean>
  toggle: (key: string) => void
  selectedElementId: string | null
  onSelect: (id: string) => void
  onToggleHidden: (id: string, hidden: boolean) => void
}) {
  return (
    <>
      {nodes.map((node) => {
        const isOpen = expanded[node.id] !== false
        const hasKids = node.children.length > 0
        return (
          <div key={node.id}>
            <div
              className={cn(
                'group flex items-center gap-0.5 rounded-md text-sm',
                selectedElementId === node.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80',
                node.hidden && 'opacity-50'
              )}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
            >
              {hasKids ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); toggle(node.id) }}
                >
                  <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} />
                </Button>
              ) : (
                <span className="inline-flex w-7 shrink-0" />
              )}
              <button
                type="button"
                className="min-w-0 flex-1 truncate py-1.5 pe-1 text-start text-xs"
                onClick={() => onSelect(node.id)}
              >
                {node.label}
              </button>
              <button
                type="button"
                aria-label={node.hidden ? 'Show' : 'Hide'}
                className="me-1 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onToggleHidden(node.id, !node.hidden) }}
              >
                {node.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
            </div>
            {hasKids && isOpen && (
              <DomBranch
                nodes={node.children}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                selectedElementId={selectedElementId}
                onSelect={onSelect}
                onToggleHidden={onToggleHidden}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export function NavigatorPanel () {
  const sections = useBuilderStore((s) => s.sections)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const elementAttributes = useBuilderStore((s) => s.elementAttributes)
  const setSelectedSection = useBuilderStore((s) => s.setSelectedSection)
  const setSelectedElement = useBuilderStore((s) => s.setSelectedElement)
  const setElementHidden = useBuilderStore((s) => s.setElementHidden)

  const [bodyOpen, setBodyOpen] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // DOM-derived trees for hardcoded sections (keyed by sectionInstanceId)
  const [domTrees, setDomTrees] = useState<Record<string, DomNode[]>>({})

  // Rebuild DOM trees whenever sections list or elementAttributes change.
  // Uses rAF to run after the instrumentation pass completes.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const next: Record<string, DomNode[]> = {}
      for (const sec of sections) {
        if (!sec.componentTree || sec.componentTree.length === 0) {
          next[sec.id] = buildDomTree(sec.id, elementAttributes)
        }
      }
      setDomTrees(next)
    })
    return () => cancelAnimationFrame(raf)
  }, [sections, elementAttributes])

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }))
  }, [])

  const selectDomElement = useCallback(
    (elementId: string) => {
      const sep = elementId.indexOf('::')
      if (sep > 0) setSelectedSection(elementId.slice(0, sep))
      setSelectedElement(elementId)
      requestAnimationFrame(() => {
        document.querySelector(`[data-element-id="${CSS.escape(elementId)}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
    [setSelectedSection, setSelectedElement]
  )

  const scrollToSection = useCallback((sectionId: string, nodeId?: string) => {
    // Small delay so React finishes the selection state update first
    requestAnimationFrame(() => {
      const selector = nodeId
        ? `[data-element-id="${sectionId}::${nodeId}"]`
        : `[data-section-id="${sectionId}"]`
      const el = document.querySelector(selector)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  const selectNode = useCallback(
    (sid: string, nodeId: string) => {
      setSelectedSection(sid)
      setSelectedElement(`${sid}::${nodeId}`)
      scrollToSection(sid, nodeId)
    },
    [setSelectedSection, setSelectedElement, scrollToSection]
  )

  return (
    <div className="flex h-full min-h-0 flex-col border-e border-border bg-background">
      <div className="border-b border-border p-3">
        <p className="text-sm font-semibold">Navigator</p>
        <p className="text-xs text-muted-foreground">Page structure</p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-0.5 p-2 pb-6">
          <TreeRow
            depth={0}
            label="Body"
            active={false}
            expandable
            expanded={bodyOpen}
            onToggle={() => setBodyOpen((o) => !o)}
            onSelect={() => {
              setSelectedSection(null)
              setSelectedElement(null)
            }}
          />
          {bodyOpen
            ? sections.map((inst, sectionIndex) => {
                const def = sectionRegistry.get(inst.sectionId)
                const title = def?.displayName ?? inst.sectionId
                const sectionKey = `section:${inst.id}`
                const sectionExpanded = expanded[sectionKey] !== false
                const hasTree = Boolean(inst.componentTree?.length)
                return (
                    <NavigatorSectionRow
                      key={inst.id}
                      instance={inst}
                      index={sectionIndex}
                      title={title}
                      active={selectedSectionId === inst.id && !selectedElementId}
                      expandable={hasTree || Boolean(def?.slots?.length)}
                      expanded={sectionExpanded}
                      onToggle={() => toggle(sectionKey)}
                      onSelect={() => {
                        setSelectedSection(inst.id)
                        setSelectedElement(null)
                        scrollToSection(inst.id)
                      }}
                    >
                    {hasTree && sectionExpanded && inst.componentTree ? (
                      <ComponentBranch
                        sectionId={inst.id}
                        nodes={inst.componentTree}
                        parentId={null}
                        parentType={null}
                        depth={2}
                        expanded={expanded}
                        toggle={toggle}
                        selectNode={selectNode}
                        selectedElementId={selectedElementId}
                      />
                    ) : null}
                    {/* Slot-driven sections list their layout regions instead of
                        raw DOM, since that is the structure the user edits. */}
                    {!hasTree && sectionExpanded && def?.slots?.length ? (
                      <SlotBranch
                        instance={inst}
                        def={def}
                        depth={2}
                        expanded={expanded}
                        toggle={toggle}
                        selectNode={selectNode}
                        selectedElementId={selectedElementId}
                      />
                    ) : null}
                    {/* Instrumented DOM elements for hardcoded sections */}
                    {!hasTree && !def?.slots?.length && sectionExpanded && domTrees[inst.id]?.length ? (
                      <DomBranch
                        nodes={domTrees[inst.id]!}
                        depth={2}
                        expanded={expanded}
                        toggle={toggle}
                        selectedElementId={selectedElementId}
                        onSelect={selectDomElement}
                        onToggleHidden={(id, hidden) => setElementHidden(id, hidden)}
                      />
                    ) : null}
                    </NavigatorSectionRow>
                )
              })
            : null}
          {sections.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-6 text-xs text-muted-foreground">
              <FileJson className="size-4 shrink-0" />
              No sections on this page.
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
