import type { LucideIcon } from "lucide-react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconTile, SellerCard, type Tone } from "./layout";

/* Read-only pieces: the design's `.rows`, `.bdg`, `.bdg2`, `.chp`, `.seg2`, `.empty`, `.note`, `.kpi`, `.strip`. Server-safe. */

/** A bordered list (`.rows`). Put Row inside. */
export function Rows({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)", className)}
      {...props}
    />
  );
}

/** One line of a list (`.rw`): `start` (thumb, icon, move buttons), title and description, then `end` (actions). */
export function Row({
  start,
  title,
  description,
  end,
  className,
  children,
}: {
  start?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  end?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)",
        className,
      )}
    >
      {start}
      {(title || description || children) && (
        <div className="min-w-0 flex-1">
          {title && <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">{title}</b>}
          {description && <small className="block text-xs text-(--s-subtle)">{description}</small>}
          {children}
        </div>
      )}
      {end && <div className="flex shrink-0 items-center gap-1">{end}</div>}
    </div>
  );
}

export type BadgeTone = "success" | "danger" | "warning" | "info" | "muted";

const BADGE_TONES: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-destructive-soft text-destructive",
  warning: "bg-accent-soft text-accent-ink",
  info: "bg-primary-soft text-primary-ink",
  muted: "bg-(--s-fill) text-(--s-muted)",
};

/** A status with a dot (`.bdg`): order status, paid, delivered. */
export function StatusBadge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold",
        BADGE_TONES[tone],
        className,
      )}
    >
      <i aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** A small label without a dot (`.bdg2`): "New", "Main store", "Pro". */
