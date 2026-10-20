"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import { SectionEyebrow } from "./section-eyebrow"
import { SectionHeadline } from "./section-headline"

type Align = "left" | "center"

type SectionHeaderProps = {
  instanceId: string
  isPreview?: boolean
  align?: Align
  eyebrow?: string
  headline: string
  /** Optional accent word rendered with a gradient inside the headline. */
  accentWord?: string
  /** Optional text appended after the accent word. */
  headlineSuffix?: string
  description?: string
  className?: string
  /**
   * Heading level. Defaults to 2 — but a hero's headline is the page's `h1`, and
   * this primitive used to hardcode `h2`, which is why most heroes hand-rolled
   * their own `InlineEditableText as="h1"` instead of using it. Schema-driven
   * sections pass `HeadingBlock.level` through.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Replaces the default headline type scale. Heroes each tune their own optical
   * size (`text-[clamp(...)]`), which is the other reason they bypassed this
   * primitive; passing it keeps their look while sharing the editing plumbing.
   */
  headingClassName?: string
  /** Replaces the default description type scale. */
  descriptionClassName?: string
  /**
   * @deprecated maxWidth no longer accepted — SectionContainer controls
   * the global max-width from the design system. Pass className to constrain
   * further if needed (e.g. className="max-w-[65ch]").
   */
  maxWidth?: "sm" | "md" | "lg" | "xl"
}

const DEFAULT_HEADING_CLASS =
  "text-[clamp(2rem,3.2vw+1rem,3.75rem)] font-bold tracking-[-0.035em] leading-[1.02] text-foreground"

const DEFAULT_DESCRIPTION_CLASS = "text-[17px] leading-[1.6] text-muted-foreground"

/**
 * Standardized section header: eyebrow → headline (with optional gradient
 * accent word) → description. All fields are inline-editable and persist
 * through the builder store.
 *
 * Width is intentionally unconstrained — the wrapping SectionContainer
 * already applies the global containerMaxWidth from the design system.
 */
export function SectionHeader ({
  instanceId,
  isPreview,
  align = "center",
  eyebrow,
  headline,
  accentWord,
  headlineSuffix,
  description,
  className,
  level = 2,
  headingClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  const store = useBuilderStore.getState

  return (
    <div
      className={cn(
        "flex flex-col gap-5 w-full",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {typeof eyebrow === "string" && (
        <SectionEyebrow instanceId={instanceId} value={eyebrow} isPreview={isPreview} />
      )}

      <SectionHeadline
        instanceId={instanceId}
        isPreview={isPreview}
        headline={headline}
        accentWord={accentWord}
        headlineSuffix={headlineSuffix}
        level={level}
        className={headingClassName ?? DEFAULT_HEADING_CLASS}
      />

      {typeof description === "string" && (
        <InlineEditableText
          as="p"
          data-element-id={`${instanceId}::description`}
          data-element-type="text"
          className={descriptionClassName ?? DEFAULT_DESCRIPTION_CLASS}
          value={description}
          isPreview={isPreview}
          onChange={(t) => store().updateSectionProps(instanceId, { description: t })}
          onCommit={(t) => store().updateSectionProps(instanceId, { description: t })}
        />
      )}
    </div>
  )
}
