import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { EntityAvatar, type EntityKind } from "./entity-avatar";

/**
 * A linked pill naming one related entity: the shared "this connects to that"
 * mark across the admin. `role` says how it relates ("Owner", "Store"), so a
 * row of chips reads as a sentence about the record.
 */
export interface EntityChipProps {
  href: string;
  name: string;
  role?: string;
  /** A person or store avatar; pass `icon` instead for orders, wallets and the like. */
  kind?: EntityKind;
  src?: string | null;
  seed?: string;
  icon?: LucideIcon;
  meta?: string;
  /** A small status dot: green for live, amber for attention, grey for off. */
  tone?: "good" | "warn" | "off";
  className?: string;
}

const TONE = { good: "bg-emerald-500", warn: "bg-amber-500", off: "bg-muted-foreground/50" } as const;

export function EntityChip({ href, name, role, kind, src, seed, icon: Icon, meta, tone, className }: EntityChipProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-8 max-w-full items-center gap-2 rounded-full border bg-card ps-1 pe-3 text-sm",
        "transition-colors hover:border-primary/40 hover:bg-primary-soft",
        "focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
        !kind && Icon && "ps-2.5",
        className,
      )}
    >
      {kind ? (
        <EntityAvatar kind={kind} name={name} src={src} seed={seed} size="xs" className="size-6" />
      ) : Icon ? (
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary-ink" aria-hidden />
      ) : null}
      {role ? <span className="shrink-0 text-muted-foreground">{role}</span> : null}
      <span className="truncate font-medium">{name}</span>
      {meta ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      {tone ? <span className={cn("size-1.5 shrink-0 rounded-full", TONE[tone])} aria-hidden /> : null}
    </Link>
  );
}

/** Chips for a list, showing the first `max` and a count link for the rest. */
export function EntityChipList({
  items,
  max = 3,
  moreHref,
  className,
}: {
  items: EntityChipProps[];
  max?: number;
  moreHref?: string;
  className?: string;
}) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {shown.map((item) => (
        <EntityChip key={item.href} {...item} />
      ))}
      {rest > 0 &&
        (moreHref ? (
          <Link href={moreHref} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {rest} more
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">{rest} more</span>
        ))}
    </div>
  );
}

/** Status dot for a store: live when published, amber when switched off. */
export function storeTone(siteStatus: string, status = "active"): EntityChipProps["tone"] {
  if (status !== "active") return "off";
  if (siteStatus === "published") return "good";
  return siteStatus === "unpublished" ? "warn" : "off";
}