export function Tag({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-[9px] py-0.5 text-[11px] font-bold [&_svg]:size-3",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Amber count pill (`.cnt`). Renders nothing at 0. */
export function CountPill({ value, className }: { value: string | number; className?: string }) {
  if (value === 0 || value === "0") return null;
  return (
    <b
      className={cn(
        "grid h-5 min-w-[22px] shrink-0 place-items-center rounded-full bg-accent px-1.5 font-montserrat text-[10.5px] font-bold text-(--tallaby-teal-900) tabular-nums",
        className,
      )}
    >
      {value}
    </b>
  );
}

/** Filter chips row (`.chs`). */
export function Chips({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap gap-1.5", className)} {...props} />;
}

/** One filter chip (`.chp`). Pass `pressed` for the selected state. */
export function Chip({
  pressed,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "aria-pressed"> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed ?? false}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-muted) transition-colors duration-150 hover:border-(--tallaby-teal-300) aria-pressed:border-(--s-solid) aria-pressed:bg-(--s-solid) aria-pressed:text-(--s-solid-fg) max-[600px]:h-10 [&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

/** Small two-to-four way switch (`.seg2`). `solid` is the darker selected look (`.seg`). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  solid = false,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  solid?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex gap-0.5 rounded-full bg-(--s-fill) p-[3px]", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-[30px] cursor-pointer whitespace-nowrap rounded-full px-3 text-[12.5px] font-semibold text-(--s-muted) transition-colors duration-150 max-[600px]:h-10 max-[600px]:flex-1",
            solid
              ? "aria-pressed:bg-(--s-solid) aria-pressed:text-(--s-solid-fg)"
              : "aria-pressed:bg-(--s-surface) aria-pressed:text-(--s-ink) aria-pressed:shadow-[0_1px_3px_rgb(13_55_67/0.12)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Nothing here yet (`.empty`): icon, title, one line, one action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5 px-[22px] pb-6 pt-[26px] text-center", className)}>
      {icon && <IconTile icon={icon} className="size-10 rounded-[13px] [&_svg]:size-[19px]" />}
      <b className="mt-1.5 text-sm font-bold text-(--s-ink)">{title}</b>
      {description && (
        <div className="max-w-[320px] text-pretty text-[12.5px] leading-[1.7] text-(--s-subtle)">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** A short explanation (`.note`). `tone="amber"` when it needs attention. */
export function Note({
  tone = "default",
  icon: Icon = Info,
  className,
  children,
}: {
  tone?: "default" | "amber" | "danger" | "success";
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[14px] px-3 py-2.5 text-[12.5px] leading-[1.7] [&_a]:font-bold",
        tone === "default" && "bg-(--s-tint) text-(--s-muted)",
        tone === "amber" && "bg-accent-soft text-accent-ink",
        tone === "danger" && "bg-destructive-soft text-destructive",
        tone === "success" && "bg-success-soft text-success",
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-[3px] size-[15px] shrink-0", tone === "default" ? "text-(--s-primary)" : "text-current")}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Period-over-period change (owner: green TrendingUp, red TrendingDown, no chart). `null` means no baseline. */
export function DeltaBadge({ value }: { value: number | null }) {
  const flat = value === null || Math.abs(value) < 0.05;
  const up = !flat && value! > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-[3px] rounded-full px-[9px] font-montserrat text-[11px] font-bold tabular-nums",
        flat && "bg-(--s-fill) text-(--s-subtle)",
        up && "bg-success-soft text-success",
        !flat && !up && "bg-destructive-soft text-destructive",
      )}
    >
      {flat ? (
        "—"
      ) : (
        <>
          <Icon className="size-3" aria-hidden />
          {Math.abs(value!).toFixed(1)}%
        </>
      )}
    </span>
  );
}

/** Row of KPI cards: four across, two at 1180px. */
export function KpiGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-4 gap-3.5 max-[1180px]:grid-cols-2 max-[480px]:gap-2.5", className)}
      {...props}
    />
  );
}

/** One headline number (`.kpi`), with no chart. Pass `href` to make the card a link. */
export function KpiCard({
  href,
  label,
  icon,
  tone,
  value,
  unit,
  also,
  footer,
  delta,
  className,
}: {
  href?: string;
  label: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** The same figure in other currencies, one per line. */
  also?: React.ReactNode;
  footer?: React.ReactNode;
  /** Omit for numbers that are not period-based. */
  delta?: number | null;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-(--s-muted)">
        <span className="min-w-0">{label}</span>
        <IconTile icon={icon} tone={tone} />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <b className="font-montserrat text-[28px] font-bold leading-[1.2] text-(--s-ink) tabular-nums max-[480px]:text-[22px]">
          {value}
        </b>
        {unit && <span className="text-[12.5px] text-(--s-subtle)">{unit}</span>}
      </div>
      {also && <div className="text-xs font-medium text-(--s-subtle) tabular-nums">{also}</div>}
      <div className="mt-auto flex min-h-[22px] items-center justify-between gap-2 text-xs text-(--s-faint)">
        <span className="min-w-0 max-[480px]:hidden">{footer}</span>
        {delta !== undefined && (
          <span className="max-[480px]:ms-auto">
            <DeltaBadge value={delta} />
          </span>
        )}
      </div>
    </>
  );
  const frame = cn(
    "flex min-w-0 flex-col gap-1.5 rounded-[24px] border border-(--s-line) bg-(--s-glass) px-5 pb-4 pt-[18px] shadow-(--s-shadow-card) max-[600px]:rounded-[20px] max-[480px]:p-3.5",
    href &&
      "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-(--s-shadow-hover) motion-reduce:hover:translate-y-0",
    className,
  );
  return href ? (
    <Link href={href} className={frame}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}

/** A slim card of secondary numbers (`.strip`). Put StatItem inside. */
export function StatStrip({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <SellerCard
      className={cn(
        // 1px gaps over a line-coloured background draw the dividers at every width.
        "grid grid-cols-4 gap-px overflow-hidden bg-(--s-line-soft) max-[1180px]:grid-cols-2 max-[480px]:grid-cols-1",
        className,
      )}
      {...props}
    />
  );
}

/** One secondary number in a StatStrip. */
export function StatItem({
  href,
  icon,
  tone = "accent",
  label,
  value,
  unit,
  note,
  noteTone,
}: {
  href?: string;
  icon: LucideIcon;
  tone?: Tone;
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  note?: React.ReactNode;
  noteTone?: "danger";
}) {
  const frame = "flex items-center gap-3 bg-(--s-surface) px-5 py-3.5";
  const body = (
    <>
      <IconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <small className="block text-xs text-(--s-subtle)">{label}</small>
        <b className="font-montserrat text-base font-bold leading-snug text-(--s-ink) tabular-nums">
          {value}
          {unit && <span className="ms-1 font-sans text-[11.5px] font-medium text-(--s-subtle)">{unit}</span>}
        </b>
        {note && (
          <small className={cn("block text-[11.5px]", noteTone === "danger" ? "font-medium text-destructive" : "text-(--s-subtle)")}>
            {note}
          </small>
        )}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cn(frame, "transition-colors duration-150 hover:bg-(--s-tint)")}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}
