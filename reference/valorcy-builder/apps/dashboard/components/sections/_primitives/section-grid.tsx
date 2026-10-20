"use client"

import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

type GridCols = 1 | 2 | 3 | 4 | 6 | 12
type GridGap = "sm" | "md" | "lg" | "xl"

type SectionGridProps = {
  cols?: GridCols
  /** Tailwind responsive column counts. Defaults to a sensible progression. */
  responsive?: { sm?: GridCols; md?: GridCols; lg?: GridCols }
  gap?: GridGap
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">

const COLS_MAP: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12",
}
const SM_MAP: Record<GridCols, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  6: "sm:grid-cols-6",
  12: "sm:grid-cols-12",
}
const MD_MAP: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
}
const LG_MAP: Record<GridCols, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
}
const GAP_MAP: Record<GridGap, string> = {
  sm: "gap-3",
  md: "gap-5",
  lg: "gap-6",
  xl: "gap-8",
}

/** Mobile-first responsive grid. Defaults to 1 col → 2 col md → `cols` lg. */
export function SectionGrid ({
  cols = 3,
  responsive,
  gap = "lg",
  children,
  className,
  ...rest
}: SectionGridProps) {
  const baseSm = responsive?.sm
  const baseMd = responsive?.md ?? (cols >= 3 ? 2 : cols)
  const baseLg = responsive?.lg ?? cols
  return (
    <div
      {...rest}
      className={cn(
        "grid",
        COLS_MAP[1],
        baseSm ? SM_MAP[baseSm] : "",
        MD_MAP[baseMd],
        LG_MAP[baseLg],
        GAP_MAP[gap],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Span tokens for bento layouts on a 12-col grid. */
export type BentoSpan = "sm" | "md" | "lg" | "xl" | "wide" | "tall"

export function bentoSpan (token: BentoSpan): string {
  switch (token) {
    case "sm":   return "col-span-1 md:col-span-3 lg:col-span-3"
    case "md":   return "col-span-1 md:col-span-3 lg:col-span-4"
    case "lg":   return "col-span-1 md:col-span-6 lg:col-span-6"
    case "xl":   return "col-span-1 md:col-span-6 lg:col-span-8"
    case "wide": return "col-span-1 md:col-span-6 lg:col-span-12"
    case "tall": return "col-span-1 md:col-span-3 lg:col-span-4 row-span-2"
  }
}
