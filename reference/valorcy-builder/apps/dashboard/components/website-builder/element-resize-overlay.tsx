"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useBuilderStore } from "@/lib/builder/store"

const MIN_PX = 24
const HANDLE = 6
const O = -HANDLE / 2

type HandleDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

const CURSOR: Record<HandleDir, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
}

export function ElementResizeOverlay() {
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const setElementStyles = useBuilderStore((s) => s.setElementStyles)
  const elementStyles = useBuilderStore((s) => s.elementStyles)

  const [box, setBox] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const dragRef = useRef<{
    handle: HandleDir
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)

  const updateBox = useCallback(() => {
    if (!selectedElementId || canvasPreview) {
      setBox(null)
      return
    }
    const el = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId)}"]`
    )
    if (!el) {
      setBox(null)
      return
    }
    const r = el.getBoundingClientRect()
    setBox({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    })
  }, [selectedElementId, canvasPreview])

  useEffect(() => {
    updateBox()
  }, [updateBox, elementStyles, selectedElementId])

  useEffect(() => {
    if (!selectedElementId || canvasPreview) return
    const el = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId)}"]`
    )
    if (!el) return
    const ro = new ResizeObserver(() => updateBox())
    ro.observe(el)
    window.addEventListener("scroll", updateBox, true)
    window.addEventListener("resize", updateBox)
    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", updateBox, true)
      window.removeEventListener("resize", updateBox)
    }
  }, [selectedElementId, canvasPreview, updateBox])

  const onPointerDown = useCallback(
    (handle: HandleDir) => (e: React.PointerEvent) => {
      if (!selectedElementId || canvasPreview) return
      e.preventDefault()
      e.stopPropagation()
      const el = document.querySelector<HTMLElement>(
        `[data-element-id="${CSS.escape(selectedElementId)}"]`
      )
      if (!el) return
      const r = el.getBoundingClientRect()
      dragRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startW: r.width,
        startH: r.height,
      }
      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d || !selectedElementId) return
        const dx = ev.clientX - d.startX
        const dy = ev.clientY - d.startY
        let w = d.startW
        let h = d.startH
        const { handle: hdl } = d
        if (hdl.includes("e")) w = d.startW + dx
        if (hdl.includes("w")) w = d.startW - dx
        if (hdl.includes("s")) h = d.startH + dy
        if (hdl.includes("n")) h = d.startH - dy
        w = Math.max(MIN_PX, w)
        h = Math.max(MIN_PX, h)
        const cur =
          useBuilderStore.getState().elementStyles[selectedElementId] ?? {}
        const next = { ...cur } as Record<string, string | number>
        next.width = `${Math.round(w)}px`
        next.height = `${Math.round(h)}px`
        setElementStyles(selectedElementId, next as CSSProperties)
        updateBox()
      }
      const onUp = (ev: PointerEvent) => {
        dragRef.current = null
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        updateBox()
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [canvasPreview, selectedElementId, setElementStyles, updateBox]
  )

  if (!box || canvasPreview || !selectedElementId) return null

  const { top, left, width, height } = box
  const handles: { dir: HandleDir; x: number; y: number }[] = [
    { dir: "nw", x: left + O, y: top + O },
    { dir: "n", x: left + width / 2 + O, y: top + O },
    { dir: "ne", x: left + width + O, y: top + O },
    { dir: "e", x: left + width + O, y: top + height / 2 + O },
    { dir: "se", x: left + width + O, y: top + height + O },
    { dir: "s", x: left + width / 2 + O, y: top + height + O },
    { dir: "sw", x: left + O, y: top + height + O },
    { dir: "w", x: left + O, y: top + height / 2 + O },
  ]

  return (
    <div className="pointer-events-none fixed inset-0 z-[150]" aria-hidden>
      {handles.map(({ dir, x, y }) => (
        <button
          key={dir}
          type="button"
          className="pointer-events-auto absolute z-50 rounded-[1px] bg-[#4F28BA] shadow-sm"
          style={{
            border: "1.5px solid #146EF5",
            position: "fixed",
            left: x,
            top: y,
            width: HANDLE,
            height: HANDLE,
            cursor: CURSOR[dir],
          }}
          tabIndex={-1}
          aria-label={`Resize ${dir}`}
          onPointerDown={onPointerDown(dir)}
        />
      ))}
    </div>
  )
}
