/**
 * The section type scale — the only text sizes a section should use.
 *
 * Sections used to type their own `text-[clamp(...)]` per file (34 distinct
 * headline scales), which is most of why the catalog felt assembled rather than
 * designed. A section now picks a *role*; the role owns size, weight, leading,
 * tracking and the project's heading font, so a design-system font change
 * reaches every headline.
 *
 * Two weights only: regular for running text, semibold for headings and labels.
 * See docs/website-builder-sections.md §6.3 and §6.7.
 */

/** Hero-only statement scale. One per page. */
export const TYPE_DISPLAY =
  "font-heading text-[clamp(2.75rem,5.5vw+1rem,6rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance"

/** Hero headline. */
export const TYPE_H1 =
  "font-heading text-[clamp(2.25rem,3.4vw+1rem,4rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-balance"

/** Section headline. */
export const TYPE_H2 =
  "font-heading text-[clamp(1.875rem,2vw+1rem,2.75rem)] font-semibold leading-[1.1] tracking-[-0.022em] text-balance"

/** Compact section headline (CTA strips, FAQ, sidebars). */
export const TYPE_H2_SM =
  "font-heading text-[clamp(1.5rem,1.2vw+1rem,2rem)] font-semibold leading-[1.15] tracking-[-0.018em] text-balance"

/** Item title inside a section (card, row, plan, step). */
export const TYPE_H3 = "font-heading text-lg font-semibold leading-snug tracking-[-0.01em]"

/** Intro paragraph under a headline. */
export const TYPE_LEAD = "text-lg leading-[1.6] text-muted-foreground text-pretty"

/** Running text. */
export const TYPE_BODY = "text-base leading-[1.65] text-muted-foreground text-pretty"

/** Captions, metadata, fine print. */
export const TYPE_SMALL = "text-sm leading-normal text-muted-foreground"

/** Comfortable measure for running text. */
export const MEASURE = "max-w-[62ch]"
