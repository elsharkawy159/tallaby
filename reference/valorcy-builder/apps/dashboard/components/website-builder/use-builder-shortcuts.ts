'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useBuilderStore } from '@/lib/builder/store'
import { findComponentNodeInTree, findParentIdOfNode } from '@/lib/builder/find-tree-node'
import type { ComponentNode } from '@/lib/builder/component-node'

/**
 * Element-level keyboard shortcuts for the builder canvas.
 *
 * Complements the two handlers that already exist: `builder-editor.tsx` owns
 * document-level actions (undo/redo/save/duplicate-section/`?`) and
 * `builder-canvas.tsx` owns Escape and Delete, which have section-specific
 * behaviour worth leaving where it is. This hook adds what was missing
 * entirely — clipboard bindings (the store actions existed but nothing called
 * them), tree navigation, and multi-select grouping.
 */

/** Never hijack a key the user is typing into a field or an inline editor. */
function isEditableTarget (target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function parseElementId (
  elementId: string | null
): { sectionId: string; nodeId: string } | null {
  if (!elementId) return null
  const sep = elementId.indexOf('::')
  if (sep <= 0) return null
  const nodeId = elementId.slice(sep + 2)
  return nodeId ? { sectionId: elementId.slice(0, sep), nodeId } : null
}

/** Depth-first order of a tree — the order Tab walks. */
function flatten (nodes: ComponentNode[], out: ComponentNode[] = []): ComponentNode[] {
  for (const node of nodes) {
    out.push(node)
    flatten(node.children, out)
  }
  return out
}

type Direction = 'prev-sibling' | 'next-sibling' | 'parent' | 'first-child' | 'prev' | 'next'

/**
 * Move the selection through the component tree.
 *
 * Arrow keys walk siblings and the parent/child axis; Tab walks the whole tree
 * in document order. Both operate on the selected element's own section, so
 * navigation never silently jumps into a different section.
 */
function moveSelection (direction: Direction): boolean {
  const state = useBuilderStore.getState()
  const selected = parseElementId(state.selectedElementId)
  if (!selected) return false

  const tree = state.sections.find((s) => s.id === selected.sectionId)?.componentTree
  if (!tree) return false

  const select = (nodeId: string) => {
    state.setSelectedElement(`${selected.sectionId}::${nodeId}`)
  }

  if (direction === 'prev' || direction === 'next') {
    const flat = flatten(tree)
    const idx = flat.findIndex((n) => n.id === selected.nodeId)
    if (idx < 0) return false
    const target = flat[direction === 'next' ? idx + 1 : idx - 1]
    if (!target) return false
    select(target.id)
    return true
  }

  if (direction === 'first-child') {
    const node = findComponentNodeInTree(tree, selected.nodeId)
    const child = node?.children[0]
    if (!child) return false
    select(child.id)
    return true
  }

  const parentId = findParentIdOfNode(tree, selected.nodeId)
  if (parentId === false) return false

  if (direction === 'parent') {
    if (!parentId) return false
    select(parentId)
    return true
  }

  const siblings = parentId
    ? (findComponentNodeInTree(tree, parentId)?.children ?? [])
    : tree
  const idx = siblings.findIndex((n) => n.id === selected.nodeId)
  if (idx < 0) return false
  const target = siblings[direction === 'next-sibling' ? idx + 1 : idx - 1]
  if (!target) return false
  select(target.id)
  return true
}

export interface BuilderShortcutHandlers {
  /** Opens the ⌘K Quick Insert palette. */
  onQuickInsert?: () => void
}

export function useBuilderShortcuts ({ onQuickInsert }: BuilderShortcutHandlers = {}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isEditableTarget(e.target)) return

      const mod = e.ctrlKey || e.metaKey
      const store = useBuilderStore.getState()
      const selected = parseElementId(store.selectedElementId)

      // ── Quick Insert ──────────────────────────────────────────────────────
      if (mod && e.key.toLowerCase() === 'k') {
        if (!onQuickInsert) return
        e.preventDefault()
        onQuickInsert()
        return
      }

      // ── Tree navigation (no modifier) ─────────────────────────────────────
      if (!mod && !e.altKey) {
        if (e.key === 'Tab') {
          // Only take over Tab once something in the tree is selected;
          // otherwise the browser's focus order must keep working.
          if (!selected) return
          if (moveSelection(e.shiftKey ? 'prev' : 'next')) e.preventDefault()
          return
        }
        if (!e.shiftKey && selected) {
          const map: Record<string, Direction> = {
            ArrowUp: 'prev-sibling',
            ArrowDown: 'next-sibling',
            ArrowLeft: 'parent',
            ArrowRight: 'first-child',
          }
          const direction = map[e.key]
          if (direction) {
            if (moveSelection(direction)) e.preventDefault()
            return
          }
        }
      }

      if (!mod) return

      switch (e.key.toLowerCase()) {
        // ── Clipboard ───────────────────────────────────────────────────────
        case 'c': {
          if (!selected) return
          e.preventDefault()
          store.copyElement(selected.sectionId, selected.nodeId)
          toast.message('Copied', { duration: 1200 })
          return
        }
        case 'x': {
          if (!selected) return
          e.preventDefault()
          store.cutElement(selected.sectionId, selected.nodeId)
          toast.message('Cut', { duration: 1200 })
          return
        }
        case 'v': {
          if (!store.clipboard) return
          e.preventDefault()
          store.pasteClipboard(selected?.sectionId)
          return
        }
        // ── Duplicate ───────────────────────────────────────────────────────
        case 'd': {
          // With an element selected this duplicates the element; with only a
          // section selected `builder-editor.tsx` duplicates the section.
          if (!selected) return
          e.preventDefault()
          store.duplicateComponentNode(selected.sectionId, selected.nodeId)
          toast.message('Duplicated', { duration: 1200 })
          return
        }
        // ── Group ───────────────────────────────────────────────────────────
        case 'g': {
          e.preventDefault()
          if (store.multiSelectedElementIds.length < 2) {
            toast.message('Select two or more elements to group.')
            return
          }
          const before = store.multiSelectedElementIds.length
          store.wrapMultiSelectedIn('container')
          // The action clears the selection only when it actually wrapped.
          if (useBuilderStore.getState().multiSelectedElementIds.length === before) {
            toast.message('Group elements that sit side by side in the same parent.')
          } else {
            toast.message(`Grouped ${before} elements`, { duration: 1500 })
          }
          return
        }
        default:
          return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onQuickInsert])
}

export { isEditableTarget }
