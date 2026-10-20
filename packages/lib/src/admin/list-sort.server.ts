import { sql, type SQL } from "drizzle-orm";

/** A list sort read from the admin URL (`?sort=name.desc`). */
export interface AdminListSort {
  id: string;
  desc: boolean;
}

/**
 * `ORDER BY` body for an allow-listed sort id: the column, then `tiebreak` so
 * pages stay stable. Unknown ids use `fallback`. Empty values sort last.
 * Only `columns` values reach the SQL; the id itself never does.
 */
export function adminOrderBy(
  sort: AdminListSort | null | undefined,
  columns: Record<string, SQL>,
  fallback: SQL,
  tiebreak: SQL,
): SQL {
  const column = sort && Object.hasOwn(columns, sort.id) ? columns[sort.id] : undefined;
  if (!column) return sql`${fallback}, ${tiebreak}`;
  return sort!.desc
    ? sql`${column} DESC NULLS LAST, ${tiebreak}`
    : sql`${column} ASC NULLS LAST, ${tiebreak}`;
}
