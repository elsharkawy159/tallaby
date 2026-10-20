"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"

type SectionEyebrowProps = {
  instanceId: string
  value: string
  propKey?: string
  isPreview?: boolean
  className?: string
  /** When set to "muted", uses muted-foreground; default uses primary. */
  tone?: "primary" | "muted"
}

/**
 * Kicker — a short sentence-case line above a headline.
 *
 * Deliberately not uppercase or tracked: the ALL-CAPS eyebrow over every
 * heading is the most recognisable generated-design tell
 * (docs/website-builder-sections.md §6.5). A section that genuinely wants a
 * caps label passes its own className.
 * Editable inline; persists via builder store on commit.
 */
export function SectionEyebrow ({
  instanceId,
  value,
  propKey = "eyebrow",
  isPreview,
  className,
  tone = "primary",
}: SectionEyebrowProps) {
  const store = useBuilderStore.getState
  return (
    <InlineEditableText
      as="div"
      data-element-id={`${instanceId}::${propKey}`}
      data-element-type="text"
      className={cn(
        "text-sm font-medium mb-4",
        tone === "primary" ? "text-primary" : "text-muted-foreground",
        className,
      )}
      value={value}
      isPreview={isPreview}
      onChange={(t) => store().updateSectionProps(instanceId, { [propKey]: t })}
      onCommit={(t) => store().updateSectionProps(instanceId, { [propKey]: t })}
    />
  )
}
