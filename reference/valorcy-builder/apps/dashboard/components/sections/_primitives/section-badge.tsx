"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"

type SectionBadgeProps = {
  instanceId: string
  value: string
  propKey?: string
  isPreview?: boolean
  className?: string
  variant?: "outline" | "soft" | "solid"
}

/** Pill badge shown above headlines or inside cards. */
export function SectionBadge ({
  instanceId,
  value,
  propKey = "badge",
  isPreview,
  className,
  variant = "soft",
}: SectionBadgeProps) {
  const store = useBuilderStore.getState
  return (
    <InlineEditableText
      as="span"
      data-element-id={`${instanceId}::${propKey}`}
      data-element-type="text"
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium",
        variant === "outline" && "border border-border text-foreground",
        variant === "soft" && "bg-primary/10 text-primary",
        variant === "solid" && "bg-primary text-primary-foreground",
        className,
      )}
      value={value}
      isPreview={isPreview}
      onChange={(t) => store().updateSectionProps(instanceId, { [propKey]: t })}
      onCommit={(t) => store().updateSectionProps(instanceId, { [propKey]: t })}
    />
  )
}
