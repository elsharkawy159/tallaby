/**
 * URL <-> table-state contract shared by server pages (parse) and the client
 * `useTableUrlState` hook (write). Kept free of "use client"/"use server" so
 * both sides can import it.
 *
 * URL shape: ?page=2&pageSize=20&sort=createdAt.desc&search=foo&status=a,b
 */

export const PAGE_PARAM = "page";
export const PAGE_SIZE_PARAM = "pageSize";
export const SORT_PARAM = "sort";
export const SEARCH_PARAM = "search";

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const MAX_PAGE_SIZE = 100;

/** Multi-value params are comma-separated in the URL. */
export const LIST_SEPARATOR = ",";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface TableSort<TId extends string = string> {
  id: TId;
  desc: boolean;
}

export interface TableQuery<
  TFilter extends string = string,
  TSort extends string = string,
> {
  /** 1-based page number. */
  page: number;
  pageSize: number;
  offset: number;
  sort: TableSort<TSort> | null;
  search: string;
  /** Every declared filter key, as a list (empty when unset). */
  filters: Record<TFilter, string[]>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseList(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(LIST_SEPARATOR) : value;
  if (!raw) return [];
  return raw
    .split(LIST_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeSort(sort: TableSort | null | undefined): string | null {
  if (!sort) return null;
  return `${sort.id}.${sort.desc ? "desc" : "asc"}`;
}

export function parseSort(value: string | null | undefined): TableSort | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const dir = value.slice(dot + 1);
  if (dir !== "asc" && dir !== "desc") return null;
  return { id, desc: dir === "desc" };
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseTableSearchParams<
  TFilter extends string = never,
  TSort extends string = string,
>(
  searchParams: RawSearchParams,
  options: {
    filters?: readonly TFilter[];
    /** Whitelist of sortable ids; anything else falls back to `defaultSort`. */
    sortable?: readonly TSort[];
    defaultSort?: TableSort<TSort> | null;
    defaultPageSize?: number;
  } = {}
): TableQuery<TFilter, TSort> {
  const pageSize = Math.min(
    toPositiveInt(first(searchParams[PAGE_SIZE_PARAM]), options.defaultPageSize ?? DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const page = toPositiveInt(first(searchParams[PAGE_PARAM]), 1);

  const parsedSort = parseSort(first(searchParams[SORT_PARAM]));
  const sort =
    parsedSort &&
    (!options.sortable || options.sortable.includes(parsedSort.id as TSort))
      ? (parsedSort as TableSort<TSort>)
      : (options.defaultSort ?? null);

  const filters = {} as Record<TFilter, string[]>;
  for (const key of options.filters ?? []) {
    filters[key] = parseList(searchParams[key]);
  }

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    sort,
    search: (first(searchParams[SEARCH_PARAM]) ?? "").trim(),
    filters,
  };
}

/** Keep only values that belong to an allowed set (drops junk from the URL). */
export function pickAllowed<T extends string>(
  values: readonly string[],
  allowed: readonly T[]
): T[] {
  return values.filter((value): value is T =>
    (allowed as readonly string[]).includes(value)
  );
}

/** `YYYY-MM-DD` → ISO bound, or undefined. `endOfDay` makes the bound inclusive. */
export function parseDateParam(
  value: string | string[] | undefined,
  endOfDay = false
): string | undefined {
  const raw = first(value);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}
