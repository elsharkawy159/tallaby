import * as React from "react";
import { cn } from "@/lib/utils";

/* The design's `.btn`, `.mini`, `.ib` and `.lk`. Server-safe. */

const BUTTON_BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold no-underline transition-[background-color,color,border-color,box-shadow,transform] duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0";

const BUTTON_VARIANTS = {
  /** The page's main action. One per screen. */
  amber: "bg-accent text-accent-foreground shadow-(--s-shadow-amber) hover:-translate-y-px hover:bg-(--s-amber-hover)",
  /** Strong but secondary: confirm, save, apply. */
  solid: "bg-(--s-solid) text-(--s-solid-fg) hover:bg-(--s-solid-hover)",
  outline: "border-[1.5px] border-(--s-outline) bg-(--s-surface) text-(--s-ink) hover:border-(--s-outline-hover)",
  whatsapp: "bg-(--s-whatsapp) text-white hover:bg-(--s-whatsapp-hover)",
  danger: "bg-destructive text-white hover:bg-destructive/90 dark:text-[#2b0d0d]",
  /** Quiet action on a card (`.mini`). */
  mini: "border border-(--s-field) bg-(--s-surface) font-semibold text-(--s-body) hover:border-(--s-outline-hover) [&_svg]:text-(--s-subtle)",
} as const;

const BUTTON_SIZES = {
  default: "h-[42px] px-5 text-[13.5px] [&_svg]:size-[17px]",
  sm: "h-9 px-3.5 text-[13px] max-[600px]:h-10 [&_svg]:size-[17px]",
  xs: "h-[34px] gap-1.5 px-3 text-[12.5px] max-[600px]:h-10 [&_svg]:size-[15px]",
} as const;

/**
 * Put on a header's actions row: at 600px and below every SellerButton in it
 * drops to 36px tall with tighter padding and text. A button marked
 * `data-phone-icon` turns into a 36px square there; wrap its label in
 * `max-[600px]:sr-only` so it keeps its accessible name. Desktop is unchanged.
 */
export const PHONE_COMPACT_ACTIONS =
  "max-[600px]:[&_[data-sui-button]]:h-9 max-[600px]:[&_[data-sui-button]]:gap-1.5 max-[600px]:[&_[data-sui-button]]:px-3.5 max-[600px]:[&_[data-sui-button]]:text-[12.5px] max-[600px]:[&_[data-sui-button]_svg]:size-4 max-[600px]:[&_[data-sui-button][data-phone-icon]]:w-9 max-[600px]:[&_[data-sui-button][data-phone-icon]]:px-0";

export type SellerButtonVariant = keyof typeof BUTTON_VARIANTS;
export type SellerButtonSize = keyof typeof BUTTON_SIZES;

export type SellerButtonProps = React.ComponentProps<"button"> & {
  variant?: SellerButtonVariant;
  size?: SellerButtonSize;
  /** Style the single child (usually a Link) instead of rendering a button. */
  asChild?: boolean;
};

/** Renders a button, or with `asChild` hands the classes to its only child. */
function ButtonOrChild({
  asChild,
  type,
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      ...(props as object),
      className: cn(className, children.props.className),
    });
  }
  return (
    // A plain button inside a form must not submit by accident.
    <button type={type ?? "button"} className={className} {...props}>
      {children}
    </button>
  );
}

/** `<SellerButton variant="solid" asChild><Link href="/x">Label</Link></SellerButton>` */
export function SellerButton({ variant = "amber", size = "default", className, ...props }: SellerButtonProps) {
  return (
    <ButtonOrChild
      data-sui-button={variant}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

/** Square icon button (`.ib`). Always give it `aria-label`. 40px on phones. */
export function IconButton({ className, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  return (
    <ButtonOrChild
      className={cn(
        "relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-[11px] text-(--s-subtle) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) disabled:pointer-events-none disabled:opacity-45 max-[600px]:size-10 [&_svg]:size-[18px] [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

/** Quiet "see all" action (`.lk`). `<TextAction asChild><Link href="/x">See all</Link></TextAction>` */
export function TextAction({ className, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  return (
    <ButtonOrChild
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[12.5px] max-[600px]:min-h-10 font-bold text-(--s-link) transition-colors duration-150 hover:bg-(--s-hover) [&_svg]:size-[15px] [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}
