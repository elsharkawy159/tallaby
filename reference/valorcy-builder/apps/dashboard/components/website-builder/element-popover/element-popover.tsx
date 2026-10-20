"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Eye, EyeOff, GripHorizontal, Trash2, X } from "lucide-react"
import { useBuilderStore } from "@/lib/builder/store"
import { findComponentNodeInTree } from "@/lib/builder/find-tree-node"
import {
  componentStyleToCss,
  getEffectiveComponentStyleForBreakpoint,
  type ComponentStyle,
  type DeepPartial,
} from "@/lib/builder/component-style"
import {
  isContainerType,
  type ComponentNode,
  type ShadcnComponentType,
} from "@/lib/builder/component-node"
import { TypographyControls } from "./controls/typography-controls"
import { ImageControls } from "./controls/image-controls"
import { ButtonControls } from "./controls/button-controls"
import { ContainerControls } from "./controls/container-controls"
import { LinkControls } from "./controls/link-controls"
import { FormFieldControls } from "./controls/form-field-controls"
import { MediaControls } from "./controls/media-controls"
import { ListControls } from "./controls/list-controls"
import { TextPropControls } from "./controls/text-prop-controls"
import { clampToViewport, computePopoverPlacement } from "./popover-placement"

const PANEL_WIDTH = 380
const PANEL_MARGIN = 8
/** Upper bound for the scrollable body, as a share of the viewport height. */
const MAX_BODY_VIEWPORT_RATIO = 0.6

const TYPOGRAPHY_TYPES = new Set<ShadcnComponentType>([
  "text",
  "heading",
  "paragraph",
  "blockQuote",
  "label",
  "textLink",
  "listItem",
  "richText",
])

const FORM_FIELD_TYPES = new Set<ShadcnComponentType>([
  "input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "search",
  "colorInput",
  "label",
])

const LINK_TYPES = new Set<ShadcnComponentType>(["textLink", "linkBlock"])

const MEDIA_TYPES = new Set<ShadcnComponentType>(["video", "map"])

const LIST_TYPES = new Set<ShadcnComponentType>(["list"])

function parseElementId(
  id: string
): { sectionInstId: string; nodeId: string } | null {
  const sep = id.indexOf("::")
  if (sep <= 0) return null
  return { sectionInstId: id.slice(0, sep), nodeId: id.slice(sep + 2) }
}

