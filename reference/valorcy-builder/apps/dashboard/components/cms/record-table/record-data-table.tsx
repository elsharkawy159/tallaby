"use client"

import { useEffect, useState, useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { notify } from "@/services/toast"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"
import { buildRecordColumns, type SortState } from "./columns"
import { RecordTableToolbar } from "./record-table-toolbar"
import { initialColumnVisibility, type ColumnVisibility } from "./column-picker"
import { RecordSheet } from "@/components/cms/record-editor/record-sheet"
import { listItemsAction, bulkItemAction, getItemAction } from "@/actions/cms/item-actions"
import type { CmsCollection, CmsItemListItem, CmsItemWithRelations } from "@/types/cms/cms.types"

interface RecordDataTableProps {
  collection: CmsCollection
  initialItems: CmsItemListItem[]
  initialTotal: number
  projectId: string
}

const PER_PAGE = 20

export function RecordDataTable({ collection, initialItems, initialTotal, projectId }: RecordDataTableProps) {
  const t = useTranslations('cms.recordTable')
  const locale = useLocale()
  const [items, setItems] = useState(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [activeItem, setActiveItem] = useState<CmsItemWithRelations | null>(null)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => initialColumnVisibility(collection))
  const [sort, setSort] = useState<SortState>(() => ({
    key: collection.settings?.defaultSort?.fieldKey ?? null,
    dir: collection.settings?.defaultSort?.dir ?? "desc",
  }))
  const [, startTransition] = useTransition()

  const refresh = (opts: { search?: string; status?: string; page?: number; sort?: SortState }) => {
    const nextSearch = opts.search ?? search
    const nextStatus = opts.status ?? status
    const nextPage = opts.page ?? page
    const nextSort = opts.sort ?? sort

    startTransition(async () => {
      const result = await listItemsAction({
        collectionId: collection.id,
        projectId,
        search: nextSearch || undefined,
        status: nextStatus === "all" ? undefined : nextStatus,
        page: nextPage,
        perPage: PER_PAGE,
        sortKey: nextSort.key ?? undefined,
        sortDir: nextSort.dir,
      })
      setItems(result.items)
      setTotal(result.total)
      setRowSelection({})
    })
  }

  const handleSort = (key: string) => {
    const next: SortState = sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    setSort(next)
    refresh({ sort: next })
  }

  const visibleKeys = collection.fields.filter((f) => columnVisibility[f.key]).map((f) => f.key)
  const columns = buildRecordColumns(collection, { visibleKeys, sort, onSort: handleSort, t, locale })

  useEffect(() => {
    setItems(initialItems)
    setTotal(initialTotal)
    setRowSelection({})
    setColumnVisibility(initialColumnVisibility(collection))
  }, [collection, initialItems, initialTotal])

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection },
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  })

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const handleBulkAction = (action: "publish" | "unpublish" | "archive" | "delete") => {
    if (!selectedIds.length) return
    startTransition(async () => {
      await bulkItemAction({ projectId, collectionId: collection.id, ids: selectedIds, action })
      notify.success(t('toastBulkUpdated', { count: selectedIds.length }))
      refresh({})
    })
  }

  const openItem = (id: string) => {
    startTransition(async () => {
      const item = await getItemAction(id, projectId)
      if (item) setActiveItem(item)
    })
  }

  return (
    <div className="space-y-4">
      <RecordTableToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); refresh({ search: v, page: 1 }) }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); refresh({ status: v, page: 1 }) }}
        projectId={projectId}
        collection={collection}
        selectedCount={selectedIds.length}
        onBulkAction={handleBulkAction}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-no-row-click]')) return
                    openItem(row.original.id)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} data-no-row-click={cell.column.id === "select" ? true : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                  {t('noRecords')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('recordCount', { count: total })}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => { setPage(page - 1); refresh({ page: page - 1 }) }}
              disabled={page <= 1}
              aria-label={t('previousPage')}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => { setPage(page + 1); refresh({ page: page + 1 }) }}
              disabled={page >= totalPages}
              aria-label={t('nextPage')}
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      <RecordSheet
        item={activeItem}
        collection={collection}
        projectId={projectId}
        open={!!activeItem}
        onOpenChange={(open) => { if (!open) setActiveItem(null) }}
        onSaved={() => { refresh({}) }}
      />
    </div>
  )
}
