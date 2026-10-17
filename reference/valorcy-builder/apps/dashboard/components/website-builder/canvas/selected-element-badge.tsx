"use client"

import { useEffect, useState } from "react"
import { useBuilderStore } from "@/lib/builder/store"

interface BadgeState {
  x: number
  y: number
  label: string
  ancestors: { id: string; label: string }[]
}

/**
 * Floating chip rendered above the currently-selected element.
 * Shows the element's kind/tag label and a clickable breadcrumb of ancestors
 * (each with a data-element-id) so users can climb the tree without leaving
 * the canvas. Tracks element rect via getBoundingClientRect on scroll/resize.
 */
export function SelectedElementBadge() {
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const setSelectedElement = useBuilderStore((s) => s.setSelectedElement)
  const [state, setState] = useState<BadgeState | null>(null)

  useEffect(() => {
    if (canvasPreview || !selectedElementId) {
      setState(null)
      return
    }
    let raf = 0
    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-element-id="${CSS.escape(selectedElementId)}"]`
      )
      if (!el) {
        setState(null)
        return
      }
      const r = el.getBoundingClientRect()
      const label =
        el.getAttribute("data-builder-tag") ??
        el.getAttribute("data-element-tag") ??
        "Element"
      const ancestors: { id: string; label: string }[] = []
      let cur: HTMLElement | null = el.parentElement
      while (cur && ancestors.length < 4) {
        const aId = cur.getAttribute("data-element-id")
        if (aId) {
          ancestors.push({
            id: aId,
            label:
              cur.getAttribute("data-builder-tag") ??
              cur.getAttribute("data-element-tag") ??
              "Container",
          })
        }
        cur = cur.parentElement
      }
      ancestors.reverse()
      setState({ x: r.left, y: Math.max(0, r.top - 21.5), label, ancestors })
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener("scroll", schedule, true)
    window.addEventListener("resize", schedule)
    const obs = new ResizeObserver(schedule)
    const target = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(selectedElementId)}"]`
    )
    if (target) obs.observe(target)
    return () => {
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [selectedElementId, canvasPreview])

  if (!state) return null

  return (
    <div
      className="pointer-events-none fixed z-50 flex items-center gap-1 rounded-sm bg-[#4F28BA] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow"
      style={{
        backgroundColor: "#4F28BA",
        left: state.x,
        top: state.y,
      }}
    >
      {state.label}
    </div>
  )
}
