import Link from "next/link";
import { Search } from "lucide-react";
import { SellerCard } from "@/components/seller-ui";
import { cn } from "@/lib/utils";

/* Small pieces the order pages share, on top of the seller design system. Server-safe. */

/** A Radix SelectTrigger as a toolbar pill. */
export const PILL_SELECT =
  "h-[42px] w-auto min-w-0 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-body) shadow-none max-[720px]:flex-1";

/** The floating selection bar's buttons (always on the dark bar). */
export const BAR_BUTTON =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-[#c6d8dc] transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50 max-[600px]:h-10 [&_svg]:size-[15px] [&_svg]:shrink-0";

/** A dialog's close button at the 40px a phone needs (the shared dialog draws it at 16px). */
export const DIALOG_CLOSE_40 =
  "[&>[data-slot=dialog-close]]:top-2.5 [&>[data-slot=dialog-close]]:end-2.5 [&>[data-slot=dialog-close]]:grid [&>[data-slot=dialog-close]]:size-10 [&>[data-slot=dialog-close]]:place-items-center";

/** Bosta's own red, for the buttons that send to Bosta. */
export const BOSTA_BUTTON = "bg-[#E30613] text-white hover:bg-[#c00510]";

/** A phone number reads left to right inside Arabic text: 01XXXXXXXXX or +9665XXXXXXXX. */
export function PhoneText({ phone, className }: { phone: string; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("font-montserrat tabular-nums", className)}>
      {phone}
    </bdi>
  );
}

/** The toolbar's search box. */
export function SearchPill({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <label
      className={cn(
        "flex h-[42px] min-w-0 flex-[1_1_260px] items-center gap-2 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-(--s-subtle) transition-colors duration-150 focus-within:border-(--s-primary) max-[720px]:basis-full min-[721px]:max-w-[420px]",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)"
        {...props}
      />
    </label>
  );
}

/** A filter chip that is a link, so the filter lives in the URL. */
export function ChipLink({ active, className, ...props }: React.ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-muted) no-underline transition-colors duration-150 hover:border-(--tallaby-teal-300) aria-[current=true]:border-(--s-solid) aria-[current=true]:bg-(--s-solid) aria-[current=true]:text-(--s-solid-fg) max-[600px]:h-10",
        className,
      )}
      {...props}
    />
  );
}

/** A row of plain numbers that stays side by side on a phone; big values wrap. */
export function MiniStats({ items, className }: { items: { label: React.ReactNode; value: React.ReactNode }[]; className?: string }) {
  return (
    <SellerCard className={cn("overflow-hidden", className)}>
      <dl className="grid auto-cols-fr grid-flow-col gap-px bg-(--s-line-soft)">
        {items.map((item, index) => (
          <div key={index} className="flex min-w-0 flex-col justify-between gap-1 bg-(--s-surface) px-5 py-3.5 max-[600px]:px-3 max-[600px]:py-3">
            <dt className="text-pretty text-xs text-(--s-subtle)">{item.label}</dt>
            <dd className="break-words font-montserrat text-lg font-bold leading-snug text-(--s-ink) tabular-nums max-[600px]:text-[15px]">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </SellerCard>
  );
}

/** Label and value on one line, inside an order or customer panel. */
export function DetailRow({ label, value }: { label: React.ReactNode; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13px]">
      <span className="shrink-0 text-(--s-subtle)">{label}</span>
      <span className="min-w-0 break-words text-end font-semibold text-(--s-text)">{value || "—"}</span>
    </div>
  );
}

/** A titled block inside an order or customer panel. */
export function PanelSection({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <h3 className="text-[13.5px] font-bold text-(--s-ink)">{title}</h3>
      {children}
    </section>
  );
}
