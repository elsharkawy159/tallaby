"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowDownUp,
  Download,
  FileSpreadsheet,
  LoaderIcon,
  RefreshCw,
  Sparkles,
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
import { IconTile, Modal, SellerButton } from "@/components/seller-ui";
import {
  downloadXlsx,
  productsToExcelRows,
  todayStamp,
  PRODUCT_EXCEL_COLUMNS,
  PRODUCT_EXCEL_TEMPLATE_ROW,
} from "@/lib/product-excel";
import { ExcelUpdateDialog } from "../excel-update/excel-update.client";
import { exportFilteredProductsAction, listFilteredProductIdsAction } from "./products-list.server";
import type { ProductsListFilters } from "./products-view.lib";
import { useProductStoreId } from "@/app/(main)/products/_components/product-store.client";

const IO_CARD =
  "flex cursor-pointer flex-col items-start gap-1 rounded-[18px] border-[1.5px] border-(--s-field) bg-(--s-surface) p-4 text-start no-underline transition-[border-color,box-shadow] duration-150 hover:border-(--s-primary) hover:shadow-(--s-shadow-card-hover) [&>*:first-child]:mb-1.5";

export function ImportExportButton({
  filters,
  total,
}: {
  /** What the page currently shows (tab, search and category applied). */
  filters: ProductsListFilters;
  /** How many products those filters match, across all pages. */
  total: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tToast = useTranslations("toast");
  const productStoreId = useProductStoreId();
  const t = useTranslations("products.importExport");
  const tBulk = useTranslations("bulkFileImport");

  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateIds, setUpdateIds] = useState<string[]>([]);
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
        const res = await bulkInsertProductsAction(productStoreId, preview.valid);
        if (res?.success) {
          toast.success(
            res.failed
              ? t("insertedWithFailures", {
                  inserted: res.inserted,
                  failed: res.failed,
                })
              : t("inserted", { inserted: res.inserted })
          );
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

  /** Exports what the page currently shows: filters applied, all pages. */
  const handleExport = () => {
    setMenuOpen(false);
    if (total === 0) {
      toast.error(t("nothingToExport"));
      return;
    }

    startTransition(async () => {
      try {
        const res = await exportFilteredProductsAction(filters);
        if (!res.success) {
          toast.error(t("exportFailed"));
          return;
        }
        await downloadXlsx(productsToExcelRows(res.products), {
          fileName: `vendor-products-${todayStamp()}.xlsx`,
          header: PRODUCT_EXCEL_COLUMNS,
        });
        toast.success(t("exported", { count: res.products.length }));
      } catch (err) {
        console.error(err);
        toast.error(t("exportFailed"));
      }
    });
  };

  /** "Update from Excel" works on every filtered product, not one page. */
  const handleOpenUpdate = () => {
    setMenuOpen(false);
    startTransition(async () => {
      const res = await listFilteredProductIdsAction(filters);
      if (!res.success) {
        toast.error(t("exportFailed"));
        return;
      }
      setUpdateIds(res.ids);
      setUpdateOpen(true);
    });
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
      toast.error(t("templateFailed"));
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

      <SellerButton variant="outline" disabled={isPending} onClick={() => setMenuOpen(true)}>
        {isPending ? <LoaderIcon className="animate-spin" aria-hidden /> : <ArrowDownUp aria-hidden />}
        {t("trigger")}
      </SellerButton>

      <Modal open={menuOpen} onOpenChange={setMenuOpen} title={t("trigger")} description={t("modalBody")} width={520}>
        <div className="grid grid-cols-2 gap-2.5 max-[480px]:grid-cols-1">
          <Link href="/products/add/from-file" className={IO_CARD}>
            <IconTile icon={Sparkles} tone="accent" />
            <b className="text-sm font-bold text-(--s-ink)">{tBulk("title")}</b>
            <small className="text-xs leading-[1.6] text-(--s-subtle)">{tBulk("entryBody")}</small>
          </Link>
          <button type="button" className={IO_CARD} onClick={handleImportClick}>
            <IconTile icon={Upload} tone="primary" />
            <b className="text-sm font-bold text-(--s-ink)">{t("import")}</b>
            <small className="text-xs leading-[1.6] text-(--s-subtle)">{t("importBody")}</small>
          </button>
          <button type="button" className={IO_CARD} onClick={handleExport}>
            <IconTile icon={Download} tone="primary" />
            <b className="text-sm font-bold text-(--s-ink)">{t("export")}</b>
            <small className="text-xs leading-[1.6] text-(--s-subtle)">{t("exportBody")}</small>
          </button>
          <button type="button" className={IO_CARD} onClick={handleOpenUpdate}>
            <IconTile icon={RefreshCw} tone="primary" />
            <b className="text-sm font-bold text-(--s-ink)">{t("updateFromExcel")}</b>
            <small className="text-xs leading-[1.6] text-(--s-subtle)">{t("updateBody")}</small>
          </button>
          <button type="button" className={IO_CARD} onClick={handleDownloadTemplate}>
            <IconTile icon={FileSpreadsheet} tone="neutral" />
            <b className="text-sm font-bold text-(--s-ink)">{t("downloadTemplate")}</b>
            <small className="text-xs leading-[1.6] text-(--s-subtle)">{t("templateBody")}</small>
          </button>
        </div>
      </Modal>

      <ExcelUpdateDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        productIds={updateIds}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("previewTitle")}</DialogTitle>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    {t("valid")}: <strong>{preview.valid.length}</strong>
                  </span>
                  <span>
                    {t("invalid")}: <strong>{preview.invalid.length}</strong>
                  </span>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-start p-2">{t("columns.row")}</th>
                        <th className="text-start p-2">{t("columns.title")}</th>
                        <th className="text-start p-2">{t("columns.sku")}</th>
                        <th className="text-start p-2">{t("columns.categoryId")}</th>
                        <th className="text-start p-2">{t("columns.price")}</th>
                        <th className="text-start p-2">{t("columns.variants")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(preview.valid || []).map((r) => (
                        <tr key={`valid-${r.row}`} className="border-t">
                          <td className="p-2">{r.row}</td>
                          <td className="p-2">{r.product.title}</td>
                          <td className="p-2" dir="ltr">{r.product.sku}</td>
                          <td className="p-2" dir="ltr">{r.product.categoryId}</td>
                          <td className="p-2" dir="ltr">{`{base:${r.product.price.base}, list:${r.product.price.list}, final:${r.product.price.final}}`}</td>
                          <td className="p-2">{r.variants?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {preview.invalid.length > 0 && (
                <div className="border rounded-md p-3 bg-red-50 dark:bg-red-950/40">
                  <div className="font-medium text-red-700 dark:text-red-300 mb-2">
                    {t("invalidRows")}
                  </div>
                  <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm space-y-1 max-h-40 overflow-auto">
                    {preview.invalid.map((e) => (
                      <li key={`err-${e.row}`}>
                        {t("rowError", { row: e.row, message: e.message })}
                      </li>
                    ))}
                    {preview.invalid.length > 10 && (
                      <li>{t("more", { count: preview.invalid.length - 10 })}</li>
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
              {t("cancel")}
            </Button>
            <Button
              onClick={handleInsert}
              disabled={isPending || !preview || preview.valid.length === 0}
            >
              {isPending ? <LoaderIcon className="animate-spin" /> : t("insert")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
