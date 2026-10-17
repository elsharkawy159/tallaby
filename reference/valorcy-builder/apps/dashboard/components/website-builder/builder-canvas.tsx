"use client"

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ComponentType } from "react"
import { toast } from "sonner"
import { useInstrumentSection } from "@/lib/builder/use-instrument-section"
import {
  useDroppableCanvasRoot,
  useSharedChromeDrag,
  useSortableSection,
} from "@/components/website-builder/dnd/use-section-dnd"
import { useDropEdge } from "@/components/dnd/dnd-provider"
import { DndDropIndicator } from "@/components/dnd/dnd-drop-indicator"
import { dragStateAttrs } from "@/components/dnd/dnd-sortable-item"
import { DRAG_HANDLE_ATTR } from "@/components/dnd/presets"
import { Bookmark, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useBuilderStore } from "@/lib/builder/store"
import { sectionRegistry } from "@/components/sections"
import { lastSavedBlock, persistSavedBlock } from "@/lib/builder/saved-blocks-sync"
import type { SectionInstance } from "@/components/sections/registry.types"
import { SectionInsertDialog } from "./section-insert-dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { ComponentTreeRenderer } from "@/components/website-builder/component-tree-renderer"
import { CustomSectionSurface } from "@/components/sections/custom/custom-blank-section"
import { AnimationWrapper } from "@/components/website-builder/animation-wrapper"
import { ElementResizeOverlay } from "@/components/website-builder/element-resize-overlay"
import { ElementRadiusOverlay } from "@/components/website-builder/element-radius-overlay"
import { FlexGapOverlay } from "@/components/website-builder/flex-gap-overlay"
import { InjectedChildrenLayer } from "@/components/website-builder/injected-children-layer"
import { SectionLoadingOverlay } from "@/components/website-builder/section-loading-overlay"
import { styleObjectToCssText } from "@/lib/builder/css-inline-string"
import { CanvasContextMenu } from "./canvas-context-menu"
import { ElementPopover } from "./element-popover/element-popover"
import { AlignmentGuides } from "./canvas/alignment-guides"
import { SelectedElementBadge } from "./canvas/selected-element-badge"
import { CanvasGridOverlay } from "./canvas-grid-overlay"
import {
  designSystemToThemeCss,
  SITE_THEME_ROOT_CLASS,
} from "@/lib/builder/design-system-css-vars"
import { designSystemFontsHref } from "@/lib/builder/design-system-fonts"
import { resolveSectionsForLocale } from "@/lib/builder/i18n/resolve-section-locale"
import { localeDirection } from "@workspace/i18n"
import { CANVAS_DROP_ID, sectionSortableId } from "@/lib/builder/dnd/ids"
import {
  cancelSectionPreparation,
  prepareSectionInstance,
} from "@/lib/builder/section-preparation"

export { CANVAS_DROP_ID }

const PRIMARY_BTN = "bg-[#4F28BA] text-white hover:bg-[#4F28BA]/90"
const ICON_BTN =
  "size-7 flex items-center cursor-pointer disabled:cursor-not-allowed justify-center rounded-lg bg-[#4F28BA] text-white shadow-sm disabled:opacity-40"

function CanvasBtn({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        PRIMARY_BTN,
        "cursor-pointer rounded-md flex items-center px-3 py-1.5 text-sm font-medium",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Returns true when the target is inside the floating element popover or any
// Radix-portaled overlay opened from it (Select dropdowns, Dialogs, Popovers).
// Used to prevent canvas click handlers from clearing element selection while
// the user is interacting with popover controls.
function isInsideBuilderOverlay(target: HTMLElement | null) {
  if (!target) return false
  return Boolean(
    target.closest(
      '[data-builder-popover], [data-radix-popper-content-wrapper], [data-radix-select-viewport], [role="dialog"], [role="listbox"], [role="menu"]'
    )
  )
}

function isEditableDomTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "OPTION"
  )
    return true
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]')
  )
}

