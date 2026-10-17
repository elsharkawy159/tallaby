"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useBuilderStore } from "@/lib/builder/store"
import { ComponentTreeRenderer } from "@/components/website-builder/component-tree-renderer"
import { hostParentId, isSlotHostKey, splitElementKey } from "@/lib/builder/dnd/ids"

/** Hosts are never resolved inside a real component tree's surface. */
const TREE_SURFACE = "[data-component-tree-surface]"

/** Resolve each injected key to its live host element (or `null`). */
function resolveHosts(keys: string[]): Array<HTMLElement | null> {
  return keys.map((key) => {
    const host = document.querySelector<HTMLElement>(
      `[data-element-id="${CSS.escape(key)}"]`
    )
    // A custom section's surface wrapper is instrumented (saved styles may be
    // keyed to it), so it can look like a host — but its content is the
    // section's own component tree, never injected children.
    return host && !host.closest(TREE_SURFACE) ? host : null
  })
}

function sameHosts(a: Array<HTMLElement | null>, b: Array<HTMLElement | null>): boolean {
  return a.length === b.length && a.every((el, i) => el === b[i])
}

/**
 * Mounts user-inserted element subtrees (`injectedChildren`) into their parent
 * containers inside pre-built sections via React portals. Hosts are resolved by
 * `[data-element-id]` — the same attribute the DOM-instrumentation pass tags
 * containers with — so injected nodes render in place and inherit all standard
 * tree editing (selection, drag, style panel) through `ComponentTreeRenderer`.
 *
 * Each host's roots get the bucket parent `host:<local>`, so moving or
 * reordering an injected node addresses its own list rather than the
 * section's component tree.
 */
export function InjectedChildrenLayer() {
  const injectedChildren = useBuilderStore((s) => s.injectedChildren)
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)

  // Slot buckets (`<instanceId>::slot:<slotId>`) are rendered inline by
  // `<SectionSlot>`, interleaved with the slot's schema blocks. Portaling them
  // here as well would render every slot element twice.
  const parentIds = Object.keys(injectedChildren).filter(
    (id) => (injectedChildren[id]?.length ?? 0) > 0 && !isSlotHostKey(id)
  )
  const keySignature = parentIds.join("|")
  // Keyed by the signature they were resolved for, so a render between a key
  // change and the effect never pairs a key with another key's host.
  const [resolved, setResolved] = useState<{ sig: string; hosts: Array<HTMLElement | null> }>({
    sig: "",
    hosts: [],
  })

  useEffect(() => {
    const keys = keySignature ? keySignature.split("|") : []
    const update = () =>
      setResolved((prev) => {
        const next = keys.length ? resolveHosts(keys) : []
        // The DOM mutates constantly (dnd-kit writes styles every drag frame);
        // only re-render when a host actually appeared, vanished or changed.
        return prev.sig === keySignature && sameHosts(prev.hosts, next)
          ? prev
          : { sig: keySignature, hosts: next }
      })
    update()
    if (keys.length === 0) return
    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-element-id"],
    })
    return () => observer.disconnect()
  }, [keySignature])

  if (parentIds.length === 0 || resolved.sig !== keySignature) return null
  const hosts = resolved.hosts

  return (
    <>
      {parentIds.map((parentElementId, i) => {
        const tree = injectedChildren[parentElementId]
        const host = hosts[i]
        const split = splitElementKey(parentElementId)
        if (!tree || tree.length === 0 || !host || !split) return null
        return createPortal(
          <ComponentTreeRenderer
            key={parentElementId}
            sectionId={split.sectionId}
            tree={tree}
            isPreview={canvasPreview}
            rootParentId={hostParentId(split.local)}
          />,
          host
        )
      })}
    </>
  )
}