function useAnchorRect(elementId: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!elementId) {
      setRect(null)
      return
    }
    let raf = 0
    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-element-id="${CSS.escape(elementId)}"]`
      )
      setRect(el ? el.getBoundingClientRect() : null)
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    schedule()
    const onScroll = () => schedule()
    const onResize = () => schedule()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    const obs = new MutationObserver(schedule)
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      obs.disconnect()
    }
  }, [elementId])

  return rect
}

type ControlsCtx = {
  node: ComponentNode
  style: Partial<ComponentStyle>
  projectId: string | null
  onStyle: (patch: DeepPartial<ComponentStyle>) => void
  onProps: (patch: Record<string, unknown>) => void
}

function renderControlsForNode(
  ctx: ControlsCtx
): { title: string; body: React.ReactNode } | null {
  const { node, style, projectId, onStyle, onProps } = ctx
  const sections: React.ReactNode[] = []
  let title = node.type as string

  // Image gets its own dedicated panel (uploader + dimensions).
  if (node.type === "image") {
    return {
      title: "Image",
      body: (
        <ImageControls
          projectId={projectId}
          src={String(node.props.src ?? "")}
          alt={String(node.props.alt ?? "")}
          style={style}
          onProps={onProps}
          onStyle={onStyle}
        />
      ),
    }
  }

  // Buttons get the rich variant + size + link panel.
  if (node.type === "button") {
    return {
      title: "Button",
      body: (
        <ButtonControls
          variant={String(node.props.variant ?? "default")}
          href={String(node.props.href ?? "")}
          style={style}
          onProps={onProps}
          onStyle={onStyle}
        />
      ),
    }
  }

  if (TYPOGRAPHY_TYPES.has(node.type)) {
    title = "Text"
    sections.push(
      <TypographyControls key="typo" style={style} onPatch={onStyle} />
    )
  }

  if (LINK_TYPES.has(node.type)) {
    title = "Link"
    sections.push(
      <LinkControls
        key="link"
        href={String(node.props.href ?? "")}
        target={String(node.props.target ?? "")}
        onProps={onProps}
      />
    )
  }

  if (FORM_FIELD_TYPES.has(node.type)) {
    title = node.type === "label" ? "Label" : "Field"
    sections.push(
      <FormFieldControls
        key="form"
        type={node.type}
        props={node.props}
        onProps={onProps}
      />
    )
  }

  if (MEDIA_TYPES.has(node.type)) {
    title = node.type === "map" ? "Map" : "Video"
    sections.push(
      <MediaControls
        key="media"
        type={node.type}
        props={node.props}
        onProps={onProps}
      />
    )
  }

  if (LIST_TYPES.has(node.type)) {
    title = "List"
    sections.push(<ListControls key="list" style={style} onStyle={onStyle} />)
  }

  if (node.type === "shadcn-badge") {
    title = "Badge"
    sections.push(
      <TextPropControls
        key="badge"
        fields={["text", "variant"]}
        props={node.props}
        onProps={onProps}
      />
    )
  }
  if (node.type === "shadcn-alert") {
    title = "Alert"
    sections.push(
      <TextPropControls
        key="alert"
        fields={["title", "description"]}
        props={node.props}
        onProps={onProps}
      />
    )
  }
  if (node.type === "shadcn-avatar") {
    title = "Avatar"
    sections.push(
      <TextPropControls
        key="avatar"
        fields={["fallback"]}
        props={node.props}
        onProps={onProps}
      />
    )
  }
  if (node.type === "shadcn-progress") {
    title = "Progress"
    sections.push(
      <TextPropControls
        key="progress"
        fields={["value"]}
        props={node.props}
        onProps={onProps}
      />
    )
  }
  if (node.type === "shadcn-tooltip") {
    title = "Tooltip"
    sections.push(
      <TextPropControls
        key="tt"
        fields={["triggerLabel", "content"]}
        props={node.props}
        onProps={onProps}
      />
    )
  }
  if (node.type === "shadcn-dialog") {
    title = "Dialog"
    sections.push(
      <TextPropControls
        key="dlg"
        fields={["triggerLabel"]}
        props={node.props}
        onProps={onProps}
      />
    )
  }

  // Container layout controls — always shown for container types so clicking
  // any div/stack/grid/card opens real layout controls in the popover.
  if (isContainerType(node.type)) {
    sections.push(
      <ContainerControls key="container" style={style} onStyle={onStyle} />
    )
  }

  if (sections.length === 0) return null
  return { title, body: <>{sections}</> }
}

/**
 * Read data-element-*-prop attributes (top-level section props).
 * e.g. data-element-href-prop="ctaHref"  →  { href: "ctaHref" }
 */
function readDomPropMap(el: HTMLElement): Record<string, string> {
  const map: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    if (
      attr.name.startsWith("data-element-") &&
      attr.name.endsWith("-prop") &&
      !attr.name.startsWith("data-element-item-")
    ) {
      const nodePropKey = attr.name.slice(
        "data-element-".length,
        -"-prop".length
      )
      map[nodePropKey] = attr.value
    }
  }
  return map
}

/**
 * Read data-element-item-*-prop attributes (collection item props).
 * e.g. data-element-item-href-prop="href"  →  { href: "href" }
 */
function readDomItemPropMap(el: HTMLElement): Record<string, string> {
  const map: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    if (
      attr.name.startsWith("data-element-item-") &&
      attr.name.endsWith("-prop")
    ) {
      const nodePropKey = attr.name.slice(
        "data-element-item-".length,
        -"-prop".length
      )
      map[nodePropKey] = attr.value
    }
  }
  return map
}

type StaticElementInfo = {
  node: ComponentNode
  /** Top-level section prop mapping: nodePropKey → sectionPropKey */
  propMap: Record<string, string>
  /** Collection item prop mapping: nodePropKey → itemPropKey */
  itemPropMap: Record<string, string>
  /** itemCollections key, e.g. "links" */
  collectionKey: string | null
  /** Index within the collection */
  collectionIndex: number | null
}

export function ElementPopover() {
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const sections = useBuilderStore((s) => s.sections)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  const projectId = useBuilderStore((s) => s.projectId)
  const elementStyles = useBuilderStore((s) => s.elementStyles)
  const updateComponentNodeStyle = useBuilderStore(
    (s) => s.updateComponentNodeStyle
  )
  const updateComponentNodeProps = useBuilderStore(
    (s) => s.updateComponentNodeProps
  )
  const updateElementStyle = useBuilderStore((s) => s.updateElementStyle)
  const updateSectionProps = useBuilderStore((s) => s.updateSectionProps)
  const updateItem = useBuilderStore((s) => s.updateItem)
  const removeItem = useBuilderStore((s) => s.removeItem)
  const duplicateItem = useBuilderStore((s) => s.duplicateItem)

  const parsed = selectedElementId ? parseElementId(selectedElementId) : null

  const node = useMemo<ComponentNode | undefined>(() => {
    if (!parsed) return undefined
    const section = sections.find((s) => s.id === parsed.sectionInstId)
    if (!section?.componentTree) return undefined
    return findComponentNodeInTree(section.componentTree, parsed.nodeId)
  }, [parsed, sections])

  const effectiveStyle = useMemo<Partial<ComponentStyle>>(() => {
    if (!node) return {}
    return getEffectiveComponentStyleForBreakpoint(
      node.style,
      {},
      node.breakpointStyles,
      deviceMode
    )
  }, [node, deviceMode])

  const rect = useAnchorRect(canvasPreview ? null : selectedElementId)

  // ── Static-element fallback ────────────────────────────────────────────────
  // For elements in static/hardcoded sections (no componentTree), build a
  // virtual ComponentNode from data-element-* DOM attributes so the existing
  // control panels render without modification. Supports both top-level section
  // props and itemCollections entries via data-element-collection/index attrs.
  const staticInfo = useMemo<StaticElementInfo | null>(() => {
    if (node || !parsed || !rect) return null
    const el = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId ?? "")}"]`
    )
    if (!el) return null

    // data-element-type is set by section components that explicitly expose
    // editable props. Instrumented elements use data-element-kind instead.
    // Map kind → closest ShadcnComponentType so controls render correctly.
    const KIND_TO_TYPE: Record<string, string> = {
      button: "button",
      heading: "heading",
      text: "text",
      image: "image",
      link: "textLink",
      list: "list",
      item: "listItem",
      stack: "hFlex",
      grid: "grid",
      container: "div",
      icon: "div",
    }
    const elType =
      el.dataset.elementType ?? KIND_TO_TYPE[el.dataset.elementKind ?? ""]
    if (!elType) return null

    const propMap = readDomPropMap(el)
    const itemPropMap = readDomItemPropMap(el)
    const collectionKey = el.dataset.elementCollection ?? null
    const collectionIndex =
      el.dataset.elementIndex !== undefined
        ? parseInt(el.dataset.elementIndex, 10)
        : null

    const section = sections.find((s) => s.id === parsed.sectionInstId)
    const props: Record<string, unknown> = {}

    // Top-level section props (e.g. ctaHref → href)
    for (const [nodePropKey, sectionPropKey] of Object.entries(propMap)) {
      props[nodePropKey] = section?.props[sectionPropKey] ?? ""
    }

    // Collection item props (e.g. links[i].href → href)
    if (collectionKey !== null && collectionIndex !== null) {
      const collection = (section?.props[collectionKey] ?? []) as Record<
        string,
        unknown
      >[]
      const item = collection[collectionIndex] ?? {}
      for (const [nodePropKey, itemPropKey] of Object.entries(itemPropMap)) {
        props[nodePropKey] = item[itemPropKey] ?? ""
      }
    }

    return {
      propMap,
      itemPropMap,
      collectionKey,
      collectionIndex,
      node: {
        id: parsed.nodeId,
        type: elType as ComponentNode["type"],
        props,
        style: {},
        breakpointStyles: {},
        children: [],
      },
    }
  }, [node, parsed, rect, sections, selectedElementId])

  const staticStyle = useMemo<Partial<ComponentStyle>>(() => {
    if (!staticInfo || !selectedElementId) return {}
    // Merge computed DOM style as defaults so controls pre-populate from
    // Tailwind classes / cascade even when no overrides have been stored.
    const el = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId)}"]`
    )
    const computed: Partial<ComponentStyle> = {}
    if (el) {
      const cs = window.getComputedStyle(el)
      const pick = (prop: string) =>
        cs.getPropertyValue(prop).trim() || undefined
      const flexKeys: Record<string, string> = {
        display: "display",
        flexDirection: "flex-direction",
        justifyContent: "justify-content",
        alignItems: "align-items",
        gap: "gap",
        flexWrap: "flex-wrap",
        backgroundColor: "background-color",
        borderRadius: "border-radius",
        padding: "padding",
        color: "color",
        fontSize: "font-size",
        fontWeight: "font-weight",
        opacity: "opacity",
      }
      for (const [key, cssProp] of Object.entries(flexKeys)) {
        const v = pick(cssProp)
        if (
          v &&
          v !== "none" &&
          v !== "normal" &&
          v !== "auto" &&
          v !== "rgba(0, 0, 0, 0)"
        ) {
          ;(computed as Record<string, string>)[key] = v
        }
      }
    }
    // Stored overrides win over computed defaults.
    return {
      ...computed,
      ...(elementStyles[selectedElementId] ?? {}),
    } as Partial<ComponentStyle>
  }, [staticInfo, selectedElementId, elementStyles])
  // ──────────────────────────────────────────────────────────────────────────

  const activeNode = node ?? staticInfo?.node
  // For pure-instrumented elements (no componentTree node, no static prop map),
  // we still want the popover so users can Duplicate / Hide / Delete. We render
  // an actions-only panel below.
  if (canvasPreview || !parsed || !rect) return null
  if (!activeNode) {
    return (
      <ElementPopoverPanel
        title="Element"
        body={null}
        collectionActions={null}
        anchorRect={rect}
        selectedElementId={selectedElementId}
      />
    )
  }

  let onStyle: (patch: DeepPartial<ComponentStyle>) => void
  let onProps: (patch: Record<string, unknown>) => void

  if (node) {
    // componentTree element — existing path
    onStyle = (patch) =>
      updateComponentNodeStyle(parsed.sectionInstId, parsed.nodeId, patch)
    onProps = (patch) =>
      updateComponentNodeProps(parsed.sectionInstId, parsed.nodeId, patch)
  } else {
    // Static / instrumented element — route style → elementStyles, props → section/item.
    // Auto-coerce display:flex when flex layout properties are patched so controls
    // work even on block-level elements that haven't been explicitly set to flex.
    const FLEX_TRIGGER_KEYS = new Set([
      "justifyContent",
      "alignItems",
      "flexDirection",
      "flexWrap",
      "gap",
    ])
    onStyle = (patch) => {
      if (!selectedElementId) return
      const needsFlex = Object.keys(patch).some((k) => FLEX_TRIGGER_KEYS.has(k))
      const el = needsFlex
        ? document.querySelector<HTMLElement>(
            `[data-element-id="${CSS.escape(selectedElementId)}"]`
          )
        : null
      const currentDisplay = el ? window.getComputedStyle(el).display : "block"
      const merged: DeepPartial<ComponentStyle> =
        needsFlex &&
        !currentDisplay.includes("flex") &&
        !currentDisplay.includes("grid")
          ? { display: "flex", ...patch }
          : patch
      updateElementStyle(
        selectedElementId,
        componentStyleToCss(merged as ComponentStyle)
      )
    }
    onProps = (patch) => {
      if (!staticInfo) return
      const sectionPatch: Record<string, unknown> = {}
      const itemPatch: Record<string, unknown> = {}

      for (const [nodePropKey, value] of Object.entries(patch)) {
        const itemPropKey = staticInfo.itemPropMap[nodePropKey]
        const sectionPropKey = staticInfo.propMap[nodePropKey]
        if (itemPropKey !== undefined) {
          itemPatch[itemPropKey] = value
        } else if (sectionPropKey !== undefined) {
          sectionPatch[sectionPropKey] = value
        }
      }

      if (
        Object.keys(itemPatch).length > 0 &&
        staticInfo.collectionKey &&
        staticInfo.collectionIndex !== null
      ) {
        updateItem(
          parsed.sectionInstId,
          staticInfo.collectionKey,
          staticInfo.collectionIndex,
          itemPatch
        )
      }
      if (Object.keys(sectionPatch).length > 0) {
        updateSectionProps(parsed.sectionInstId, sectionPatch)
      }
    }
  }

  const rendered = renderControlsForNode({
    node: activeNode,
    style: node ? effectiveStyle : staticStyle,
    projectId,
    onStyle,
    onProps,
  })

  // Collection item actions (delete / duplicate) shown for static elements only
  const collectionActions =
    !node &&
    staticInfo?.collectionKey &&
    staticInfo.collectionIndex !== null ? (
      <div className="mt-1 flex gap-1.5 border-t border-border/60 pt-2">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            removeItem(
              parsed.sectionInstId,
              staticInfo.collectionKey!,
              staticInfo.collectionIndex!
            )
            useBuilderStore.getState().setSelectedElement(null)
          }}
        >
          <Trash2 className="size-3" />
          Delete
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() =>
            duplicateItem(
              parsed.sectionInstId,
              staticInfo.collectionKey!,
              staticInfo.collectionIndex!
            )
          }
        >
          <Copy className="size-3" />
          Duplicate
        </button>
      </div>
    ) : null

  const title = rendered?.title ?? "Element"
  const body = rendered?.body ?? null

  return (
    <ElementPopoverPanel
      title={title}
      body={body}
      collectionActions={collectionActions}
      anchorRect={rect}
      selectedElementId={selectedElementId}
    />
  )
}

