'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@workspace/ui/components/button'

import {
  createNavItem,
  duplicateNavItem,
  findNavItem,
  flattenVisibleNav,
  insertNavItem,
  removeNavItem,
  updateNavItem,
} from '@/lib/builder/shared-chrome/nav-tree'
import type { ChromeRole, NavItem, SharedChromeModel } from '@/lib/builder/shared-chrome/types'
import { NavItemRow, type NavRowActions } from './nav-item-row'
import { NavItemEditor } from './nav-item-editor'

/**
 * The navigation tree editor.
 *
 * Rows are rendered from a flattened view of the tree (collapsed subtrees folded
 * away) and dragged through the builder's shared drop pipeline — see
 * `use-sortable-nav-item.ts` and the `move-nav-item` intent, which is where the
 * nesting maths lives. Everything here is presentation plus single-call model
 * edits, so each interaction is exactly one undo step.
 */
export function NavigationManager ({
  role,
  model,
  update,
}: {
  role: ChromeRole
  model: SharedChromeModel
  update: (recipe: (model: SharedChromeModel) => void) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(() => flattenVisibleNav(model.navigation), [model.navigation])
  const childCounts = useMemo(() => {
    const counts = new Map<string, number>()
    const walk = (items: NavItem[]) => {
      for (const item of items) {
        counts.set(item.id, item.children?.length ?? 0)
        walk(item.children ?? [])
      }
    }
    walk(model.navigation)
    return counts
  }, [model.navigation])

  /**
   * Any structural or content edit takes the tree out of page-sync — that is the
   * promise that a hand-authored navigation is never rewritten by a page rename.
   */
  const editTree = useCallback(
    (fn: (nav: NavItem[]) => NavItem[], { manual = true } = {}) => {
      update((draft) => {
        draft.navigation = fn(draft.navigation)
        if (manual) draft.navSynced = false
      })
    },
    [update]
  )

  const actions: NavRowActions = useMemo(
    () => ({
      // Collapsing is a view preference, not an edit — it must not lock auto-sync.
      onToggleCollapse: (id) =>
        editTree(
          (nav) => updateNavItem(nav, id, { collapsed: !findNavItem(nav, id)?.collapsed }),
          { manual: false }
        ),
      onToggleHidden: (id) =>
        editTree((nav) =>
          updateNavItem(nav, id, { hidden: !findNavItem(nav, id)?.hidden, auto: false })
        ),
      onDuplicate: (id) => editTree((nav) => duplicateNavItem(nav, id)),
      onRemove: (id) => {
        editTree((nav) => removeNavItem(nav, id))
        setSelectedId((current) => (current === id ? null : current))
      },
      onSelect: (id) => setSelectedId((current) => (current === id ? null : id)),
    }),
    [editTree]
  )

  const selected = selectedId ? findNavItem(model.navigation, selectedId) : null

  const addItem = () => {
    const item = createNavItem({ label: 'New link' })
    editTree((nav) => insertNavItem(nav, item))
    setSelectedId(item.id)
  }

  const resync = () => {
    update((draft) => {
      draft.navSynced = true
    })
    toast.success('Navigation will follow your pages again.', {
      description: 'Rename or add a page to see it update.',
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          {model.navSynced
            ? 'Following your site pages'
            : 'Custom order — pages no longer rewrite this'}
        </p>
        {!model.navSynced ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-[10px]"
            onClick={resync}
          >
            <RotateCcw className="size-3" />
            Follow pages
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-6 text-center">
          <p className="text-xs font-medium text-foreground">No navigation items</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Add a link, or drag one in from a page.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {rows.map((row, index) => (
            <NavItemRow
              key={row.id}
              item={row.item}
              role={role}
              depth={row.depth}
              index={index}
              childCount={childCounts.get(row.id) ?? 0}
              selected={row.id === selectedId}
              actions={actions}
            />
          ))}
        </div>
      )}

      {selected ? (
        <NavItemEditor
          item={selected}
          onClose={() => setSelectedId(null)}
          onPatch={(patch) =>
            editTree((nav) => updateNavItem(nav, selected.id, { ...patch, auto: false }))
          }
        />
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-full gap-1.5 text-xs"
        onClick={addItem}
      >
        <Plus className="size-3.5" />
        Add link
      </Button>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Drag a row sideways to nest it under the row above, or back to the left to
        un-nest it.
      </p>
    </div>
  )
}
