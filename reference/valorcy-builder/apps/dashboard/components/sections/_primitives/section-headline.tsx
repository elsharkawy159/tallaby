"use client"

import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"

export const DEFAULT_HEADLINE_CLASS = `${TYPE_H2} text-foreground`

/**
 * Two meanings of `accentWord` exist in stored data: section defaults treat it as
 * a word *appended* to the headline ("Ship your next idea" + "faster"), while the
 * industry packs treat it as a word *inside* the headline to highlight ("Ready to
 * talk?" + "talk"). Now that the accent is not highlighted, the second kind would
 * print the word twice, so it is skipped when the headline already contains it.
 */
export function containsWord (headline: string, word: string): boolean {
  const w = word.trim().toLocaleLowerCase()
  return w !== "" && headline.toLocaleLowerCase().includes(w)
}

export type SectionHeadlineProps = {
  instanceId: string
  isPreview?: boolean
  headline: string
  /**
   * Legacy split of the headline. Rendered as part of the sentence, not
   * highlighted: a single coloured word is a generated-design tell
   * (docs/website-builder-sections.md §6.5). Stored copy keeps rendering.
   */
  accentWord?: string
  /** Trailing text after the accent span. */
  headlineSuffix?: string
  /** Prop keys, so a section can bind the heading to non-default keys. */
  headlineProp?: string
  accentWordProp?: string
  headlineSuffixProp?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

/**
 * The headline, on its own.
 *
 * Split out of `SectionHeader` (which bundles eyebrow → headline → description)
 * because a slot renders each schema block as a separate, independently
 * reorderable entry: a user must be able to drag the description above the
 * headline, which is impossible while one component emits both.
 *
 * `SectionHeader` now composes this, so the inline-editing plumbing and the
 * `data-element-id` grammar (`::headline`, `::accentWord`, `::headlineSuffix`)
 * live in exactly one place and stay identical on both paths.
 */
export function SectionHeadline ({
  instanceId,
  isPreview,
  headline,
  accentWord,
  headlineSuffix,
  headlineProp = "headline",
  accentWordProp = "accentWord",
  headlineSuffixProp = "headlineSuffix",
  level = 2,
  className,
}: SectionHeadlineProps) {
  const store = useBuilderStore.getState
  const Heading = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  const write = (key: string) => (t: string) =>
    store().updateSectionProps(instanceId, { [key]: t })

  return (
    <Heading className={className ?? DEFAULT_HEADLINE_CLASS}>
      <InlineEditableText
        as="span"
        data-element-id={`${instanceId}::${headlineProp}`}
        data-element-type="text"
        value={headline}
        isPreview={isPreview}
        onChange={write(headlineProp)}
        onCommit={write(headlineProp)}
      />
      {accentWord && !containsWord(headline, accentWord) ? (
        <>
          {" "}
          <InlineEditableText
            as="span"
            data-element-id={`${instanceId}::${accentWordProp}`}
            data-element-type="text"
            value={accentWord}
            isPreview={isPreview}
            onChange={write(accentWordProp)}
            onCommit={write(accentWordProp)}
          />
        </>
      ) : null}
      {headlineSuffix ? (
        <>
          {" "}
          <InlineEditableText
            as="span"
            data-element-id={`${instanceId}::${headlineSuffixProp}`}
            data-element-type="text"
            value={headlineSuffix}
            isPreview={isPreview}
            onChange={write(headlineSuffixProp)}
            onCommit={write(headlineSuffixProp)}
          />
        </>
      ) : null}
    </Heading>
  )
}