function ElementPopoverPanel({
  title,
  body,
  collectionActions,
  anchorRect,
  selectedElementId,
}: {
  title: string
  body: React.ReactNode
  collectionActions: React.ReactNode
  anchorRect: DOMRect | null
  selectedElementId: string | null
}) {
  const setSelectedElement = useBuilderStore((s) => s.setSelectedElement)
  const setElementHidden = useBuilderStore((s) => s.setElementHidden)
  const duplicateElement = useBuilderStore((s) => s.duplicateElement)
  const removeComponentNode = useBuilderStore((s) => s.removeComponentNode)
  const elementAttributes = useBuilderStore((s) => s.elementAttributes)
  const isHidden = selectedElementId
    ? elementAttributes[selectedElementId]?.visibility === "hidden"
    : false
  const isInstrumented = selectedElementId?.includes("::__i:") ?? false

  const onDuplicate = () => {
    if (!selectedElementId) return
    duplicateElement(selectedElementId)
  }
  const onToggleVisibility = () => {
    if (!selectedElementId) return
    setElementHidden(selectedElementId, !isHidden)
  }
  const onDelete = () => {
    if (!selectedElementId) return
    if (isInstrumented) {
      setElementHidden(selectedElementId, true)
    } else {
      const sep = selectedElementId.indexOf("::")
      if (sep > 0) {
        const sectionInstanceId = selectedElementId.slice(0, sep)
        const nodeId = selectedElementId.slice(sep + 2)
        removeComponentNode(sectionInstanceId, nodeId)
      }
    }
    setSelectedElement(null)
  }

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const dragStartRef = useRef<{
    mx: number
    my: number
    ox: number
    oy: number
  } | null>(null)

  // Reset drag offset when selection changes
  const prevIdRef = useRef(selectedElementId)
  if (prevIdRef.current !== selectedElementId) {
    prevIdRef.current = selectedElementId
    if (dragOffset.x !== 0 || dragOffset.y !== 0) {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      dragStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        ox: dragOffset.x,
        oy: dragOffset.y,
      }
    },
    [dragOffset]
  )

  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.mx
    const dy = e.clientY - dragStartRef.current.my
    setDragOffset({
      x: dragStartRef.current.ox + dx,
      y: dragStartRef.current.oy + dy,
    })
  }, [])

  const onHandlePointerUp = useCallback(() => {
    dragStartRef.current = null
  }, [])

  // Measure the panel's natural size so placement can keep it clear of the
  // selected element (an estimate made it overlap tall panels / elements).
  const panelRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)
  const [measured, setMeasured] = useState({ height: 240, chrome: 56 })
  const hasBody = Boolean(body)
  const hasActions = Boolean(collectionActions)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const measure = () => {
      const cs = window.getComputedStyle(panel)
      const gap = parseFloat(cs.rowGap) || 0
      const blocks = 1 + (contentRef.current ? 1 : 0) + (actionsRef.current ? 1 : 0)
      const chrome =
        (parseFloat(cs.paddingTop) || 0) +
        (parseFloat(cs.paddingBottom) || 0) +
        (parseFloat(cs.borderTopWidth) || 0) +
        (parseFloat(cs.borderBottomWidth) || 0) +
        (headerRef.current?.offsetHeight ?? 0) +
        (actionsRef.current?.offsetHeight ?? 0) +
        gap * (blocks - 1)
      const content = Math.min(
        contentRef.current?.offsetHeight ?? 0,
        window.innerHeight * MAX_BODY_VIEWPORT_RATIO
      )
      const height = Math.ceil(chrome + content)
      const roundedChrome = Math.ceil(chrome)
      setMeasured((prev) =>
        prev.height === height && prev.chrome === roundedChrome
          ? prev
          : { height, chrome: roundedChrome }
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    for (const el of [headerRef.current, contentRef.current, actionsRef.current]) {
      if (el) ro.observe(el)
    }
    return () => ro.disconnect()
  }, [selectedElementId, hasBody, hasActions])

  if (!anchorRect) return null

  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const placement = computePopoverPlacement({
    anchor: anchorRect,
    viewport,
    width: PANEL_WIDTH,
    height: measured.height,
    chromeHeight: measured.chrome,
    margin: PANEL_MARGIN,
  })
  const renderedHeight =
    placement.bodyMaxHeight === null
      ? measured.height
      : measured.chrome + placement.bodyMaxHeight
  const hasDrag = dragOffset.x !== 0 || dragOffset.y !== 0
  const { top: panelTop, left: panelLeft } = hasDrag
    ? clampToViewport(
        placement.top + dragOffset.y,
        placement.left + dragOffset.x,
        { width: placement.width, height: renderedHeight },
        viewport,
        PANEL_MARGIN
      )
    : placement
  const bodyMaxHeight = Math.min(
    placement.bodyMaxHeight ?? Number.POSITIVE_INFINITY,
    viewport.height * MAX_BODY_VIEWPORT_RATIO
  )

  const ACTION_BTN =
    "pointer-events-auto inline-flex h-7 w-10 items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"

  const panel = (
    <AnimatePresence>
      <motion.div
        key={selectedElementId ?? "none"}
        ref={panelRef}
        role="dialog"
        aria-label={`${title} properties`}
        data-builder-popover=""
        initial={{ opacity: 0, scale: 0.96, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 2 }}
        transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed z-200 flex flex-col gap-2 rounded-xl border border-border bg-popover p-2.5 text-popover-foreground shadow-2xl ring-1 ring-black/5"
        style={{ top: panelTop, left: panelLeft, width: placement.width }}
      >
        <div
          ref={headerRef}
          className="flex cursor-grab items-center gap-2 border-b border-border/60 pb-2 active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        >
          <GripHorizontal className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="flex-1 truncate text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </span>
          <div
            className="flex items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Duplicate"
              title="Duplicate"
              className={ACTION_BTN}
              onClick={onDuplicate}
            >
              <Copy className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={isHidden ? "Show" : "Hide"}
              title={isHidden ? "Show" : "Hide"}
              className={ACTION_BTN}
              onClick={onToggleVisibility}
            >
              {isHidden ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Delete"
              title={isInstrumented ? "Hide (soft delete)" : "Delete"}
              className={`${ACTION_BTN} hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive`}
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Close"
              title="Close"
              className={ACTION_BTN}
              onClick={() => setSelectedElement(null)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
        {body && (
          <div
            className="min-h-0 overflow-auto overscroll-contain"
            style={{ maxHeight: bodyMaxHeight }}
          >
            <div ref={contentRef}>{body}</div>
          </div>
        )}
        {collectionActions ? <div ref={actionsRef}>{collectionActions}</div> : null}
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(panel, document.body)
}
