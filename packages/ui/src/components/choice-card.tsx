"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@workspace/ui/lib/utils";

/**
 * Single-choice group rendered as selectable cards (radio semantics, arrow-key
 * navigation). `columns` sets the grid at sm+; phones get two columns, or one
 * with `stack`.
 */
function ChoiceGroup({
  className,
  columns = 2,
  stack = false,
  style,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  columns?: number;
  stack?: boolean;
}) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="choice-group"
      className={cn(
        "grid gap-2.5",
        stack ? "grid-cols-1" : "grid-cols-2",
        "sm:grid-cols-[repeat(var(--choice-cols),minmax(0,1fr))]",
        className
      )}
      style={{ "--choice-cols": columns, ...style } as React.CSSProperties}
      {...props}
    />
  );
}

/** Bare selectable card: card styling and radio semantics, free-form content. */
function ChoiceItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="choice-item"
      className={cn(
        "group/choice cursor-pointer border border-neutral-300 bg-card text-start transition-[border-color,background-color,box-shadow] outline-none dark:border-input",
        "hover:border-secondary focus-visible:ring-[3px] focus-visible:ring-primary/30",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:shadow-[inset_0_0_0_1px_var(--primary)]",
        "aria-invalid:border-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card with optional icon, badge and radio indicator above a title and
 * description. `lg` is for headline choices (e.g. picking a plan or model).
 */
function ChoiceCard({
  className,
  icon,
  title,
  description,
  badge,
  indicator = false,
  size = "default",
  children,
  ...props
}: Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "title"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  indicator?: boolean;
  size?: "default" | "lg";
}) {
  return (
    <ChoiceItem
      data-slot="choice-card"
      className={cn(
        "flex min-h-12 flex-col items-start justify-center gap-0.5",
        size === "lg" ? "gap-1.5 rounded-[14px] p-4.5" : "rounded-xl px-3.5 py-3",
        className
      )}
      {...props}
    >
      {(icon || badge || indicator) && (
        <span
          className={cn(
            "mb-1 flex w-full items-center gap-2.5 [&_svg:not([class*='size-'])]:size-5",
            size === "lg"
              ? "text-primary"
              : "text-muted-foreground group-data-[state=checked]/choice:text-primary"
          )}
        >
          {icon}
          {badge}
          {indicator && <ChoiceIndicator className="ms-auto" />}
        </span>
      )}
      <span
        className={cn(
          "text-neutral-900 dark:text-foreground",
          size === "lg" ? "text-base font-bold" : "text-[14.5px] font-semibold"
        )}
      >
        {title}
      </span>
      {description && (
        <span
          className={cn(
            "leading-normal text-muted-foreground",
            size === "lg" ? "text-[13.5px]" : "text-[12.5px]"
          )}
        >
          {description}
        </span>
      )}
      {children}
    </ChoiceItem>
  );
}

/** Radio dot that follows the enclosing ChoiceItem's checked state. */
function ChoiceIndicator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-neutral-400 bg-card",
        "group-data-[state=checked]/choice:border-primary",
        "after:size-2.5 after:rounded-full after:bg-primary after:opacity-0 after:content-[''] group-data-[state=checked]/choice:after:opacity-100",
        className
      )}
    />
  );
}

export { ChoiceGroup, ChoiceItem, ChoiceCard, ChoiceIndicator };
