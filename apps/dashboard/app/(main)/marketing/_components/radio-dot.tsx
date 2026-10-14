import { cn } from "@workspace/ui/lib/utils";

/** Radio-style indicator for selectable cards (the card itself carries the aria state). */
export function RadioDot({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
        checked ? "border-primary bg-primary" : "border-input",
        className
      )}
    >
      {checked && <span className="size-2 rounded-full bg-primary-foreground" />}
    </span>
  );
}
