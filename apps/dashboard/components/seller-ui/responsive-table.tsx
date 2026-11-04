import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Where a cell sits when the table turns into rows at 720px and below:
 * `title` and `end` share the first line, `sub` and `endSub` the second,
 * `full` takes its own line with its header as a label, `hide` drops it.
 */
export type PhoneSlot = "title" | "end" | "sub" | "endSub" | "full" | "hide";

export type Column<Row> = {
  key: string;
  header: React.ReactNode;
  cell: (row: Row) => React.ReactNode;
  phone?: PhoneSlot;
  className?: string;
  /** Column hidden on small screens only by `phone: "hide"`; this hides it up to 1020px too. */
  wideOnly?: boolean;
};

const PHONE_SLOT: Record<PhoneSlot, string> = {
  title: "max-[720px]:col-start-1 max-[720px]:row-start-1 max-[720px]:min-w-0 max-[720px]:font-semibold",
  end: "max-[720px]:col-start-2 max-[720px]:row-start-1 max-[720px]:text-end",
  sub: "max-[720px]:col-start-1 max-[720px]:row-start-2 max-[720px]:min-w-0 max-[720px]:text-(--s-subtle)",
  endSub: "max-[720px]:col-start-2 max-[720px]:row-start-2 max-[720px]:justify-self-end",
  full: "max-[720px]:col-span-2 max-[720px]:flex max-[720px]:items-center max-[720px]:justify-between max-[720px]:gap-3",
  hide: "max-[720px]:hidden",
};

/**
 * A data table that becomes a list of rows on phones, with no sideways scroll
 * (one DOM, CSS only). Roles are explicit because `display` changes drop them.
 * Works in server components. Pass `rowHref` to make whole rows open a page;
 * controls inside a cell need `relative z-10` to stay clickable.
 */
export function ResponsiveTable<Row>({
  columns,
  rows,
  rowKey,
  rowHref,
  rowLabel,
  label,
  className,
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  rowHref?: (row: Row) => string;
  /** The row link's accessible name; required with `rowHref`. */
  rowLabel?: (row: Row) => string;
  label?: string;
  className?: string;
}) {
  return (
    // A wide table scrolls inside its card from 721px up; below that it is rows and can't overflow.
    <div className="min-[721px]:overflow-x-auto">
    <table
      role="table"
      aria-label={label}
      className={cn("w-full border-collapse text-[13px] max-[720px]:block", className)}
    >
      <thead role="rowgroup" className="max-[720px]:sr-only">
        <tr role="row">
          {columns.map((column) => (
            <th
              key={column.key}
              role="columnheader"
              scope="col"
              className={cn(
                "whitespace-nowrap border-y border-(--s-line-soft) bg-(--s-surface-2) px-[22px] py-2.5 text-start text-xs font-semibold text-(--s-subtle)",
                column.wideOnly && "max-[1020px]:hidden",
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup" className="max-[720px]:block">
        {rows.map((row) => (
          <tr
            key={rowKey(row)}
            role="row"
            className={cn(
              "relative border-b border-(--s-line-soft) transition-colors duration-150 last:border-b-0 hover:bg-(--s-tint)",
              "max-[720px]:grid max-[720px]:grid-cols-[minmax(0,1fr)_auto] max-[720px]:items-center max-[720px]:gap-x-3 max-[720px]:gap-y-1 max-[720px]:px-4 max-[720px]:py-3",
            )}
          >
            {columns.map((column, index) => {
              const slot = column.phone ?? "full";
              return (
                <td
                  key={column.key}
                  role="cell"
                  className={cn(
                    "px-[22px] py-3 text-(--s-text) max-[720px]:p-0",
                    PHONE_SLOT[slot],
                    column.wideOnly && "max-[1020px]:hidden",
                    column.className,
                  )}
                >
                  {rowHref && index === 0 && (
                    <Link
                      href={rowHref(row)}
                      aria-label={rowLabel?.(row)}
                      className="absolute inset-0 rounded-[inherit] focus-visible:outline-offset-[-3px]"
                    />
                  )}
                  {slot === "full" && (
                    <span className="text-xs text-(--s-subtle) min-[721px]:hidden">{column.header}</span>
                  )}
                  {column.cell(row)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