// Memoized so editing/selecting one section doesn't re-render every other
// section's (potentially heavy) body. The store uses Immer, so unchanged
// section instances keep a stable object reference — referential equality on
// `instance` lets memo skip the work for everything except the edited section.
const MemoSectionBody = memo(function MemoSectionBody({
  Component,
  instance,
  isPreview,
}: {
  Component: ComponentType<{ instance: SectionInstance; isPreview?: boolean }>
  instance: SectionInstance
  isPreview: boolean
}) {
  return <Component instance={instance} isPreview={isPreview} />
})

/**
 * Toolbar visibility. The handle must stay reachable by keyboard, so the
 * toolbar reveals on `focus-within` as well as hover and never drops
 * `pointer-events` — previously `pointer-events-none` until hover made the
 * drag handle impossible to tab to, which silently disabled the KeyboardSensor.
 */
const SECTION_TOOLBAR =
  "absolute top-2 end-2 z-60 flex items-center gap-0.5 rounded-lg p-1 opacity-0 outline backdrop-blur-xs transition-opacity group-hover:opacity-100 focus-within:opacity-100"

/** Marks a grip button as a drag handle, so the canvas click handler ignores it. */
const HANDLE_ATTRS = { [DRAG_HANDLE_ATTR]: "" }

/**
 * A drop target's indicator in its own component: an edge change re-renders
 * this span alone, not the (heavy) section it sits in.
 */
function TargetDropIndicator({ id }: { id: string }) {
  return <DndDropIndicator edge={useDropEdge(id)} data-no-instrument="" />
}

