import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";

/** Shared server-safe pieces of the Admin › Tallaby Pay pages (F-100g). */

export function LoadError({ error }: { error: "forbidden" | "failed" }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-destructive">
        {error === "forbidden"
          ? "You don't have permission to see Tallaby Pay."
          : "Tallaby Pay could not be loaded. Is migration 0175 applied on this database?"}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

const TONE_CLASS = {
  neutral: "bg-muted text-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function Tone({ tone, children }: { tone: keyof typeof TONE_CLASS; children: ReactNode }) {
  return <Badge className={cn("font-medium", TONE_CLASS[tone])}>{children}</Badge>;
}

/** Previous / next links that keep the current filters. */
export function Pager({
  page,
  pageSize,
  total,
  href,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pages">
      <span className="text-muted-foreground tabular-nums">
        Page {page} of {pages} · {total} rows
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page - 1)}>Previous</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < pages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page + 1)}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </nav>
  );
}

/** A GET form: the filters live in the URL, so a page can be shared and reloaded. */
export function FilterForm({
  action,
  from,
  to,
  search,
  searchPlaceholder,
  children,
}: {
  action: string;
  from?: string | null;
  to?: string | null;
  /** Omit to hide the search box. */
  search?: string | null;
  searchPlaceholder?: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3">
      {searchPlaceholder !== undefined && (
        <div className="grid min-w-56 flex-1 gap-1.5">
          <Label htmlFor="tp-search">Search</Label>
          <Input id="tp-search" name="q" defaultValue={search ?? ""} placeholder={searchPlaceholder} maxLength={80} />
        </div>
      )}
      {from !== undefined && (
        <div className="grid gap-1.5">
          <Label htmlFor="tp-from">From</Label>
          <Input id="tp-from" name="from" type="date" defaultValue={from ?? ""} className="w-40" />
        </div>
      )}
      {to !== undefined && (
        <div className="grid gap-1.5">
          <Label htmlFor="tp-to">To</Label>
          <Input id="tp-to" name="to" type="date" defaultValue={to ?? ""} className="w-40" />
        </div>
      )}
      {children}
      <Button type="submit" variant="secondary">
        Apply
      </Button>
      <Button asChild variant="ghost">
        <Link href={action}>Clear</Link>
      </Button>
    </form>
  );
}

/** Pill links for a page's views. */
export function ViewLinks<V extends string>({
  views,
  current,
  href,
  label,
}: {
  views: Record<V, string>;
  current: V;
  href: (view: V) => string;
  label: string;
}) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label={label}>
      {(Object.keys(views) as V[]).map((v) => (
        <Link
          key={v}
          href={href(v)}
          aria-current={current === v ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm",
            current === v ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {views[v]}
        </Link>
      ))}
    </nav>
  );
}
