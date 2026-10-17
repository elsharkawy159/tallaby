"use client"

import { useState } from "react"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import { Bookmark, Clipboard, Copy, CopyPlus, Plus, Scissors, Tag, Trash2, Unlink } from "lucide-react"
import { sectionRegistry } from "@/components/sections"
import {
  canEjectSection,
  ejectSectionToTree,
} from "@/lib/builder/eject-section-to-tree"
import {
  getPaletteItem,
  type ElementPaletteItem,
} from "@/lib/builder/element-definitions"
import { insertElement, type InsertTarget } from "@/lib/builder/insertion-engine"
import { PaletteIcon } from "@/components/website-builder/panels/palette-icon"
import { usePalettePrefs } from "@/components/website-builder/panels/use-palette-prefs"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { useBuilderStore } from "@/lib/builder/store"
import { lastSavedBlock, persistSavedBlock } from "@/lib/builder/saved-blocks-sync"

/** Save an element as a block, then persist it to the DB. */
function saveAndPersistElementBlock(
  saveElementAsBlock: (sectionId: string, nodeId: string, name: string) => void,
  sectionId: string,
  nodeId: string,
  name: string,
) {
  saveElementAsBlock(sectionId, nodeId, name)
  const block = lastSavedBlock()
  if (block) void persistSavedBlock(block)
}

/**
 * "Insert" submenu — the right-click route into the element palette.
 *
 * Offers favourites and recents first, since those are the elements this user
 * actually reaches for, and falls back to a short default list on a fresh
 * profile so the menu is never empty. Insertion goes through the same engine as
 * every other surface, so the target (inside the right-clicked element) and the
 * usage bookkeeping behave identically to a drag.
 */
