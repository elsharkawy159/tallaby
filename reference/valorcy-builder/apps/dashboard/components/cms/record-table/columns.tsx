"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { useTranslations } from "next-intl"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { formatDate } from "@workspace/i18n"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Badge } from "@workspace/ui/components/badge"
import { ITEM_STATUS_META } from "@/lib/cms/field-meta"
import { FIELD_CELLS } from "@/components/cms/field-cells"
import type { CmsCollection, CmsItemListItem } from "@/types/cms/cms.types"

export interface SortState {
  key: string | null
  dir: "asc" | "desc"
}

interface BuildColumnsOptions {
  visibleKeys: string[]
  sort: SortState
  onSort: (key: string) => void
  /** Translator scoped to `cms.recordTable`, and the active app locale — plain
   * column-def functions aren't components, so hooks can't be called inside them. */
  t: ReturnType<typeof useTranslations<"cms.recordTable">>
  locale: string
}

function SortHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: string; sort: SortState; onSort: (key: string) => void }) {
  const active = sort.key === sortKey
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="-ms-2 flex items-center gap-1 rounded px-2 py-1 text-start hover:text-foreground"
    >
      {label}
      <Icon className={`size-3.5 ${active ? "text-foreground" : "text-muted-foreground/50"}`} />
    </button>
  )
}

export function buildRecordColumns(
  collection: CmsCollection,
  { visibleKeys, sort, onSort, t, locale }: BuildColumnsOptions
): ColumnDef<CmsItemListItem>[] {
  const visible = new Set(visibleKeys)
  const tableFields = collection.fields.filter((f) => visible.has(f.key))

  const columns: ColumnDef<CmsItemListItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label={t('selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={t('selectRow')}
        />
      ),
      enableSorting: false,
      size: 36,
    },
  ]

  for (const field of tableFields) {
    columns.push({
      id: field.key,
      accessorFn: (row) => row.data[field.key],
      header: () => <SortHeader label={field.label} sortKey={field.key} sort={sort} onSort={onSort} />,
      cell: ({ row }) => {
        const Cell = FIELD_CELLS[field.type] ?? FIELD_CELLS.text!
        return <Cell field={field} value={row.original.data[field.key]} references={row.original.references[field.key]} />
      },
    })
  }

  columns.push(
    {
      id: "status",
      accessorKey: "status",
      header: () => <SortHeader label={t('statusColumn')} sortKey="status" sort={sort} onSort={onSort} />,
      cell: ({ row }) => {
        const meta = ITEM_STATUS_META[row.original.status]
        return (
          <Badge variant="secondary" className={`font-normal ${meta?.color ?? ""}`}>
            {meta?.label ?? row.original.status}
          </Badge>
        )
      },
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: () => <SortHeader label={t('updatedColumn')} sortKey="updatedAt" sort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.updatedAt, locale)}
        </span>
      ),
    }
  )

  return columns
}
