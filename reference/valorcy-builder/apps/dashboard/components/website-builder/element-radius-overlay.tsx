"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useBuilderStore } from "@/lib/builder/store"

const HANDLE = 8
const INSET = 14
const MIN_PX = 0

export function ElementRadiusOverlay() {
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
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    startRadius: number
    width: number
    height: number
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
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height })
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
    (e: React.PointerEvent) => {
      if (!selectedElementId || canvasPreview) return
      e.preventDefault()
      e.stopPropagation()
      const el = document.querySelector<HTMLElement>(
        `[data-element-id="${CSS.escape(selectedElementId)}"]`
      )
      if (!el) return
      const r = el.getBoundingClientRect()
      const computed = window.getComputedStyle(el)
      const startRadius = parseFloat(computed.borderTopLeftRadius || "0") || 0
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRadius,
        width: r.width,
        height: r.height,
      }
      setDragging(true)
      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d || !selectedElementId) return
        const dx = ev.clientX - d.startX
        const dy = ev.clientY - d.startY
        // Dragging toward the element's center (down-right from the corner)
        // increases the radius; dragging away decreases it.
        const delta = (dx + dy) / 2
        const max = Math.min(d.width, d.height) / 2
        let next = d.startRadius + delta
        next = Math.max(MIN_PX, Math.min(max, next))
        const cur =
          useBuilderStore.getState().elementStyles[selectedElementId] ?? {}
        const nextStyle = { ...cur } as Record<string, string | number>
        nextStyle.borderRadius = `${Math.round(next)}px`
        setElementStyles(selectedElementId, nextStyle as CSSProperties)
        updateBox()
      }
      const onUp = () => {
        dragRef.current = null
        setDragging(false)
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
  if (box.width < INSET * 2 || box.height < INSET * 2) return null

  const x = box.left + INSET - HANDLE / 2
  const y = box.top + INSET - HANDLE / 2

  return (
    <div className="pointer-events-none fixed inset-0 z-[150]" aria-hidden>
      <button
        type="button"
        className="pointer-events-auto absolute z-50 rounded-full bg-white shadow-sm transition-transform hover:scale-110"
        style={{
          position: "fixed",
          left: x,
          top: y,
          width: HANDLE,
          height: HANDLE,
          border: "1.5px solid #4F28BA",
          cursor: "nwse-resize",
          transform: dragging ? "scale(1.15)" : undefined,
        }}
        tabIndex={-1}
        aria-label="Adjust border radius"
        onPointerDown={onPointerDown}
      />
    </div>
  )
}