const SortableSection = memo(function SortableSection({
  instance,
  index,
  total,
  onInsert,
}: {
  instance: SectionInstance
  index: number
  total: number
  onInsert: (atIndex: number) => void
}) {
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const setSelectedSection = useBuilderStore((s) => s.setSelectedSection)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const aiLoadingKind = useBuilderStore((s) => s.aiLoadingSections[instance.id])
  const aiError = useBuilderStore((s) => s.aiSectionErrors[instance.id])
  const reorderSections = useBuilderStore((s) => s.reorderSections)
  const removeSection = useBuilderStore((s) => s.removeSection)
  const saveSectionAsBlock = useBuilderStore((s) => s.saveSectionAsBlock)

  // One entity per section: `useSortable` registers both the draggable and the
  // droppable under this id. Registering a companion `useDroppable` on the same
  // id would create a duplicate droppable and make target resolution ambiguous.
  const sortable = useSortableSection({
    instanceId: instance.id,
    index,
    disabled: canvasPreview,
  })

  const def = sectionRegistry.get(instance.sectionId)
  const C = def?.Component
  const sectionContentRef = useRef<HTMLDivElement | null>(null)
  // Always instrument regardless of preview mode so CSS rules targeting
  // data-element-id work in both edit and preview states.
  useInstrumentSection(sectionContentRef, instance.id, false)

  return (
    <div
      ref={sortable.ref}
      data-section-instance-id={instance.id}
      // Hover state is drawn by <TargetDropIndicator>, so a drag passing over
      // this section never re-renders it.
      {...dragStateAttrs({ isDragSource: sortable.isDragSource })}
      className={cn(
        "group relative overflow-visible border border-transparent hover:z-10 hover:border-[#d1d5db]",
        "data-[drag-source]:z-50 data-[drag-source]:shadow-2xl data-[drag-source]:ring-2 data-[drag-source]:ring-[#4F28BA]/40",
        selectedSectionId === instance.id &&
          !canvasPreview &&
          "border-[#4F28BA] hover:border-[#4F28BA]"
      )}
    >
      {selectedSectionId === instance.id && !canvasPreview && def ? (
        <div className="pointer-events-none absolute -top-6 end-0 z-20 flex items-center gap-1 rounded-md bg-[#4F28BA] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow">
          {def.displayName ?? def.category ?? "Section"}
        </div>
      ) : null}
      {/* Insert above / below buttons */}
      {(["above", "below"] as const).map((pos) => (
        <button
          key={pos}
          type="button"
          aria-label={
            pos === "above" ? "Add section above" : "Add section below"
          }
          className={cn(
            "absolute start-1/2 z-51 flex size-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-[#4F28BA] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[#4F28BA]/90",
            pos === "above"
              ? "top-0 -translate-y-1/2"
              : "bottom-0 translate-y-1/2",
            canvasPreview && "hidden"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onInsert(pos === "above" ? index : index + 1)
          }}
        >
          <Plus className="size-3.5" />
        </button>
      ))}
      <div className={cn(SECTION_TOOLBAR, canvasPreview && "hidden")}>
        <button
          type="button"
          aria-label="Move section up"
          disabled={index <= 0}
          className={ICON_BTN}
          onClick={(e) => {
            e.stopPropagation()
            reorderSections(index, index - 1)
          }}
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Move section down"
          disabled={index >= total - 1}
          className={ICON_BTN}
          onClick={(e) => {
            e.stopPropagation()
            reorderSections(index, index + 1)
          }}
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Save section as block"
          className={ICON_BTN}
          onClick={(e) => {
            e.stopPropagation()
            const def = sectionRegistry.get(instance.sectionId)
            const name = def?.displayName ?? "Saved section"
            saveSectionAsBlock(instance.id, name)
            const block = lastSavedBlock()
            if (block) void persistSavedBlock(block)
            toast.success(`Saved "${name}" to your blocks`)
          }}
        >
          <Bookmark className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Delete section"
          className={ICON_BTN}
          onClick={(e) => {
            e.stopPropagation()
            removeSection(instance.id)
            setSelectedSection(null)
          }}
        >
          <Trash2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Drag to reorder ${def?.displayName ?? "section"}`}
          aria-roledescription="draggable section"
          ref={sortable.handleRef}
          {...HANDLE_ATTRS}
          className={cn(ICON_BTN, "cursor-grab active:cursor-grabbing")}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      {!canvasPreview && (
        <TargetDropIndicator id={sectionSortableId(instance.id)} />
      )}
      {aiLoadingKind && !canvasPreview && (
        <SectionLoadingOverlay
          kind={aiLoadingKind}
          error={aiError}
          onCancel={() => cancelSectionPreparation(instance.id)}
          onRetry={() => void prepareSectionInstance(instance.id, { force: true })}
        />
      )}
      <div
        ref={sectionContentRef}
        role="presentation"
        onClick={(e) => {
          e.stopPropagation()
          if (!canvasPreview) setSelectedSection(instance.id)
        }}
        className={cn(!canvasPreview && "cursor-pointer")}
      >
        <AnimationWrapper
          animation={instance.animation}
          sectionId={instance.id}
          isSelected={selectedSectionId === instance.id}
        >
          {C ? (
            <MemoSectionBody
              Component={C}
              instance={instance}
              isPreview={canvasPreview}
            />
          ) : (
            <div className="rounded border border-dashed border-[#ef4444]/50 p-8 text-center text-sm text-[#ef4444]">
              Unknown section: {instance.sectionId}
            </div>
          )}
          {instance.componentTree !== undefined ? (
            <CustomSectionSurface instanceId={instance.id}>
              <ComponentTreeRenderer
                sectionId={instance.id}
                tree={instance.componentTree}
                isPreview={canvasPreview}
              />
            </CustomSectionSurface>
          ) : null}
        </AnimationWrapper>
      </div>
    </div>
  )
})

function CanvasDropZone({
  children,
  widthClass,
}: {
  children: React.ReactNode
  widthClass: string
}) {
  const { ref, isDropTarget } = useDroppableCanvasRoot()
  return (
    <div
      ref={ref}
      {...dragStateAttrs({ isDropTarget })}
      className={cn(
        "relative mx-auto min-h-[calc(100dvh-85px)] w-full max-w-full rounded-lg border-2 border-dashed border-border bg-white shadow-sm duration-200 dark:bg-background",
        "data-[drop-target]:border-[#4F28BA]/40",
        widthClass
      )}
    >
      {children}
      <TargetDropIndicator id={CANVAS_DROP_ID} />
    </div>
  )
}

function SharedSectionSlot({
  instance,
  role,
}: {
  instance: SectionInstance
  role: "header" | "footer"
}) {
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const aiLoadingKind = useBuilderStore((s) => s.aiLoadingSections[instance.id])
  const aiError = useBuilderStore((s) => s.aiSectionErrors[instance.id])
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const setSelectedSection = useBuilderStore((s) => s.setSelectedSection)
  const setSharedHeader = useBuilderStore((s) => s.setSharedHeader)
  const setSharedFooter = useBuilderStore((s) => s.setSharedFooter)
  const saveSectionAsBlock = useBuilderStore((s) => s.saveSectionAsBlock)

  // Drag handle: lets the shared chrome be dragged into the page section flow
  // (detaches it from the shared slot) so e.g. a top bar can sit above the navbar.
  // The whole slot is the drag element (a copy stays behind while dragging);
  // only the handle starts the drag.
  const { ref, handleRef, isDragging } = useSharedChromeDrag(role)

  const def = sectionRegistry.get(instance.sectionId)
  const SectionComponent = def?.Component
  const isSelected = selectedSectionId === instance.id

  if (!SectionComponent) return null

  return (
    <div
      ref={ref}
      className={cn(
        "group relative",
        !canvasPreview && "cursor-pointer",
        isDragging && "opacity-85",
        !canvasPreview && isSelected && "ring-2 ring-[#4F28BA] ring-offset-1"
      )}
      data-section-id={instance.id}
      onClick={(e) => {
        if (canvasPreview) return
        e.stopPropagation()
        setSelectedSection(instance.id)
      }}
    >
      {!canvasPreview && (
        <div className="pointer-events-none absolute top-2 start-2 z-30 flex items-center gap-1.5 rounded-full bg-[#4F28BA] px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
          <span>
            Shared {role === "header" ? "Header" : "Footer"} · all pages
          </span>
        </div>
      )}
      {/* Section options toolbar — mirrors normal sections, but the move
          chevrons are disabled (shared chrome is pinned top/bottom; use the
          drag handle to detach it into the page flow). */}
      <div className={cn(SECTION_TOOLBAR, canvasPreview && "hidden")}>
        <button
          type="button"
          aria-label="Move section up"
          disabled
          className={ICON_BTN}
          title="Shared chrome can't be moved with arrows — drag it instead"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Move section down"
          disabled
          className={ICON_BTN}
          title="Shared chrome can't be moved with arrows — drag it instead"
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Save section as block"
          className={ICON_BTN}
          onClick={(e) => {
            e.stopPropagation()
            const name = def?.displayName ?? "Saved section"
            saveSectionAsBlock(instance.id, name)
            const block = lastSavedBlock()
            if (block) void persistSavedBlock(block)
            toast.success(`Saved "${name}" to your blocks`)
          }}
        >
          <Bookmark className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Remove shared ${role}`}
          className={ICON_BTN}
          title={`Remove shared ${role}`}
          onClick={(e) => {
            e.stopPropagation()
            if (role === "header") setSharedHeader(null)
            else setSharedFooter(null)
            if (selectedSectionId === instance.id) setSelectedSection(null)
          }}
        >
          <Trash2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Drag shared ${role} into the page`}
          aria-roledescription="draggable section"
          ref={handleRef}
          {...HANDLE_ATTRS}
          className={cn(ICON_BTN, "cursor-grab active:cursor-grabbing")}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      {aiLoadingKind && !canvasPreview && (
        <SectionLoadingOverlay
          kind={aiLoadingKind}
          error={aiError}
          onCancel={() => cancelSectionPreparation(instance.id)}
          onRetry={() => void prepareSectionInstance(instance.id, { force: true })}
        />
      )}
      <SectionComponent instance={instance} />
    </div>
  )
}

export function BuilderCanvas() {
  const rawSections = useBuilderStore((s) => s.sections)
  const builderLocale = useBuilderStore((s) => s.builderLocale)
  const defaultLocale = useBuilderStore((s) => s.defaultLocale)
  // Resolved for the active builder locale; identity reference when locale === default (no cost).
  const sections = useMemo(
    () => resolveSectionsForLocale(rawSections, builderLocale, defaultLocale),
    [rawSections, builderLocale, defaultLocale]
  )
  const canvasDir = localeDirection(builderLocale)
  const sharedHeader = useBuilderStore((s) => s.sharedHeader)
  const sharedFooter = useBuilderStore((s) => s.sharedFooter)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const pages = useBuilderStore((s) => s.pages)
  const activePage = pages.find((p) => p.id === activePageId)
  const showSharedHeader =
    sharedHeader !== null && (activePage?.useSharedHeader ?? true)
  const showSharedFooter =
    sharedFooter !== null && (activePage?.useSharedFooter ?? true)
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  const designSystem = useBuilderStore((s) => s.designSystem)
  const themeCss = useMemo(
    () => designSystemToThemeCss(designSystem),
    [designSystem]
  )
  const fontsHref = useMemo(
    () => designSystemFontsHref(designSystem),
    [designSystem]
  )
  const setSelectedSection = useBuilderStore((s) => s.setSelectedSection)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const hoveredElementId = useBuilderStore((s) => s.hoveredElementId)
  const multiSelectedElementIds = useBuilderStore(
    (s) => s.multiSelectedElementIds
  )
  const deleteMultiSelectedElements = useBuilderStore(
    (s) => s.deleteMultiSelectedElements
  )
  const setSelectedElement = useBuilderStore((s) => s.setSelectedElement)
  const setHoveredElement = useBuilderStore((s) => s.setHoveredElement)
  const removeComponentNode = useBuilderStore((s) => s.removeComponentNode)
  const removeSection = useBuilderStore((s) => s.removeSection)
  const elementStyles = useBuilderStore((s) => s.elementStyles)
  const elementBreakpointStyles = useBuilderStore(
    (s) => s.elementBreakpointStyles
  )
  const elementAttributes = useBuilderStore((s) => s.elementAttributes)
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint)
  const imagePreviewFor = useBuilderStore((s) => s.imagePreviewFor)

  // Hover-preview for bare <img> tags in pre-built sections.
  // SectionEditableImage handles its own preview via store subscription.
  // This effect covers auto-instrumented <img> elements that don't go through SectionEditableImage.
  useEffect(() => {
    if (!imagePreviewFor) return
    const escapedId = imagePreviewFor.elementId.replace(/"/g, '\\"')
    const el = document.querySelector<HTMLImageElement>(
      `[data-element-id="${escapedId}"]`
    )
    if (!el || el.tagName !== "IMG") return
    // Only handle elements that don't already react (no data-element-type="image" means not SectionEditableImage)
    if (el.getAttribute("data-element-type") === "image") return
    const original = el.src
    el.src = imagePreviewFor.url
    return () => {
      el.src = original
    }
  }, [imagePreviewFor])

  const [insertDialogOpen, setInsertDialogOpen] = useState(false)
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null)
  // Stable across renders so memoized sections don't re-render when a sibling changes.
  const openInsertDialogAt = useCallback((atIndex: number) => {
    setInsertAtIndex(atIndex)
    setInsertDialogOpen(true)
  }, [])
  const [hoverLabel, setHoverLabel] = useState<{
    x: number
    y: number
    text: string
  } | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedElement(null)
        setHoveredElement(null)
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isEditableDomTarget(e.target)) return
        const st = useBuilderStore.getState()
        // Bulk delete multi-selected elements first
        if (st.multiSelectedElementIds.length > 0) {
          e.preventDefault()
          st.deleteMultiSelectedElements()
          return
        }
        const elId = st.selectedElementId
        if (elId) {
          e.preventDefault()
          const sep = elId.indexOf("::")
          if (sep <= 0) return
          const sectionInstanceId = elId.slice(0, sep)
          const nodeId = elId.slice(sep + 2)
          if (!sectionInstanceId || !nodeId) return
          // Instrumented hardcoded JSX → soft-hide. Tree nodes → real removal.
          if (nodeId.startsWith("__i:")) {
            st.setElementHidden(elId, true)
            setSelectedElement(null)
            setHoveredElement(null)
            return
          }
          removeComponentNode(sectionInstanceId, nodeId)
          setSelectedElement(null)
          setHoveredElement(null)
          return
        }
        const secId = st.selectedSectionId
        if (secId) {
          e.preventDefault()
          removeSection(secId)
          setSelectedSection(null)
          setSelectedElement(null)
          setHoveredElement(null)
          toast.message("Section deleted", {
            duration: 5000,
            action: {
              label: "Undo",
              onClick: () => useBuilderStore.temporal.getState().undo(),
            },
          })
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setSelectedElement, setHoveredElement, removeComponentNode])

  const toggleMultiSelectElement = useBuilderStore(
    (s) => s.toggleMultiSelectElement
  )
  const clearMultiSelect = useBuilderStore((s) => s.clearMultiSelect)

  const handleElementClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (canvasPreview) return
      // Ignore clicks that originate inside the floating element popover
      // (it's portaled to <body> but React synthetic events still bubble
      // through the React parent tree). Just early-return — do NOT call
      // stopPropagation here, or the popover's own onClick handlers will
      // never fire. Also ignore clicks inside Radix-portaled overlays
      // opened from the popover (Select dropdowns, Dialogs), which render
      // outside the popover DOM but must not clear the selection.
      if (isInsideBuilderOverlay(e.target as HTMLElement)) {
        return
      }
      // A drag handle is not content: grabbing one must not select the parent
      // element it sits inside.
      if ((e.target as HTMLElement).closest(`[${DRAG_HANDLE_ATTR}]`)) {
        return
      }
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-element-id]"
      )
      if (el?.dataset.elementId) {
        // For shadcn interactive components: plain click = component interaction (no builder selection).
        // Alt+click = builder selection. This mirrors Webflow's interaction model (D-04).
        const isShadcnInteractive = el.hasAttribute("data-shadcn-interactive")
        if (isShadcnInteractive && !e.altKey) return

        // Shift+click toggles multi-select without changing primary selection
        if (e.shiftKey) {
          toggleMultiSelectElement(el.dataset.elementId)
          return
        }
        // Normal click clears multi-select and sets primary selection
        clearMultiSelect()
        setSelectedElement(el.dataset.elementId)
        const sectionInstanceId = el.dataset.elementId.split("::")[0]
        if (sectionInstanceId) setSelectedSection(sectionInstanceId)
        return
      }
      clearMultiSelect()
      setSelectedElement(null)
      setHoveredElement(null)
    },
    [
      canvasPreview,
      setSelectedElement,
      setHoveredElement,
      setSelectedSection,
      toggleMultiSelectElement,
      clearMultiSelect,
    ]
  )

  const handleElementHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (canvasPreview) return
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-element-id]"
      )
      const newId = el?.dataset.elementId ?? null
      setHoveredElement(newId)
      if (el && newId && newId !== selectedElementId) {
        const r = el.getBoundingClientRect()
        const tag = el.getAttribute("data-builder-tag") ?? "element"
        setHoverLabel({ x: r.left, y: r.top - 22, text: tag })
      } else {
        setHoverLabel(null)
      }
    },
    [canvasPreview, setHoveredElement, selectedElementId]
  )

  const handleElementMouseLeave = useCallback(() => {
    if (canvasPreview) return
    setHoveredElement(null)
    setHoverLabel(null)
  }, [canvasPreview, setHoveredElement])

  const widthClass = useMemo(() => {
    if (deviceMode === "mobile") return "max-w-[390px]"
    if (deviceMode === "tablet") return "max-w-[820px]"
    return "max-w-full"
  }, [deviceMode])

  // A page is "empty" when it only carries chrome (navbar/footer) and no body
  // content. In that case we render breathing room between the navbar and footer
  // so they aren't stacked directly on top of each other.
  const bodyIsEmpty = useMemo(
    () =>
      sections.length > 0 &&
      sections.every(
        (s) =>
          s.sectionId.startsWith("navbar-") || s.sectionId.startsWith("footer-")
      ),
    [sections]
  )
  const firstFooterIndex = useMemo(
    () => sections.findIndex((s) => s.sectionId.startsWith("footer-")),
    [sections]
  )

  // Memoize element-override CSS separately from the design-system theme CSS.
  // Runs in both editing and preview modes so hidden elements and user styles
  // are always applied. In preview we use display:none; in edit mode we use
  // the faded placeholder so users can still see and select the element.
  const elementOverrideCss = useMemo(() => {
    const allIds = new Set<string>([
      ...Object.keys(elementStyles),
      ...Object.keys(elementBreakpointStyles),
      ...Object.keys(elementAttributes),
    ])
    const out: string[] = []
    for (const id of allIds) {
      const desktop = elementStyles[id]
      const override =
        activeBreakpoint !== "desktop"
          ? elementBreakpointStyles[id]?.[activeBreakpoint]
          : undefined
      const merged = {
        ...(desktop ?? {}),
        ...(override ?? {}),
      } as React.CSSProperties
      const body = styleObjectToCssText(merged)
      const attr = elementAttributes[id]
      const hidden = attr?.visibility === "hidden"
      if (!body && !hidden) continue
      const decls: string[] = []
      if (body) decls.push(`${body} !important`)
      if (hidden) {
        if (canvasPreview) {
          // Real hidden in preview — matches publish behaviour
          decls.push("display: none !important")
        } else {
          // Faded placeholder in edit mode — element stays selectable
          decls.push(
            "opacity: 0.35 !important; outline: 1px dashed color-mix(in srgb, var(--builder-primary) 60%, transparent) !important; pointer-events: none"
          )
        }
      }
      out.push(`[data-element-id="${id}"] { ${decls.join("; ")} }`)
    }
    return out.join("\n")
  }, [
    canvasPreview,
    elementStyles,
    elementBreakpointStyles,
    elementAttributes,
    activeBreakpoint,
  ])

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f1f5f9] p-4 [--dnd-indicator:var(--builder-primary)] dark:bg-background"
      onClick={(e) => {
        if (canvasPreview) return
        if (isInsideBuilderOverlay(e.target as HTMLElement)) return
        setSelectedSection(null)
      }}
      onClickCapture={!canvasPreview ? handleElementClick : undefined}
      onMouseOver={!canvasPreview ? handleElementHover : undefined}
      onMouseLeave={!canvasPreview ? handleElementMouseLeave : undefined}
    >
      <ScrollArea className="h-[calc(100dvh-52px)]">
        <div
          dir={canvasDir}
          className={`flex flex-col gap-4 overflow-x-clip overflow-y-visible bg-white pb-8 text-[#0f172a] dark:bg-background ${SITE_THEME_ROOT_CLASS}`}
        >
          {fontsHref ? (
            <link rel="stylesheet" href={fontsHref} />
          ) : null}
          {themeCss ? <style>{themeCss}</style> : null}
          {/* Static perf rules: CSS containment on section roots */}
          <style>{`[data-section-instance-id] { contain: layout style; }`}</style>
          {elementOverrideCss && <style>{elementOverrideCss}</style>}
          {!canvasPreview && (selectedElementId || hoveredElementId) && (
            <style>{`
              [data-element-id="${selectedElementId}"] {
                outline: 2px solid var(--builder-primary) !important;
                outline-offset: -1px;
              }
              [data-element-id="${hoveredElementId}"]:not([data-element-id="${selectedElementId}"]) {
                outline: 1px solid color-mix(in srgb, var(--builder-primary) 55%, transparent) !important;
                outline-offset: -1px;
              }
              [data-element-id="${hoveredElementId}"][data-element-container] > [data-element-id]:not([data-element-id="${selectedElementId}"]) {
                outline: 0.5px dashed color-mix(in srgb, var(--builder-primary) 45%, transparent) !important;
                outline-offset: -1px;
              }
            `}</style>
          )}
          {!canvasPreview && hoverLabel ? (
            <div
              className="pointer-events-none fixed z-51 flex items-center gap-1 rounded-sm bg-[#4F28BA] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow"
              style={{
                backgroundColor: "#4F28BA",
                left: hoverLabel.x,
                top: hoverLabel.y,
              }}
            >
              {hoverLabel.text}
            </div>
          ) : null}
          {!canvasPreview && <ElementResizeOverlay />}
          {!canvasPreview && <ElementRadiusOverlay />}
          {!canvasPreview && <FlexGapOverlay />}
          <InjectedChildrenLayer />
          {!canvasPreview && <ElementPopover />}
          {!canvasPreview && <SelectedElementBadge />}
          {!canvasPreview && <AlignmentGuides />}
          {!canvasPreview && (
            /* The lifted element as a static rule rather than per-node class
               recomputation. dnd-kit sets [data-dnd-dragging] on whatever
               follows the pointer (a moved section or the drag overlay).
               Drop targets draw their own indicator (<DndDropIndicator>). */
            <style>{`
              [data-dnd-dragging] {
                transform-origin: center top;
                box-shadow: 0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10);
                outline: 2px solid var(--builder-primary) !important;
                outline-offset: 2px;
                border-radius: 4px;
                will-change: transform;
              }
            `}</style>
          )}
          {!canvasPreview && multiSelectedElementIds.length > 0 && (
            <style>
              {multiSelectedElementIds
                .map(
                  (id) =>
                    `[data-element-id="${id}"] { outline: 2px dashed var(--builder-primary) !important; outline-offset: 2px; }`
                )
                .join("\n")}
            </style>
          )}
          {!canvasPreview && multiSelectedElementIds.length > 1 && (
            <div className="pointer-events-auto fixed bottom-6 start-1/2 z-200 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 shadow-lg">
              <span className="text-xs font-medium text-[#64748b]">
                {multiSelectedElementIds.length} elements selected
              </span>
              <CanvasBtn
                className="h-6 rounded-full px-3 text-xs"
                onClick={deleteMultiSelectedElements}
              >
                <Trash2 className="me-1 size-3" />
                Delete all
              </CanvasBtn>
              <CanvasBtn
                className="h-6 rounded-full px-3 text-xs"
                onClick={() => useBuilderStore.getState().clearMultiSelect()}
              >
                Clear
              </CanvasBtn>
            </div>
          )}
          <CanvasContextMenu>
            <CanvasDropZone widthClass={widthClass}>
              <div className="relative">
                {!canvasPreview && <CanvasGridOverlay />}
                {showSharedHeader && (
                  <SharedSectionSlot instance={sharedHeader!} role="header" />
                )}
                <div className="flex flex-1 flex-col gap-0">
                  {sections.length === 0 &&
                    !showSharedHeader &&
                    !showSharedFooter && (
                      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
                        <p className="text-sm text-[#64748b]">
                          No sections yet
                        </p>
                        <CanvasBtn
                          onClick={(e) => {
                            e.stopPropagation()
                            setInsertDialogOpen(true)
                          }}
                        >
                          <Plus className="me-2 size-4" />
                          Add Section
                        </CanvasBtn>
                      </div>
                    )}
                  {sections.length === 0 &&
                    (showSharedHeader || showSharedFooter) && (
                      <div className="flex flex-1 items-center justify-center py-8">
                        <CanvasBtn
                          onClick={(e) => {
                            e.stopPropagation()
                            setInsertDialogOpen(true)
                          }}
                          className="flex items-center"
                        >
                          <Plus className="me-2 size-4" />
                          Add page content
                        </CanvasBtn>
                      </div>
                    )}
                  {sections.map((instance, index) => (
                      <Fragment key={instance.id}>
                        {bodyIsEmpty && index === firstFooterIndex && (
                          <div className="flex min-h-[320px] flex-1 items-center justify-center py-8">
                            {!canvasPreview && (
                              <CanvasBtn
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInsertAtIndex(firstFooterIndex)
                                  setInsertDialogOpen(true)
                                }}
                              >
                                <Plus className="me-2 size-4" />
                                Add page content
                              </CanvasBtn>
                            )}
                          </div>
                        )}
                        <SortableSection
                          instance={instance}
                          index={index}
                          total={sections.length}
                          onInsert={openInsertDialogAt}
                        />
                      </Fragment>
                    ))}
                  {!canvasPreview && sections.length > 0 && (
                    <div className="flex justify-center py-4 dark:bg-background">
                      <CanvasBtn
                        onClick={(e) => {
                          e.stopPropagation()
                          setInsertDialogOpen(true)
                        }}
                      >
                        <Plus className="me-2 size-4" />
                        Add Section
                      </CanvasBtn>
                    </div>
                  )}
                </div>
                {showSharedFooter && (
                  <SharedSectionSlot instance={sharedFooter!} role="footer" />
                )}
              </div>
            </CanvasDropZone>
          </CanvasContextMenu>
          <SectionInsertDialog
            open={insertDialogOpen}
            onOpenChange={(open) => {
              setInsertDialogOpen(open)
              if (!open) setInsertAtIndex(null)
            }}
            atIndex={insertAtIndex ?? undefined}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
