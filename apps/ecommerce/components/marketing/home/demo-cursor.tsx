import { cn } from "@workspace/ui/lib/utils";

/**
 * The arrow that moves around a demo. `x` and `y` are percentages of the
 * positioned parent, measured from the start side, so a target keeps its spot
 * when the mockup mirrors in Arabic.
 *
 * The arrow itself always points the LTR way (a real mouse pointer does not
 * flip in RTL). Its tip is the box's top-left corner, so in RTL the box is
 * shifted one width to the right to keep the tip on the target.
 *
 * It moves in 700ms; a click it makes is drawn after `CURSOR_TRAVEL_MS`
 * (`delay-700` on the pressed control) so the press shows once it arrives.
 */
export const CURSOR_TRAVEL_MS = 700;

export function DemoCursor({ x, y, visible = true, className }: { x: number; y: number; visible?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-[7] size-[18px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-[inset-inline-start,top,opacity] duration-700 ease-[cubic-bezier(.45,0,.2,1)] rtl:translate-x-full min-[641px]:size-[26px]",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ insetInlineStart: `${x}%`, top: `${y}%` }}
    >
      <svg viewBox="0 0 24 24" className="size-full fill-[#0f1d21] stroke-white stroke-[1.6] [stroke-linejoin:round]">
        <path d="M3 2l17 9.5-7.4 1.9L8.8 20.6z" />
      </svg>
    </span>
  );
}
