"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";

const groupVariants = cva("", {
  variants: {
    look: {
      chips: "no-scrollbar max-w-full gap-1.5 overflow-x-auto rounded-none p-0.5",
      dark: "rounded-[10px] bg-white/10 p-[3px]",
      light: "rounded-[10px] bg-neutral-100 p-[3px]",
    },
  },
});

const itemVariants = cva(
  "flex-none font-semibold whitespace-nowrap shadow-none transition-colors first:rounded-s-none last:rounded-e-none [&_svg:not([class*='size-'])]:size-[15px]",
  {
    variants: {
      look: {
        chips:
          "min-h-10 rounded-full! border border-neutral-200 bg-white px-4 text-sm text-neutral-700 hover:border-teal-300 hover:bg-white hover:text-neutral-700 data-[state=on]:border-teal-900 data-[state=on]:bg-teal-900 data-[state=on]:text-white",
        dark: "h-[34px] rounded-lg! px-3 text-[13px] text-mist hover:bg-transparent hover:text-white data-[state=on]:bg-white data-[state=on]:text-teal-900",
        light:
          "h-[34px] rounded-lg! px-3 text-[13px] text-neutral-700 hover:bg-transparent data-[state=on]:bg-white data-[state=on]:text-teal-900 data-[state=on]:shadow-xs",
      },
    },
  },
);

export type ChoiceOption<V extends string> = {
  value: V;
  label: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
};

/**
 * Single-choice pill group (filter chips, device and layout switches) on top
 * of the shadcn ToggleGroup. A choice can't be cleared by clicking it again.
 */
export function ChoiceGroup<V extends string>({
  value,
  onChange,
  options,
  look = "chips",
  label,
  className,
  itemClassName,
}: {
  value: V;
  onChange: (value: V) => void;
  options: ChoiceOption<V>[];
  look?: "chips" | "dark" | "light";
  label?: string;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as V);
      }}
      aria-label={label}
      className={cn(groupVariants({ look }), className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className={cn(itemVariants({ look }), itemClassName)}
        >
          {option.icon}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