function InsertSubmenu({ target }: { target: InsertTarget }) {
  const prefs = usePalettePrefs()

  const items = (() => {
    const ids = [...prefs.favorites, ...prefs.recent]
    const seen = new Set<string>()
    const out: ElementPaletteItem[] = []
    for (const id of ids) {
      if (seen.has(id)) continue
      seen.add(id)
      const item = getPaletteItem(id)
      if (item) out.push(item)
      if (out.length >= 8) break
    }
    if (out.length > 0) return out
    return DEFAULT_INSERT_IDS.map(getPaletteItem).filter(
      (i): i is ElementPaletteItem => !!i,
    )
  })()

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <Plus className="me-2 size-4" />
        Insert
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48">
        {items.map((item) => (
          <ContextMenuItem
            key={item.paletteId}
            onSelect={() => insertElement(item.paletteId, target)}
          >
            <PaletteIcon paletteId={item.paletteId} chip={false} className="me-2" />
            {item.label}
          </ContextMenuItem>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}

/** Shown in the Insert submenu before the user has inserted anything. */
const DEFAULT_INSERT_IDS = [
  "heading",
  "paragraph",
  "button",
  "image",
  "container",
  "grid",
]

// D-14: exactly 21 semantic HTML tags for the Change Tag submenu
const CHANGE_TAG_OPTIONS = [
  "div",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "aside",
  "nav",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "button",
  "a",
  "ul",
  "ol",
  "li",
] as const

type ChangeTagOption = (typeof CHANGE_TAG_OPTIONS)[number]

// Mirrors the parseElementId helper in element-settings-panel.tsx (sep on '::')
function parseElementId(
  elementId: string
): { sectionId: string; nodeId: string } | null {
  const sep = elementId.indexOf("::")
  if (sep <= 0) return null
  return {
    sectionId: elementId.slice(0, sep),
    nodeId: elementId.slice(sep + 2),
  }
}

type ContextTarget =
  | { type: "element"; sectionId: string; nodeId: string; elementId: string }
  | { type: "section"; instanceId: string }
  | null

export function CanvasContextMenu({ children }: React.PropsWithChildren) {
  const [contextTarget, setContextTarget] = useState<ContextTarget>(null)
  const [blockName, setBlockName] = useState('')

  const clipboard = useBuilderStore((s) => s.clipboard)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const elementAttributes = useBuilderStore((s) => s.elementAttributes) ?? {}

  const setSelectedElement = useBuilderStore((s) => s.setSelectedElement)
  const setSelectedSection = useBuilderStore((s) => s.setSelectedSection)
  const updateElementAttributes = useBuilderStore(
    (s) => s.updateElementAttributes
  )
  const duplicateComponentNode = useBuilderStore(
    (s) => s.duplicateComponentNode
  )
  const duplicateSection = useBuilderStore((s) => s.duplicateSection)
  const cutElement = useBuilderStore((s) => s.cutElement)
  const copyElement = useBuilderStore((s) => s.copyElement)
  const cutSection = useBuilderStore((s) => s.cutSection)
  const copySection = useBuilderStore((s) => s.copySection)
  const pasteClipboard = useBuilderStore((s) => s.pasteClipboard)
  const removeComponentNode = useBuilderStore((s) => s.removeComponentNode)
  const removeSection = useBuilderStore((s) => s.removeSection)
  const saveElementAsBlock = useBuilderStore((s) => s.saveElementAsBlock)
  const ejectSection = useBuilderStore((s) => s.ejectSection)
  // Shared header/footer live in their own store slots, not in `sections`, so
  // this lookup can legitimately come up empty.
  const sections = useBuilderStore((s) => s.sections)

  function handleContextMenu(e: React.MouseEvent) {
    if (canvasPreview) return

    // Pitfall 2: check element-id FIRST before section-id
    const elementAncestor = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-element-id]"
    )
    if (elementAncestor?.dataset.elementId) {
      const elementId = elementAncestor.dataset.elementId
      const parsed = parseElementId(elementId)
      if (!parsed) return
      setSelectedElement(elementId)
      setSelectedSection(parsed.sectionId)
      setContextTarget({
        type: "element",
        sectionId: parsed.sectionId,
        nodeId: parsed.nodeId,
        elementId,
      })
      return
    }

    const sectionAncestor = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-section-instance-id]"
    )
    if (sectionAncestor?.dataset.sectionInstanceId) {
      const instanceId = sectionAncestor.dataset.sectionInstanceId
      setSelectedSection(instanceId)
      setContextTarget({ type: "section", instanceId })
    }
  }

  const pasteDisabled = clipboard === null

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div onContextMenu={handleContextMenu} className="contents">
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="z-202 w-48">
        {contextTarget?.type === "element" ? (
          <>
            <InsertSubmenu
              target={{
                sectionId: contextTarget.sectionId,
                parentId: contextTarget.nodeId,
              }}
            />
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() =>
                cutElement(contextTarget.sectionId, contextTarget.nodeId)
              }
            >
              <Scissors className="me-2 size-4" />
              Cut
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                copyElement(contextTarget.sectionId, contextTarget.nodeId)
              }
            >
              <Copy className="me-2 size-4" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem
              disabled={pasteDisabled}
              onSelect={() => pasteClipboard(contextTarget.sectionId)}
            >
              <Clipboard className="me-2 size-4" />
              Paste
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() =>
                duplicateComponentNode(
                  contextTarget.sectionId,
                  contextTarget.nodeId
                )
              }
            >
              <CopyPlus className="me-2 size-4" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Tag className="me-2 size-4" />
                Change Tag
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {(() => {
                  const currentTag =
                    (elementAttributes[contextTarget.elementId]?.tag as
                      | ChangeTagOption
                      | undefined) ?? "div"
                  return CHANGE_TAG_OPTIONS.map((tag) => (
                    <ContextMenuCheckboxItem
                      key={tag}
                      checked={tag === currentTag}
                      onSelect={() =>
                        updateElementAttributes(contextTarget.elementId, {
                          tag,
                        })
                      }
                    >
                      {tag}
                    </ContextMenuCheckboxItem>
                  ))
                })()}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Bookmark className="me-2 size-4" />
                Save as Block
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="p-2 w-52">
                <p className="mb-1.5 text-xs text-muted-foreground">Name this block</p>
                <Input
                  autoFocus
                  placeholder="e.g. Feature Card"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && blockName.trim()) {
                      saveAndPersistElementBlock(saveElementAsBlock, contextTarget.sectionId, contextTarget.nodeId, blockName.trim())
                      setBlockName('')
                    }
                    e.stopPropagation()
                  }}
                  className="mb-1.5 h-7 text-xs"
                />
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={!blockName.trim()}
                  onClick={() => {
                    if (!blockName.trim()) return
                    saveAndPersistElementBlock(saveElementAsBlock, contextTarget.sectionId, contextTarget.nodeId, blockName.trim())
                    setBlockName('')
                  }}
                >
                  Save Block
                </Button>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() =>
                removeComponentNode(
                  contextTarget.sectionId,
                  contextTarget.nodeId
                )
              }
            >
              <Trash2 className="me-2 size-4" />
              Delete
            </ContextMenuItem>
          </>
        ) : contextTarget?.type === "section" ? (
          <>
            <ContextMenuItem
              onSelect={() => cutSection(contextTarget.instanceId)}
            >
              <Scissors className="me-2 size-4" />
              Cut
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => copySection(contextTarget.instanceId)}
            >
              <Copy className="me-2 size-4" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem
              disabled={pasteDisabled}
              onSelect={() => pasteClipboard(contextTarget.instanceId)}
            >
              <Clipboard className="me-2 size-4" />
              Paste
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => duplicateSection(contextTarget.instanceId)}
            >
              <CopyPlus className="me-2 size-4" />
              Duplicate Section
            </ContextMenuItem>
            {(() => {
              // "Detach" converts a built-in section into an editable component
              // tree, giving it the same per-element freedom as a custom section.
              // Only offered for schema-driven sections that aren't trees already.
              const instance = sections?.find(
                (s) => s.id === contextTarget.instanceId
              )
              if (!instance || instance.componentTree?.length) return null
              const def = sectionRegistry.get(instance.sectionId)
              if (!canEjectSection(def)) return null
              return (
                <ContextMenuItem
                  onSelect={() => {
                    const tree = ejectSectionToTree(
                      instance,
                      def!,
                      useBuilderStore.getState().injectedChildren
                    )
                    if (tree?.length) ejectSection(instance.id, tree)
                  }}
                >
                  <Unlink className="me-2 size-4" />
                  Detach for full editing
                </ContextMenuItem>
              )
            })()}
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => removeSection(contextTarget.instanceId)}
            >
              <Trash2 className="me-2 size-4" />
              Delete Section
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}
