"use client"

import { useEffect, useState } from "react"
import { useBuilderStore } from "@/lib/builder/store"
import { BuilderCanvas } from "@/components/website-builder/builder-canvas"
import { BuilderLeftSidebar } from "@/components/website-builder/builder-left-sidebar"
import { BuilderRightSidebar } from "@/components/website-builder/builder-right-sidebar"
import {
  BuilderTabRail,
  type BuilderLeftRailTab,
} from "@/components/website-builder/builder-tab-rail"
import { PreviewFrame } from "@/components/website-builder/preview/preview-frame"
import { isMultilingual } from "@workspace/i18n"
import { cn } from "@workspace/ui/lib/utils"

function useViewportWiderThanLg() {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    setWide(mq.matches)
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return wide
}

/** Centered EN / AR tab bar — only shown for multilingual projects. */
function LocaleTabs() {
  const supportedLocales = useBuilderStore((s) => s.supportedLocales)
  const builderLocale = useBuilderStore((s) => s.builderLocale)
  const setBuilderLocale = useBuilderStore((s) => s.setBuilderLocale)

  if (!isMultilingual(supportedLocales)) return null

  const LOCALE_LABELS: Record<string, string> = {
    en: "EN",
    ar: "AR",
  }

  return (
    <div className="flex items-center justify-center border-b border-border bg-background/80 py-1.5">
      <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5">
        {supportedLocales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setBuilderLocale(locale)}
            className={cn(
              "min-w-[36px] rounded px-2.5 py-1 text-xs font-semibold transition-colors",
              builderLocale === locale
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={builderLocale === locale}
          >
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BuilderWorkspace({
  projectId,
  websiteId,
}: {
  projectId: string
  websiteId: string
}) {
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const pages = useBuilderStore((s) => s.pages)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const sections = useBuilderStore((s) => s.sections)
  const wide = useViewportWiderThanLg()
  const [leftRailTab, setLeftRailTab] = useState<BuilderLeftRailTab | null>(
    "add"
  )

  const toggleRailTab = (tab: BuilderLeftRailTab) => {
    setLeftRailTab((prev) => (prev === tab ? null : tab))
  }

  // Auto-switch to Explore panel when any image element is selected.
  useEffect(() => {
    if (!selectedElementId) return

    const domEl = document.querySelector<HTMLElement>(
      `[data-element-id="${selectedElementId.replace(/"/g, '\\"')}"]`
    )
    if (domEl) {
      const kind =
        domEl.getAttribute("data-element-kind") ??
        domEl.getAttribute("data-element-type")
      if (kind === "image") {
        setLeftRailTab("explore")
        return
      }
      if (domEl.tagName === "IMG" || domEl.tagName === "PICTURE") {
        setLeftRailTab("explore")
        return
      }
    }

    const sep = selectedElementId.indexOf("::")
    if (sep < 0) return
    const sectionId = selectedElementId.slice(0, sep)
    const nodeId = selectedElementId.slice(sep + 2)
    if (nodeId.startsWith("__i:")) return
    const section = sections.find((s) => s.id === sectionId)
    if (!section?.componentTree) return
    function findType(
      tree: import("@/lib/builder/component-node").ComponentNode[]
    ): string | undefined {
      for (const n of tree) {
        if (n.id === nodeId) return n.type
        const found = findType(n.children)
        if (found) return found
      }
    }
    const nodeType = findType(section.componentTree)
    if (nodeType === "image") {
      setLeftRailTab("explore")
    } else if (nodeType === "icon") {
      setLeftRailTab("icons")
    }
  }, [selectedElementId, sections])

  const activePageSlug =
    pages.find((p) => p.id === activePageId)?.slug ?? "home"

  if (canvasPreview) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LocaleTabs />
        <div className="flex min-h-0 flex-1">
          <PreviewFrame
            websiteId={websiteId}
            pageSlug={activePageSlug}
            className="flex-1"
          />
        </div>
      </div>
    )
  }

  if (!wide) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LocaleTabs />
        <div className="flex min-h-0 flex-1">
          <BuilderTabRail activeTab={leftRailTab} onSelectTab={toggleRailTab} />
          {leftRailTab !== null ? (
            <div className="flex w-[260px] shrink-0 flex-col border-e border-border">
              <BuilderLeftSidebar railTab={leftRailTab} projectId={projectId} />
            </div>
          ) : null}
          <BuilderCanvas />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <LocaleTabs />
      <div className="flex min-h-0 flex-1">
        <BuilderTabRail activeTab={leftRailTab} onSelectTab={toggleRailTab} />
        {leftRailTab !== null ? (
          <>
            <div className="w-70">
              <BuilderLeftSidebar railTab={leftRailTab} projectId={projectId} />
            </div>
          </>
        ) : null}
        <div className="flex-1">
          <BuilderCanvas />
        </div>
        <div className="w-70">
          <BuilderRightSidebar />
        </div>
      </div>
    </div>
  )
}
