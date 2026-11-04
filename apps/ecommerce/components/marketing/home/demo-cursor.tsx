import { cn } from "@workspace/ui/lib/utils";

/** The arrow that moves around a demo. `x` and `y` are percentages of the positioned parent. */
export function DemoCursor({ x, y, visible = true, className }: { x: number; y: number; visible?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-[7] size-[18px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-[inset-inline-start,top,opacity] duration-1000 ease-[cubic-bezier(.45,0,.2,1)] min-[641px]:size-[26px]",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ insetInlineStart: `${x}%`, top: `${y}%` }}
    >
      <svg viewBox="0 0 24 24" className="size-full fill-[#0f1d21] stroke-white stroke-[1.6] [stroke-linejoin:round] rtl:-scale-x-100">
        <path d="M5 3l14 8-6.2 1.6L9.6 18.6z" />
      </svg>
    </span>
  );
}
