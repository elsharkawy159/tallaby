"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Table } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  Download,
  FileSpreadsheet,
  LoaderIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  bulkUploadProductsAction,
  bulkInsertProductsAction,
  type ParsedBulkRow,
} from "@/actions/products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  downloadXlsx,
  productsToExcelRows,
  todayStamp,
  PRODUCT_EXCEL_COLUMNS,
  PRODUCT_EXCEL_TEMPLATE_ROW,
} from "@/lib/product-excel";
import type { VendorProduct } from "./vendor-products.section";

export function ImportExportButton({
  table,
}: {
  table: Table<VendorProduct>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tToast = useTranslations("toast");

  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{
    valid: ParsedBulkRow[];
    invalid: { row: number; message: string }[];
  } | null>(null);

  const handleImportClick = () => {
    setMenuOpen(false);
    inputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await bulkUploadProductsAction(formData);
        if (res?.success) {
          setPreview({
            valid: res.valid || [],
            invalid: (res.invalid || []).map((x: any) => ({
              row: x.row,
              message: x.message,
            })),
          });
          setOpen(true);
        } else {
          toast.error(res?.invalid?.[0]?.message || tToast("couldNotParseFile"));
        }
      } catch (err) {
        console.error(err);
        toast.error(tToast("somethingWentWrongWhileParsing"));
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  const handleInsert = () => {
    if (!preview) return;
    startTransition(async () => {
      try {
        const res = await bulkInsertProductsAction(preview.valid);
        if (res?.success) {
          const msg =
            `Inserted ${res.inserted} products` +
            (res.failed ? `, ${res.failed} failed` : "");
          toast.success(msg);
          setOpen(false);
          setPreview(null);
          router.refresh();
        } else {
          toast.error(res?.errors?.[0]?.message || tToast("insertFailed"));
        }
      } catch (err) {
        console.error(err);
        toast.error(tToast("somethingWentWrongWhileInserting"));
      }
    });
  };

  /** Exports what the table currently represents — search filter applied, all pages. */
  const handleExport = async () => {
    setMenuOpen(false);
    const products = table
      .getFilteredRowModel()
      .rows.map((row) => row.original);

    if (products.length === 0) {
      toast.error("There are no products to export.");
      return;
    }

    try {
      await downloadXlsx(productsToExcelRows(products), {
        fileName: `vendor-products-${todayStamp()}.xlsx`,
        header: PRODUCT_EXCEL_COLUMNS,
      });
      toast.success(`Exported ${products.length} products`);
    } catch (err) {
      console.error(err);
      toast.error("Could not export the products sheet.");
    }
  };

  const handleDownloadTemplate = async () => {
    setMenuOpen(false);
    try {
      await downloadXlsx([PRODUCT_EXCEL_TEMPLATE_ROW], {
        fileName: "tallaby-products-template.xlsx",
        header: PRODUCT_EXCEL_COLUMNS,
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not download the template.");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="default" disabled={isPending}>
            {isPending ? (
              <LoaderIcon className="-ms-1 animate-spin" size={16} />
            ) : (
              <FileSpreadsheet
                className="-ms-1 opacity-60"
                size={16}
                aria-hidden="true"
              />
            )}
            Import / Export
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="end">
          <Button
            variant="ghost"
            className="w-full justify-start font-normal"
            onClick={handleImportClick}
          >
            <Upload className="opacity-60" size={16} aria-hidden="true" />
            Import Products
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start font-normal"
            onClick={handleExport}
          >
            <Download className="opacity-60" size={16} aria-hidden="true" />
            Export Products
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start font-normal"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet
              className="opacity-60"
              size={16}
              aria-hidden="true"
            />
            Download Template
          </Button>
        </PopoverContent>
      </Popover>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk upload preview</DialogTitle>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    Valid: <strong>{preview.valid.length}</strong>
                  </span>
                  <span>
                    Invalid: <strong>{preview.invalid.length}</strong>
                  </span>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Title</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-left p-2">CategoryId</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Variants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(preview.valid || []).map((r) => (
                        <tr key={`valid-${r.row}`} className="border-t">
                          <td className="p-2">{r.row}</td>
                          <td className="p-2">{r.product.title}</td>
                          <td className="p-2">{r.product.sku}</td>
                          <td className="p-2">{r.product.categoryId}</td>
                          <td className="p-2">{`{base:${r.product.price.base}, list:${r.product.price.list}, final:${r.product.price.final}}`}</td>
                          <td className="p-2">{r.variants?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {preview.invalid.length > 0 && (
                <div className="border rounded-md p-3 bg-red-50">
                  <div className="font-medium text-red-700 mb-2">
                    Invalid rows
                  </div>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1 max-h-40 overflow-auto">
                    {preview.invalid.map((e) => (
                      <li key={`err-${e.row}`}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                    {preview.invalid.length > 10 && (
                      <li>+{preview.invalid.length - 10} more…</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsert}
              disabled={isPending || !preview || preview.valid.length === 0}
            >
              {isPending ? <LoaderIcon className="animate-spin" /> : "Insert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
