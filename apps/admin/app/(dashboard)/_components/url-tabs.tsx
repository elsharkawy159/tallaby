import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

export interface UrlTab {
  key: string;
  label: string;
  /** Small number shown after the label (open items, errors). Hidden when 0 or absent. */
  count?: number;
}

/**
 * Tabs that are plain links (`?tab=key`), rendered on the server. The page
 * reads `tab` from searchParams and only loads the active tab's data, so a
 * tab nobody opens costs nothing (docs/admin-saas.md §4.1).
 */
export function UrlTabs({
  tabs,
  active,
  baseHref,
  param = "tab",
  keep,
}: {
  tabs: UrlTab[];
  active: string;
  baseHref: string;
  param?: string;
  /** Other query params to carry over (filters). */
  keep?: Record<string, string | null | undefined>;
}) {
  const href = (key: string) => {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(keep ?? {})) if (value) query.set(name, value);
    if (key !== tabs[0]?.key) query.set(param, key);
    const qs = query.toString();
    return qs ? `${baseHref}?${qs}` : baseHref;
  };

  return (
    <nav className="-mx-1 overflow-x-auto" aria-label="Sections">
      <ul className="flex min-w-max gap-1 border-b px-1">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={href(tab.key)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {tab.count ? (
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                    {tab.count.toLocaleString()}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The active tab key from a raw searchParams value, falling back to the first tab. */
export function pickTab<T extends string>(value: string | string[] | undefined, keys: readonly T[]): T {
  const raw = Array.isArray(value) ? value[0] : value;
  return (keys as readonly string[]).includes(raw ?? "") ? (raw as T) : keys[0]!;
}
