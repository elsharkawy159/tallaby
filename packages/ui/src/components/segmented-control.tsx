"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@workspace/ui/lib/utils";

/**
 * Pill-shaped single-choice switch. Always has a value: clicking the active
 * item does not clear it.
 */
function SegmentedControl({
  className,
  value,
  onValueChange,
  ...props
}: Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="segmented-control"
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next)}
      className={cn("inline-flex shrink-0 rounded-full bg-muted p-[3px] dark:bg-input/40", className)}
      {...props}
    />
  );
}

function SegmentedControlItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(
        "cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground transition-[color,background-color,box-shadow] outline-none",
        "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/30",
        "data-[state=on]:bg-card data-[state=on]:text-primary data-[state=on]:shadow-sm",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
