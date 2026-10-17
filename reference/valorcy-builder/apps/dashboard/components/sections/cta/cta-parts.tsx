"use client"

import { Check } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the CTA catalog, rendered through `<SectionSlot>` overrides
 * and `renderItems`.
 *
 * Each part is one slot entry's worth of markup bound to instance props, so a CTA
 * section only states its layout and its schema — a new CTA is a new arrangement
 * of these, not another copy of the inline-editing plumbing.
 */

type PartProps = {
  instance: SectionInstance
  isPreview?: boolean
  className?: string
}

const write = (instanceId: string, key: string) => (t: string) =>
  useBuilderStore.getState().updateSectionProps(instanceId, { [key]: t })

/**
 * A capture field. Presentational, like every section form in the catalog: the
 * placeholder text is inline-editable in place, which a real `<input>`'s
 * placeholder attribute cannot be.
 */
export function CtaEmailField ({
  instance,
  isPreview,
  className,
  propKey = "emailPlaceholder",
  fallback = "Enter your email",
}: PartProps & { propKey?: string; fallback?: string }) {
  const value = instance.props[propKey]
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-11 w-full items-center rounded-lg border border-border bg-background px-4 text-sm text-muted-foreground",
        className
      )}
    >
      <InlineEditableText
        as="span"
        data-element-id={`${instance.id}::${propKey}`}
        data-element-type="text"
        value={typeof value === "string" ? value : fallback}
        isPreview={isPreview}
        onChange={write(instance.id, propKey)}
        onCommit={write(instance.id, propKey)}
      />
    </div>
  )
}

/**
 * A single action bound to flat `label` / `href` props rather than a `buttons`
 * collection. Exists for the CTAs that have always stored their action that way,
 * so pages saved before the slot migration keep their button.
 */
export function CtaLinkButton ({
  instance,
  isPreview,
  className,
  labelProp,
  hrefProp,
  elementKey,
  fallback = "Get started",
}: PartProps & {
  labelProp: string
  hrefProp: string
  /** Element id suffix — kept from the pre-slot markup so selections survive. */
  elementKey: string
  fallback?: string
}) {
  const label = instance.props[labelProp]
  const href = instance.props[hrefProp]
  return (
    <SectionLink
      link={linkValueFromProp(typeof href === "string" ? href : "#")}
      isPreview={isPreview}
      data-element-id={`${instance.id}::${elementKey}`}
      data-element-type="textLink"
      data-element-href-prop={hrefProp}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        className
      )}
    >
      <InlineEditableText
        as="span"
        value={typeof label === "string" ? label : fallback}
        isPreview={isPreview}
        onChange={write(instance.id, labelProp)}
        onCommit={write(instance.id, labelProp)}
      />
    </SectionLink>
  )
}

type ChecklistItem = { text?: string }

/** Trust bullets — `{ text }` items with a check mark. */
export function CtaChecklist ({
  instance,
  isPreview,
  className,
  itemClassName,
  collection = "trustItems",
  marker = "plain",
}: PartProps & {
  itemClassName?: string
  collection?: string
  /** `plain` = bare check; `badge` = check inside a tinted circle. */
  marker?: "plain" | "badge"
}) {
  const items = (instance.props[collection] as ChecklistItem[] | undefined) ?? []
  if (items.length === 0) return null
  const store = useBuilderStore.getState

  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={i} className={cn("inline-flex items-center gap-2 text-sm", itemClassName)}>
          {marker === "badge" ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="size-3 text-primary" strokeWidth={3} aria-hidden />
            </span>
          ) : (
            <Check className="size-3.5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
          )}
          <InlineEditableText
            as="span"
            data-element-collection={collection}
            data-element-index={String(i)}
            data-element-item-label-prop="text"
            value={String(item.text ?? "")}
            isPreview={isPreview}
            onChange={(v) => store().updateItem(instance.id, collection, i, { text: v })}
            onCommit={(v) => store().updateItem(instance.id, collection, i, { text: v })}
          />
        </li>
      ))}
    </ul>
  )
}

/** Schema block for `{ text }` trust bullets, shared so every CTA compiles it identically. */
export function trustItemsBlock (defaults: string[], opts: { slot?: string; maxItems?: number } = {}) {
  return {
    kind: "items" as const,
    key: "trustItems",
    canonical: "items" as const,
    label: "Trust points",
    pick: [],
    itemFields: [{ key: "text", label: "Text", canonical: "body" as const, maxLength: 80 }],
    minItems: 0,
    maxItems: opts.maxItems ?? 5,
    newItem: () => ({ text: "Key benefit" }),
    defaults: defaults.map((text) => ({ text })),
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}
