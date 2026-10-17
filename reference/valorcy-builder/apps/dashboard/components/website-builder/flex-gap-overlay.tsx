"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useBuilderStore } from "@/lib/builder/store"

type GapBand = {
  /** Position/size along the cross axis (perpendicular to gap direction). */
  crossStart: number
  crossSize: number
  /** Position/size along the main axis (where the gap actually sits). */
  mainStart: number
  mainSize: number
}

type Measurement = {
  axis: "row" | "column"
  bands: GapBand[]
  gapPx: number
}

const MIN_GAP = 0

function measure(el: HTMLElement): Measurement | null {
  const computed = window.getComputedStyle(el)
  const display = computed.display
  if (display !== "flex" && display !== "inline-flex") return null
  const dir = computed.flexDirection
  const axis: "row" | "column" =
    dir === "column" || dir === "column-reverse" ? "column" : "row"
  const reverse = dir === "row-reverse" || dir === "column-reverse"

  const children = Array.from(el.children).filter(
    (c): c is HTMLElement => c instanceof HTMLElement
  )
  if (children.length < 2) return null

  const rects = children.map((c) => c.getBoundingClientRect())
  const ordered = reverse ? [...rects].reverse() : rects
  const gapPx = parseFloat(computed.columnGap || computed.gap || "0") || 0

  const bands: GapBand[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i]
    const b = ordered[i + 1]
    if (!a || !b) continue
    if (axis === "row") {
      const mainStart = a.right
      const mainSize = b.left - a.right
      if (mainSize <= 0) continue
      bands.push({
        crossStart: Math.min(a.top, b.top),
        crossSize: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
        mainStart,
        mainSize,
      })
    } else {
      const mainStart = a.bottom
      const mainSize = b.top - a.bottom
      if (mainSize <= 0) continue
      bands.push({
        crossStart: Math.min(a.left, b.left),
        crossSize: Math.max(a.right, b.right) - Math.min(a.left, b.left),
        mainStart,
        mainSize,
      })
    }
  }
  if (bands.length === 0) return null
  return { axis, bands, gapPx }
}

export function FlexGapOverlay() {
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const setElementStyles = useBuilderStore((s) => s.setElementStyles)
  const elementStyles = useBuilderStore((s) => s.elementStyles)

  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    startGap: number
    axis: "row" | "column"
  } | null>(null)
  const rafRef = useRef<number | null>(null)

  const update = useCallback(() => {
    if (!selectedElementId || canvasPreview) {
      setMeasurement(null)
      return
    }
    const el = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId)}"]`
    )
    if (!el) {
      setMeasurement(null)
      return
    }
    setMeasurement(measure(el))
  }, [selectedElementId, canvasPreview])

  useEffect(() => {
    update()
  }, [update, elementStyles, selectedElementId])

  useEffect(() => {
    if (!selectedElementId || canvasPreview) return
    const el = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId)}"]`
    )
    if (!el) return
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [selectedElementId, canvasPreview, update])

  const onPointerDown = useCallback(
    (axis: "row" | "column") => (e: React.PointerEvent) => {
      if (!selectedElementId || canvasPreview) return
      e.preventDefault()
      e.stopPropagation()
      const el = document.querySelector<HTMLElement>(
        `[data-element-id="${CSS.escape(selectedElementId)}"]`
      )
      if (!el) return
      const computed = window.getComputedStyle(el)
      const startGap = parseFloat(computed.columnGap || computed.gap || "0") || 0
      dragRef.current = { startX: e.clientX, startY: e.clientY, startGap, axis }
      setDragging(true)

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d || !selectedElementId) return
        const delta = d.axis === "row" ? ev.clientX - d.startX : ev.clientY - d.startY
        const next = Math.max(MIN_GAP, Math.round(d.startGap + delta))
        if (rafRef.current !== null) return
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          const cur =
            useBuilderStore.getState().elementStyles[selectedElementId] ?? {}
          const nextStyle = { ...cur } as Record<string, string | number>
          nextStyle.gap = `${next}px`
          setElementStyles(selectedElementId, nextStyle as CSSProperties)
          update()
        })
      }
      const onUp = () => {
        dragRef.current = null
        setDragging(false)
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        update()
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [canvasPreview, selectedElementId, setElementStyles, update]
  )

  if (!measurement || canvasPreview || !selectedElementId) return null

  const { axis, bands } = measurement
  const cursor = axis === "row" ? "ew-resize" : "ns-resize"

  return (
    <div className="pointer-events-none fixed inset-0 z-[150]" aria-hidden>
      {bands.map((band, i) => {
        const style: CSSProperties =
          axis === "row"
            ? {
                position: "fixed",
                left: band.mainStart,
                top: band.crossStart,
                width: band.mainSize,
                height: band.crossSize,
              }
            : {
                position: "fixed",
                left: band.crossStart,
                top: band.mainStart,
                width: band.crossSize,
                height: band.mainSize,
              }
        const pillStyle: CSSProperties =
          axis === "row"
            ? { width: 6, height: Math.min(28, band.crossSize) }
            : { height: 6, width: Math.min(28, band.crossSize) }

        return (
          <div
            key={i}
            style={{ ...style, backgroundColor: "rgba(67,45,215,0.12)" }}
            className="absolute"
          >
            <button
              type="button"
              className="pointer-events-auto absolute top-1/2 start-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#4F28BA] shadow-sm transition-transform hover:scale-110"
              style={{
                ...pillStyle,
                cursor,
                transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
              }}
              tabIndex={-1}
              aria-label="Adjust gap"
              onPointerDown={onPointerDown(axis)}
            />
          </div>
        )
      })}
    </div>
  )
}
