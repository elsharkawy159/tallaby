"use client"

import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

type CardVariant = "plain" | "outline" | "muted" | "accent" | "glass" | "gradient"
type CardPad = "sm" | "md" | "lg"

type SectionCardProps = {
  variant?: CardVariant
  pad?: CardPad
  rounded?: "lg" | "xl" | "2xl" | "3xl"
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">

// `glass` and `gradient` stay as keys so stored props keep resolving, but they
// render as solid surfaces: decorative blur and gradient washes are banned
// (docs/website-builder-sections.md §6.5).
const VARIANT_MAP: Record<CardVariant, string> = {
  plain:    "bg-card",
  outline:  "bg-card border border-border",
  muted:    "bg-muted/50",
  accent:   "bg-primary text-primary-foreground",
  glass:    "bg-muted/50",
  gradient: "bg-card border border-border",
}
const PAD_MAP: Record<CardPad, string> = {
  sm: "p-5",
  md: "p-7",
  lg: "p-9",
}

/** Reusable surface card used by features, pricing, testimonials, etc. */
export function SectionCard ({
  variant = "outline",
  pad = "md",
  rounded = "2xl",
  children,
  className,
  ...rest
}: SectionCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        VARIANT_MAP[variant],
        PAD_MAP[pad],
        `rounded-${rounded}`,
        "transition-colors",
        className,
      )}
    >
      {children}
    </div>
  )
}
