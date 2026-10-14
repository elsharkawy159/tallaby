import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ImageIcon, Star, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

/* Shared building blocks for the dashboard home. Server-safe: no hooks. */

export type Tone = "primary" | "accent" | "success" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-ink",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  danger: "bg-destructive-soft text-destructive",
};

/** Rounded square holding an icon, tinted by tone. */
export function IconTile({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
        TONE_CLASSES[tone],
        className
      )}
    >
      <Icon className="size-[17px]" aria-hidden />
    </span>
  );
}

/** Card surface used by every home section. */
export function HomeCard({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("min-w-0 rounded-2xl border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    />
  );
}

/** Section title row: heading + caption on one side, an optional action on the other. */
export function HomeCardHeader({
  title,
  description,
  action,
  id,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-[18px]">
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-2 text-base font-bold leading-snug">
          {title}
        </h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Quiet "see all" link in a card header. The arrow follows reading direction. */
export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="soft" size="sm" className="text-primary-ink hover:bg-primary-soft hover:text-primary-ink">
      <Link href={href}>
        {children}
        <ArrowLeft className="ltr:rotate-180" aria-hidden />
      </Link>
    </Button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 px-5 py-9 text-center text-[13px] text-muted-foreground",
        className
      )}
    >
      {icon && <IconTile icon={icon} className="mb-1 size-11 rounded-xl" />}
      <b className="text-sm text-foreground">{title}</b>
      <span className="text-pretty">{description}</span>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Period-over-period change pill. `null` means there is nothing to compare to. */
export function DeltaBadge({ value }: { value: number | null }) {
  const flat = value === null || Math.abs(value) < 0.05;
  const up = !flat && value! > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-[3px] rounded-full px-2 font-montserrat text-[11px] font-bold tabular-nums",
        flat && "bg-muted text-faint",
        up && "bg-success-soft text-success",
        !flat && !up && "bg-destructive-soft text-destructive"
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

export function StarRating({ value, label }: { value: number; label?: string }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex gap-px text-accent" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("size-[13px] fill-current", i > filled && "text-border")}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Product thumbnail with a hatched placeholder when there is no image. */
export function ProductThumb({ src, alt = "" }: { src: string | null; alt?: string }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border bg-muted bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklab,var(--border)_70%,transparent)_6px_7px)] text-faint">
      {src ? (
        <Image src={src} alt={alt} width={44} height={44} sizes="44px" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-4" aria-hidden />
      )}
    </span>
  );
}

/** Percent change from `previous` to `current`, or null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}
