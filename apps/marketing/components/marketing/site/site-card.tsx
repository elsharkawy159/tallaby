import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

const SIZES = { sm: "rounded-card-sm", md: "rounded-card", lg: "rounded-card-lg" } as const;

/** White card on a hairline border. size="lg" is for plans, forms and gallery cards; interactive lifts on hover. */
export function SiteCard({
  size = "md",
  interactive,
  glass,
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof SIZES; interactive?: boolean; glass?: boolean }) {
  return (
    <div
      className={cn(
        "border border-line shadow-soft",
        glass ? "bg-surface-glass" : "bg-white",
        SIZES[size],
        interactive && "transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-raise",
        className,
      )}
      {...props}
    />
  );
}

/** The 44px teal square that holds a card's icon. */
export function IconTile({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("grid size-11 flex-none place-items-center rounded-[14px] bg-teal-50 text-teal-700 [&_svg]:size-[22px]", className)}
      {...props}
    />
  );
}
