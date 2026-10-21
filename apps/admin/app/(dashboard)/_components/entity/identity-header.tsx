import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { EntityAvatar, type EntityKind } from "./entity-avatar";
import { EntityChip, type EntityChipProps } from "./entity-chip";

/**
 * The top of every entity page: who or what this is, and a row of chips for
 * everything it connects to. Customer, seller, store, order and product pages
 * all open the same way, so moving between them always feels like one map.
 */
export function IdentityHeader({
  back,
  title,
  subtitle,
  avatar,
  icon: Icon,
  badges,
  relations = [],
  actions,
  className,
}: {
  back: { href: string; label: string };
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** A person or store image; use `icon` for orders and products. */
  avatar?: { kind: EntityKind; name: string; src?: string | null; seed?: string };
  icon?: LucideIcon;
  badges?: React.ReactNode;
  relations?: EntityChipProps[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      <Link
        href={back.href}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        {back.label}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {avatar ? (
            <EntityAvatar kind={avatar.kind} name={avatar.name} src={avatar.src} seed={avatar.seed} size="lg" />
          ) : Icon ? (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
              <Icon className="size-6" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0 space-y-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
              <span className="min-w-0 break-words">{title}</span>
              {badges}
            </h1>
            {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {relations.length > 0 ? (
        <nav aria-label="Related" className="flex flex-wrap items-center gap-2 border-t border-dashed pt-4">
          {relations.map((chip) => (
            <EntityChip key={`${chip.role ?? ""}${chip.href}`} {...chip} />
          ))}
        </nav>
      ) : null}
    </header>
  );
}
